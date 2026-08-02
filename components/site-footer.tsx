import { BadgeCheck, ExternalLink } from "lucide-react"

export function SiteFooter() {
  return (
    <footer id="about" className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BadgeCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold text-foreground">About Mutabiq</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              Motor Vehicles, Motorcycles and Tyres Manufacturers can create their profile and declare their product
              technical details and test reports for attestation from our engineers.{" "}
              <a href="#" className="inline-flex items-center gap-1 font-semibold text-link hover:opacity-70">
                Know more about Mutabiq
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                GSO
              </span>
              <h2 className="text-lg font-semibold text-foreground">About GSO</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              GSO is a Regional Standardization Organization (RSO) to unifying the various standardization activities
              and to develop the production and service sectors, intra-GCC trade, protect the consumer, environment and
              the public health, enhance the GCC economy and its competitiveness.{" "}
              <a href="#" className="inline-flex items-center gap-1 font-semibold text-link hover:opacity-70">
                Visit GSO Website
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary">
              Terms of Use
            </a>
          </div>
          <p>
            <span className="font-semibold text-foreground">© GSO</span> 2026. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
