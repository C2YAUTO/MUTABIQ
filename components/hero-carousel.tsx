"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  "Authentication of Conformity Certificate for Motor Vehicles, Motorcycles and Tyres",
  "GSO Fuel Economy Labels for Motor Vehicles and Tyres",
  "Recall Campaigns for Motor Vehicles and Motorcycles",
]

export function HeroCarousel() {
  const [index, setIndex] = useState(0)

  const go = useCallback((dir: number) => {
    setIndex((prev) => (prev + dir + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setIndex((prev) => (prev + 1) % slides.length), 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* starfield-style overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,.7), transparent), radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,.5), transparent), radial-gradient(1.5px 1.5px at 80% 60%, rgba(255,255,255,.6), transparent), radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,.4), transparent), radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,.5), transparent)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(135deg, oklch(0.42 0.16 262) 0%, oklch(0.52 0.15 255) 55%, oklch(0.62 0.11 250) 100%)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[380px] max-w-6xl flex-col items-center gap-8 px-10 py-14 md:flex-row md:justify-between md:py-16">
        <button
          onClick={() => go(-1)}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full p-2 text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground md:block"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>

        <div className="max-w-lg text-center md:text-left">
          <h1 className="text-balance text-3xl font-light leading-tight md:text-4xl">
            {slides[index]}
          </h1>
        </div>

        <div className="relative w-full max-w-md overflow-hidden rounded-xl ring-1 ring-white/15 md:w-[440px]">
          <Image
            src="/hero-vehicles.png"
            alt="Illustrations of a car, motorcycle and tyre"
            width={880}
            height={520}
            priority
            className="h-auto w-full"
          />
        </div>

        <button
          onClick={() => go(1)}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full p-2 text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground md:block"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>

      <div className="relative flex justify-center gap-2 pb-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-8 bg-primary-foreground" : "w-4 bg-primary-foreground/40"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
