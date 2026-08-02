import { AppDownload } from "@/components/app-download"
import { HeroCarousel } from "@/components/hero-carousel"
import { ServiceCards } from "@/components/service-cards"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main>
        <HeroCarousel />
        <ServiceCards />
        <AppDownload />
      </main>
      <SiteFooter />
    </div>
  )
}
