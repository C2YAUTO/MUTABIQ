import QRCode from "qrcode"
import { notFound, redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getCertificateById } from "@/app/actions/certificate"
import { getBaseUrl } from "@/lib/base-url"
import { AdminEditForm } from "@/components/admin-edit-form"
import { AdminQrPanel } from "@/components/admin-qr-panel"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Edit Certificate | Mutabiq",
}

export default async function EditCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId)) notFound()

  const cert = await getCertificateById(numericId)
  if (!cert) notFound()

  const baseUrl = await getBaseUrl()
  const certUrl = `${baseUrl}/certificate/${cert.slug}`
  const qrDataUrl = await QRCode.toDataURL(certUrl, {
    width: 280,
    margin: 1,
    color: { dark: "#1e3a8a", light: "#ffffff" },
  })

  return (
    <main className="min-h-dvh bg-secondary">
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <AdminQrPanel qrDataUrl={qrDataUrl} certUrl={certUrl} cert={cert} fileName={`dossier-${cert.slug}`} />
      </div>
      <AdminEditForm cert={cert} />
    </main>
  )
}
