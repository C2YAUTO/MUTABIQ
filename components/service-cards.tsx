import {
  ClipboardCheck,
  Fuel,
  LayoutDashboard,
  type LucideIcon,
  ScrollText,
  ShieldCheck,
  Truck,
} from "lucide-react"

type Service = {
  title: string
  description: string
  cta: string
  icon: LucideIcon
  href: string
}

const services: Service[] = [
  {
    title: "GSO Fuel Economy Guide",
    description: "Browse and compare motor vehicles models based on fuel economy and technical specifications.",
    cta: "Browse the Guide",
    icon: Fuel,
    href: "#",
  },
  {
    title: "VIN Details",
    description: "Check vehicle target country, linked certificate and linked recalls via its VIN number.",
    cta: "Check VIN Details",
    icon: ShieldCheck,
    href: "/certificate",
  },
  {
    title: "GCC Officers Dashboard",
    description: "Verify and download certificates, fuel economy labels and recalls.",
    cta: "View Dashboard",
    icon: LayoutDashboard,
    href: "#",
  },
  {
    title: "Custom Clearance Guide",
    description: "An indicative guide for customs clearance of new motor vehicles, motorcycles and tyres.",
    cta: "Read the Guidelines",
    icon: Truck,
    href: "#",
  },
  {
    title: "Technical Regulations",
    description: "List of GSO Technical Regulations for Motor Vehicles.",
    cta: "Review the Technical Regulation",
    icon: ScrollText,
    href: "#",
  },
  {
    title: "Consumer Guide",
    description: "An indicative consumer guide for motor vehicles, motorcycles and tyres.",
    cta: "Read the Guidelines",
    icon: ClipboardCheck,
    href: "#",
  },
]

export function ServiceCards() {
  return (
    <section id="services" className="bg-secondary py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <article
                key={service.title}
                className="flex flex-col items-center rounded-lg border border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
                  <Icon className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{service.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {service.description}
                </p>
                <a
                  href={service.href}
                  className="mt-5 border-t border-border pt-4 text-sm font-semibold text-link transition-opacity hover:opacity-70"
                >
                  {service.cta}
                </a>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
