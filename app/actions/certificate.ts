"use server"

import { db } from "@/lib/db"
import { certificate, type Certificate } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"

const EDITABLE_FIELDS = [
  "ccrNumber",
  "status",
  "certificateType",
  "applicant",
  "manufacturer",
  "manufacturerAddress",
  "brand",
  "model",
  "modelYear",
  "vehicleCategory",
  "countryOfOrigin",
  "countryOfProduction",
  "vehicleType",
  "vin",
  "manufacturerRef",
  "producedAfter",
  "engineNumber",
  "techRegulations",
  "maxVehicleWeight",
  "curbWeight",
  "maxAxleFront",
  "maxAxleRear",
  "lengthMm",
  "widthMm",
  "heightMm",
  "wheelbaseMm",
  "trackFront",
  "trackRear",
  "chassisBodyType",
  "numPassengers",
  "fuelType",
  "numberOfCylinders",
  "engineCapacity",
  "airIntake",
  "netEnginePower",
  "engineRpm",
  "pollutantLimit",
  "transmission",
  "ecallSystem",
  "serviceBrakes",
  "emergencyBrakes",
  "fuelVehicleClass",
  "feCafeCombined",
  "feRating",
  "color",
  "issueDate",
  "expiryDate",
  "notes",
  // Export / facturation
  "exporterName",
  "exporterAddress",
  "consigneeName",
  "consigneeAddress",
  "destinationCountry",
  "meansOfTransport",
  "portOfDischarge",
  "departureDate",
  "invoiceNumber",
  "invoiceDate",
  "originCertNumber",
  "originCertDate",
  "priceUsd",
  "priceWords",
  "numDoors",
  "numSeats",
] as const

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const cleanBase = base || "certificat"
  let candidate = cleanBase
  let n = 1
  // Loop until we find a slug not used by another row
  while (true) {
    const rows = await db.select({ id: certificate.id }).from(certificate).where(eq(certificate.slug, candidate)).limit(1)
    const taken = rows[0] && rows[0].id !== excludeId
    if (!taken) return candidate
    n += 1
    candidate = `${cleanBase}-${n}`
  }
}

export async function listCertificates(): Promise<Certificate[]> {
  return db.select().from(certificate).orderBy(desc(certificate.createdAt))
}

export async function getCertificateBySlug(slug: string): Promise<Certificate | null> {
  const rows = await db.select().from(certificate).where(eq(certificate.slug, slug)).limit(1)
  return rows[0] ?? null
}

export async function getCertificateById(id: number): Promise<Certificate | null> {
  const rows = await db.select().from(certificate).where(eq(certificate.id, id)).limit(1)
  return rows[0] ?? null
}

function readFields(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of EDITABLE_FIELDS) {
    const value = formData.get(field)
    values[field] = typeof value === "string" ? value : ""
  }
  return values
}

export async function createCertificate(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized")
  }
  const values = readFields(formData)
  const base = slugify(values.ccrNumber || `${values.brand}-${values.model}`)
  const slug = await uniqueSlug(base)

  // Auto-generate a random invoice number and Dubai Chamber certificate number if left blank.
  if (!values.invoiceNumber.trim()) {
    const yr = new Date().getFullYear()
    const rand = String(Math.floor(1000 + Math.random() * 9000))
    const seq = String(Math.floor(10 + Math.random() * 90))
    values.invoiceNumber = `${yr}PIOO${rand}-${seq}`
  }
  if (!values.originCertNumber.trim()) {
    values.originCertNumber = String(Math.floor(1000000 + Math.random() * 9000000))
  }

  const inserted = await db
    .insert(certificate)
    .values({ ...values, slug })
    .returning({ id: certificate.id })

  revalidatePath("/admin")
  redirect(`/admin/${inserted[0].id}`)
}

export async function updateCertificate(id: number, formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized")
  }
  const values = readFields(formData)

  const existing = await getCertificateById(id)
  if (!existing) throw new Error("Certificat introuvable")

  await db
    .update(certificate)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(certificate.id, id))

  revalidatePath(`/certificate/${existing.slug}`)
  revalidatePath("/admin")
  revalidatePath(`/admin/${id}`)
  return { success: true }
}

export async function deleteCertificate(id: number) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized")
  }
  await db.delete(certificate).where(eq(certificate.id, id))
  revalidatePath("/admin")
  redirect("/admin")
}
