"use client"

import { useState } from "react"
import Image from "next/image"
import { BookOpen, Globe, Menu, User, X } from "lucide-react"

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Public Services", href: "#services" },
  { label: "About Mutabiq", href: "#about" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <a href="#" className="flex items-center gap-2" aria-label="Mutabiq home">
            <Image
              src="/mutabiq-logo.png"
              alt="Mutabiq"
              width={640}
              height={300}
              priority
              className="h-10 w-auto"
            />
          </a>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <button className="flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80">
            <Globe className="h-4 w-4" aria-hidden="true" />
            <span dir="rtl">العربية</span>
          </button>
          <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-primary">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            User Guide
          </a>
          <a href="/admin/login" className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-primary">
            <User className="h-4 w-4" aria-hidden="true" />
            Login
          </a>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            <div className="my-2 h-px bg-border" />
            <button className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-primary">
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span dir="rtl">العربية</span>
            </button>
            <a href="#" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-foreground/80">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              User Guide
            </a>
            <a href="/admin/login" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-foreground/80">
              <User className="h-4 w-4" aria-hidden="true" />
              Login
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
