import Image from "next/image"
import { CheckCircle2 } from "lucide-react"
import type { Certificate } from "@/lib/db/schema"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-full text-sm font-medium text-muted-foreground sm:w-1/2">{label}</dt>
      <dd className="w-full text-sm font-semibold text-foreground sm:w-1/2 text-pretty">{value || "—"}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground">
        {title}
      </h2>
      <dl className="px-5 py-2">{children}</dl>
    </section>
  )
}

export function CertificateView({ cert, qrDataUrl }: { cert: Certificate; qrDataUrl: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header banner */}
      <div className="mb-6 flex flex-col gap-6 rounded-xl bg-primary px-6 py-6 text-primary-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70">
            GSO — Mutabiq
          </p>
          <h1 className="mt-1 text-2xl font-bold text-balance">Conformity Certificate</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">{cert.certificateType}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-background p-2">
            <Image
              src={qrDataUrl || "/placeholder.svg"}
              alt="Certificate QR code"
              width={104}
              height={104}
              className="h-26 w-26"
            />
          </div>
        </div>
      </div>

      {/* Status + CCR */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-lg border border-green-600 bg-green-50 px-5 py-4">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" aria-hidden="true" />
          <div>
            <p className="text-xs text-green-700">Status</p>
            <p className="text-lg font-bold text-green-700">Valid</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-card px-5 py-4">
          <div>
            <p className="text-xs text-muted-foreground">Certificate number (CCR)</p>
            <p className="text-lg font-bold text-foreground">{cert.ccrNumber || "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="General information">
          <Row label="Applicant" value={cert.applicant} />
          <Row label="Manufacturer" value={cert.manufacturer} />
          <Row label="Country of origin" value={cert.countryOfOrigin} />
          <Row label="Vehicle category" value={cert.vehicleCategory} />
        </Section>

        <Section title="Vehicle">
          <Row label="Brand" value={cert.brand} />
          <Row label="Model" value={cert.model} />
          <Row label="Model year" value={cert.modelYear} />
          <Row label="Color" value={cert.color} />
        </Section>

        <Section title="Identification & engine">
          <Row label="VIN" value={cert.vin} />
          <Row label="Engine number" value={cert.engineNumber} />
          <Row label="Fuel type" value={cert.fuelType} />
          <Row label="Number of cylinders" value={cert.numberOfCylinders} />
          <Row label="Displacement" value={cert.engineCapacity} />
        </Section>

        <Section title="Validity">
          <Row label="Issue date" value={cert.issueDate} />
        </Section>
      </div>

      {cert.notes ? (
        <div className="mt-6">
          <Section title="Notes">
            <p className="py-3 text-sm text-foreground text-pretty">{cert.notes}</p>
          </Section>
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Last updated: {new Date(cert.updatedAt).toLocaleString("en-US")}
      </p>
    </div>
  )
}
