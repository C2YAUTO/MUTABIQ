"use client"

import { useRef, useState, useTransition } from "react"
import { createCertificate, updateCertificate, deleteCertificate } from "@/app/actions/certificate"
import { decodeVin } from "@/app/actions/vin"
import { Button } from "@/components/ui/button"
import type { Certificate } from "@/lib/db/schema"
import { Check, ExternalLink, Trash2, ArrowLeft, ScanLine, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

/** Standard GSO technical regulations list used on GCC conformity certificates. */
const DEFAULT_GSO_REGULATIONS =
  "Will satisfy the GSO Technical Regulations Nos: 34:2007, 35:2007, 36:2005, 37:2012, 38:2005, 39:2005, 40:2011, 42:2015, 48:1984, 51:2007, 52:2007, 53:2007, 95:1988, 97:1988, 98:1988, 99:1988, 135:2007, 136:2007, 209:1994, 419:1994, 420:1994, 421:2005, 422:2005, 105:2000, 130:2000, 150:2010, 158:2002, 164:2002, 167:2003, 168:2003, 182:2003, 162:2003, 178:2000, 178:2010, 178:2006, 178:2008, 184:2006, GSO ISO 1585:2008, GSO ISO 3537:2008, GSO ISO 3538:1997, GSO ECE 13H:2012, GSO ECE 13H-3:2012, GSO ECE 13H-4:2012, GSO ECE 13H-6:2012 and the standards in the country of origin accepted by GSO in the case that no GSO technical regulations and standards are available."

type Field = { name: keyof Certificate; label: string; type?: "text" | "textarea" }

const FIELD_GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Header & manufacturer",
    fields: [
      { name: "ccrNumber", label: "Certificate number (CCR)" },
      { name: "status", label: "Status (Valid / Expired / Revoked)" },
      { name: "certificateType", label: "Certificate type (e.g. Motor Vehicles)" },
      { name: "manufacturer", label: "Manufacturer" },
      { name: "brand", label: "Brand (for the logo, e.g. Suzuki)" },
      { name: "manufacturerAddress", label: "Manufacturer address", type: "textarea" },
      { name: "applicant", label: "Applicant" },
    ],
  },
  {
    title: "Vehicle identification",
    fields: [
      { name: "vehicleType", label: "Type (e.g. SUZUKI JIMNY – 5 DOOR)" },
      { name: "model", label: "Model" },
      { name: "modelYear", label: "Model year" },
      { name: "vehicleCategory", label: "Category (e.g. Multipurpose Vehicle)" },
      { name: "countryOfOrigin", label: "Country of origin" },
      { name: "countryOfProduction", label: "Country of production" },
      { name: "manufacturerRef", label: "Manufacturer Ref No. (e.g. Euro4)" },
      { name: "producedAfter", label: "Produced from (e.g. Month 6 Year 2025)" },
      { name: "engineNumber", label: "Engine number" },
      { name: "color", label: "Color" },
    ],
  },
  {
    title: "Technical regulations",
    fields: [{ name: "techRegulations", label: "GSO regulations list", type: "textarea" }],
  },
  {
    title: "1. Weights",
    fields: [
      { name: "maxVehicleWeight", label: "Maximum vehicle weight" },
      { name: "curbWeight", label: "Curb weight" },
      { name: "maxAxleFront", label: "Max front axle load" },
      { name: "maxAxleRear", label: "Max rear axle load" },
    ],
  },
  {
    title: "2. Dimensions",
    fields: [
      { name: "lengthMm", label: "Length" },
      { name: "widthMm", label: "Width" },
      { name: "heightMm", label: "Height" },
      { name: "wheelbaseMm", label: "Wheelbase (F1-R1)" },
      { name: "trackFront", label: "Front track" },
      { name: "trackRear", label: "Rear track" },
    ],
  },
  {
    title: "3-4. Chassis & passengers",
    fields: [
      { name: "chassisBodyType", label: "Chassis and body type" },
      { name: "numPassengers", label: "Number of passengers (driver included)" },
    ],
  },
  {
    title: "5. Engine",
    fields: [
      { name: "fuelType", label: "Fuel type (e.g. Gasoline)" },
      { name: "numberOfCylinders", label: "Cylinders" },
      { name: "engineCapacity", label: "Displacement" },
      { name: "airIntake", label: "Air intake" },
      { name: "netEnginePower", label: "Net engine power (kW)" },
      { name: "engineRpm", label: "Engine speed (rpm)" },
      { name: "pollutantLimit", label: "Emission standard (e.g. Euro4)" },
    ],
  },
  {
    title: "6-7. Transmission & eCall",
    fields: [
      { name: "transmission", label: "Transmission" },
      { name: "ecallSystem", label: "eCall system (SOS)" },
    ],
  },
  {
    title: "8. Brakes",
    fields: [
      { name: "serviceBrakes", label: "Service brakes" },
      { name: "emergencyBrakes", label: "Emergency brakes" },
    ],
  },
  {
    title: "9. Fuel economy",
    fields: [
      { name: "fuelVehicleClass", label: "Vehicle class" },
      { name: "feCafeCombined", label: "FE (CAFE) combined" },
      { name: "feRating", label: "Rating (e.g. Excellent)" },
    ],
  },
  {
    title: "Validity",
    fields: [
      { name: "issueDate", label: "Issue date" },
      { name: "expiryDate", label: "Expiry date" },
    ],
  },
  {
    title: "10. Other information",
    fields: [{ name: "notes", label: "Notes / general standards", type: "textarea" }],
  },
  {
    title: "Export / invoicing (full dossier)",
    fields: [
      { name: "exporterName", label: "Exporter name" },
      { name: "exporterAddress", label: "Exporter address", type: "textarea" },
      { name: "consigneeName", label: "Customer / consignee name" },
      { name: "consigneeAddress", label: "Customer address", type: "textarea" },
      { name: "destinationCountry", label: "Country of export / final destination" },
      { name: "meansOfTransport", label: "Means of transport (e.g. By Sea)" },
      { name: "portOfDischarge", label: "Port of discharge" },
      { name: "departureDate", label: "Estimated date of departure" },
      { name: "invoiceNumber", label: "Invoice No. (auto if blank)" },
      { name: "invoiceDate", label: "Invoice date (e.g. 11/06/2026)" },
      { name: "originCertNumber", label: "Certificate of Origin No. (auto if blank)" },
      { name: "originCertDate", label: "Certificate of Origin date (e.g. 11-JUN-2026)" },
      { name: "priceUsd", label: "Vehicle price (USD, e.g. 24,500.00)" },
      { name: "priceWords", label: "Amount in words" },
      { name: "numSeats", label: "Number of seats" },
      { name: "numDoors", label: "Number of doors" },
    ],
  },
]

