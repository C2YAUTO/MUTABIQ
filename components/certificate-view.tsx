import Image from "next/image"
import { CheckCircle2 } from "lucide-react"
import type { Certificate } from "@/lib/db/schema"

/** Hide the last 5 characters of a VIN for privacy (e.g. "MA3JJC74...S12345" -> "MA3JJC74...S*****"). */
function maskVin(vin: string) {
  if (!vin) return ""
  if (vin.length <= 5) return "*".repeat(vin.length)
  return vin.slice(0, -5) + "*".repeat(5)
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-full text-sm font-medium text-muted-foreground sm:w-1/2">{label}</dt>
      <dd className="w-full text-sm font-semibold text-foreground sm:w-1/2 text-pretty">{value}</dd>
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

      {/* Approval banner */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-600 bg-green-50 px-5 py-4">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" aria-hidden="true" />
        <p className="text-lg font-semibold text-green-700">This certificate has been approved.</p>
      </div>

      {/* CCR + Approved On */}
      <div className="mb-6">
        <Section title="Approval">
          <Row label="CCR Number" value={cert.ccrNumber} />
          <Row label="Approved On" value={cert.issueDate} />
        </Section>
      </div>

      {/* Vehicle brand + model */}
      <div className="mb-6 rounded-lg bg-secondary px-6 py-8 text-center">
        <p className="mb-3 text-lg font-medium text-muted-foreground">Motor Vehicle</p>
        <p className="text-xl font-semibold uppercase tracking-wide text-secondary-foreground text-balance">
          {[cert.brand, cert.model].filter(Boolean).join(" ")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="General information">
          <Row label="Certificate type" value={cert.certificateType} />
          <Row label="Manufacturer" value={cert.manufacturer} />
          <Row label="Manufacturer address" value={cert.manufacturerAddress} />
          <Row label="Manufacturer reference" value={cert.manufacturerRef} />
          <Row label="Country of origin" value={cert.countryOfOrigin} />
          <Row label="Country of production" value={cert.countryOfProduction} />
          <Row label="Vehicle category" value={cert.vehicleCategory} />
          <Row label="Vehicle type" value={cert.vehicleType} />
          <Row label="Produced after" value={cert.producedAfter} />
        </Section>

        <Section title="Vehicle">
          <Row label="Brand" value={cert.brand} />
          <Row label="Model" value={cert.model} />
          <Row label="Model year" value={cert.modelYear} />
          <Row label="Color" value={cert.color} />
          <Row label="Chassis / body type" value={cert.chassisBodyType} />
          <Row label="Number of doors" value={cert.numDoors} />
          <Row label="Number of seats" value={cert.numSeats} />
          <Row label="Number of passengers" value={cert.numPassengers} />
        </Section>

        <Section title="Identification & engine">
          <Row label="VIN" value={maskVin(cert.vin)} />
          <Row label="Engine number" value={cert.engineNumber} />
          <Row label="Fuel type" value={cert.fuelType} />
          <Row label="Number of cylinders" value={cert.numberOfCylinders} />
          <Row label="Displacement" value={cert.engineCapacity} />
          <Row label="Air intake" value={cert.airIntake} />
          <Row label="Net engine power" value={cert.netEnginePower} />
          <Row label="Engine RPM" value={cert.engineRpm} />
          <Row label="Transmission" value={cert.transmission} />
          <Row label="Pollutant limit" value={cert.pollutantLimit} />
          <Row label="eCall SOS" value={cert.ecallSystem} />
        </Section>

        <Section title="Weights & dimensions">
          <Row label="Max vehicle weight" value={cert.maxVehicleWeight} />
          <Row label="Curb weight" value={cert.curbWeight} />
          <Row label="Max axle (front)" value={cert.maxAxleFront} />
          <Row label="Max axle (rear)" value={cert.maxAxleRear} />
          <Row label="Length (mm)" value={cert.lengthMm} />
          <Row label="Width (mm)" value={cert.widthMm} />
          <Row label="Height (mm)" value={cert.heightMm} />
          <Row label="Wheelbase (mm)" value={cert.wheelbaseMm} />
          <Row label="Track (front)" value={cert.trackFront} />
          <Row label="Track (rear)" value={cert.trackRear} />
        </Section>

        <Section title="Brakes">
          <Row label="Service brakes" value={cert.serviceBrakes} />
          <Row label="Emergency brakes" value={cert.emergencyBrakes} />
        </Section>

        <Section title="Fuel economy">
          <Row label="Vehicle class" value={cert.fuelVehicleClass} />
          <Row label="CAFE combined" value={cert.feCafeCombined} />
          <Row label="Rating" value={cert.feRating} />
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
