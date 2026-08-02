import Link from "next/link"
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import { listCertificates } from "@/app/actions/certificate"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Conformity Certificates | Mutabiq",
  description: "List of GSO conformity certificates.",
}

export default async function CertificateIndexPage() {
  const certs = await listCertificates()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="mb-6 rounded-xl bg-primary px-6 py-6 text-primary-foreground">
            <p className="text-xs uppercase tracking-widest text-primary-foreground/70">GSO — Mutabiq</p>
            <h1 className="mt-1 text-2xl font-bold text-balance">Conformity certificates</h1>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Select a certificate to verify its authenticity.
            </p>
          </div>

          {certs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
              No certificates available yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {certs.map((cert) => {
                const isValid = cert.status.toLowerCase() === "valid"
                return (
                  <li key={cert.id}>
                    <Link
                      href={`/certificate/${cert.slug}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-primary"
                    >
                      <div className="flex items-start gap-3">
                        {isValid ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{cert.ccrNumber || "(No CCR number)"}</p>
                          <p className="text-sm text-muted-foreground">
                            {[cert.brand, cert.model, cert.modelYear].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
