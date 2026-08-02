import Image from "next/image"
import { Apple, Play } from "lucide-react"

const features = [
  "Scan QR Code in motor vehicle/tyre label to verify the label details",
  "Authorized users can access fuel economy labels, conformity certificates, recalls, VINs, and authorized importers",
  "Read import documents like custom clearance guides and technical regulations",
  "Know more about the Mutabiq app, GCC Standardization Organization, and its contact details, privacy, terms of use",
]

export function AppDownload() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-base leading-relaxed text-muted-foreground text-pretty">
              Browse fuel economy guide for motor vehicles bearing GSO Fuel Economy Labels and compare between them.
              Authorities in GSO member states can access the detail of fuel economy labels, conformity certificates,
              recalls, VINs, and authorized importers.
            </p>
            <h2 className="mt-6 text-lg font-semibold text-foreground">Mutabiq App Includes</h2>
            <ul className="mt-4 space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-pretty">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <Image
              src="/app-mockup.png"
              alt="Mutabiq mobile app shown on two smartphones"
              width={720}
              height={540}
              className="h-auto w-full max-w-md rounded-lg"
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-5">
          <p className="text-lg text-muted-foreground">Download the Mutabiq app on your mobile phone</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg bg-foreground px-5 py-2.5 text-background transition-opacity hover:opacity-90"
            >
              <Apple className="h-7 w-7" aria-hidden="true" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] uppercase tracking-wide">Download on the</span>
                <span className="text-lg font-semibold">App Store</span>
              </span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg bg-foreground px-5 py-2.5 text-background transition-opacity hover:opacity-90"
            >
              <Play className="h-6 w-6 fill-current" aria-hidden="true" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] uppercase tracking-wide">Get it on</span>
                <span className="text-lg font-semibold">Google Play</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
