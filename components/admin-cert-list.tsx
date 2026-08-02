"use client"

import { useTransition } from "react"
import Link from "next/link"
import type { Certificate } from "@/lib/db/schema"
import { logoutAdmin } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Plus, LogOut, Pencil, ExternalLink } from "lucide-react"

export function AdminCertList({ certs }: { certs: Certificate[] }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Conformity certificates</h1>
          <p className="text-sm text-muted-foreground">
            {certs.length} certificate{certs.length > 1 ? "s" : ""}. Each has its own unique QR code.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/admin/new">
              <Plus className="mr-1 h-4 w-4" />
              New certificate
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(async () => await logoutAdmin())}
          >
            <LogOut className="mr-1 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {certs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">No certificates yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/new">
              <Plus className="mr-1 h-4 w-4" />
              Create the first certificate
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {certs.map((cert) => {
            const isValid = cert.status.toLowerCase() === "valid"
            return (
              <li
                key={cert.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  {isValid ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {cert.ccrNumber || "(No CCR number)"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[cert.brand, cert.model, cert.modelYear].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">/certificate/{cert.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/certificate/${cert.slug}`} target="_blank">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/admin/${cert.id}`}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