export function AdminEditForm({ cert }: { cert: Certificate | null }) {
  const isEdit = cert !== null
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [saved, setSaved] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const [vin, setVin] = useState(String(cert?.vin ?? ""))
  const [decoding, setDecoding] = useState(false)
  const [decodeMsg, setDecodeMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  /** Set an uncontrolled form field's value by its name attribute. */
  function setField(name: keyof Certificate, value: string) {
    if (!value) return
    const el = formRef.current?.elements.namedItem(String(name)) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null
    if (el) el.value = value
  }

  async function handleDecode() {
    const code = vin.trim().toUpperCase()
    if (code.length < 11) {
      setDecodeMsg({ type: "err", text: "Enter a valid VIN (usually 17 characters)." })
      return
    }
    setDecoding(true)
    setDecodeMsg(null)
    try {
      const result = await decodeVin(code)

      if (!result.ok || !result.fields) {
        setDecodeMsg({
          type: "err",
          text: result.error ?? "Could not decode this VIN. Fill in the fields manually.",
        })
        return
      }

      // Apply every field returned by the Vincario mapping.
      for (const [name, value] of Object.entries(result.fields)) {
        setField(name as keyof Certificate, value)
      }

      // Always pre-fill the standard GSO technical regulations list.
      setField("techRegulations", DEFAULT_GSO_REGULATIONS)

      const filled = [...(result.filled ?? []), "GSO regulations"]
      setDecodeMsg({
        type: "ok",
        text: `Pre-filled: ${filled.join(", ")}. Review and complete the remaining technical fields.`,
      })
    } catch {
      setDecodeMsg({
        type: "err",
        text: "Could not decode this VIN. Check your connection or fill in the fields manually.",
      })
    } finally {
      setDecoding(false)
    }
  }

  function handleSubmit(formData: FormData) {
    setSaved(false)
    startTransition(async () => {
      if (isEdit) {
        await updateCertificate(cert!.id, formData)
        setSaved(true)
      } else {
        await createCertificate(formData)
      }
    })
  }

  function handleDelete() {
    if (!isEdit) return
    if (!window.confirm("Permanently delete this certificate? Its QR code will stop working.")) return
    startDelete(async () => {
      await deleteCertificate(cert!.id)
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link href="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" />
              All certificates
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground text-balance">
            {isEdit ? "Edit certificate" : "New certificate"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Edit the information shown on the public page."
              : "Fill in the information and save to generate the QR code."}
          </p>
        </div>
        {isEdit ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/certificate/${cert!.slug}`} target="_blank">
                <ExternalLink className="mr-1 h-4 w-4" />
                View page
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mb-6 rounded-lg border border-border bg-secondary/40 p-5">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Automatic VIN decoding</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter the VIN and decode to pre-fill the brand, model, year and some engine data
          (source: NHTSA). The remaining technical fields must be completed manually.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="vin" className="mb-1 block text-sm font-medium text-foreground">
              VIN number
            </label>
            <input
              id="vin"
              name="vin"
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              maxLength={17}
              placeholder="e.g. JS3JB43V5N4100001"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm uppercase tracking-wide text-foreground outline-none ring-ring focus:ring-2"
            />
          </div>
          <Button type="button" variant="outline" onClick={handleDecode} disabled={decoding}>
            {decoding ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Decoding…
              </>
            ) : (
              <>
                <ScanLine className="mr-1 h-4 w-4" />
                Decode VIN
              </>
            )}
          </Button>
        </div>
        {decodeMsg ? (
          <p
            className={`mt-3 flex items-start gap-1.5 text-xs ${
              decodeMsg.type === "ok" ? "text-green-700" : "text-destructive"
            }`}
          >
            {decodeMsg.type === "ok" ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            {decodeMsg.text}
          </p>
        ) : null}
      </div>

      <div className="space-y-6">
        {FIELD_GROUPS.map((group) => (
          <fieldset key={group.title} className="rounded-lg border border-border bg-card p-5">
            <legend className="px-2 text-sm font-semibold text-foreground">{group.title}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => {
                const value = String(cert?.[field.name] ?? "")
                return (
                  <div
                    key={String(field.name)}
                    className={field.type === "textarea" ? "sm:col-span-2" : undefined}
                  >
                    <label
                      htmlFor={String(field.name)}
                      className="mb-1 block text-sm font-medium text-foreground"
                    >
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={String(field.name)}
                        name={String(field.name)}
                        defaultValue={value}
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
                      />
                    ) : (
                      <input
                        id={String(field.name)}
                        name={String(field.name)}
                        type="text"
                        defaultValue={value}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="sticky bottom-4 mt-6 flex items-center justify-end gap-3 rounded-lg border border-border bg-card/95 p-4 backdrop-blur">
        {saved ? (
          <span className="flex items-center gap-1 text-sm font-medium text-primary">
            <Check className="h-4 w-4" />
            Saved
          </span>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create certificate"}
        </Button>
      </div>
    </form>
  )
}
