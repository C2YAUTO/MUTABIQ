import QRCode from "qrcode"
import { notFound } from "next/navigation"
import { getCertificateBySlug } from "@/app/actions/certificate"
import { getBaseUrl } from "@/lib/base-url"
import { CertificateView } from "@/components/certificate-view"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Conformity Certificate | Mutabiq",
  description: "GSO conformity certificate verification.",
}

export default async function CertificatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cert = await getCertificateBySlug(slug)
  if (!cert) notFound()

  const baseUrl = await getBaseUrl()
  const qrDataUrl = await QRCode.toDataURL(`${baseUrl}/certificate/${cert.slug}`, {
    width: 208,
    margin: 1,
    color: { dark: "#1e3a8a", light: "#ffffff" },
  })

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <CertificateView cert={cert} qrDataUrl={qrDataUrl} />
      </main>
      <SiteFooter />
    </div>
  )
}
