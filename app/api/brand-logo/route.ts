import { type NextRequest, NextResponse } from "next/server"

const REGISTRY_URL = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json"
const PUBLIC_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public"

type RegistryIcon = {
  slug: string
  title?: string
  aliases?: string[]
  variants?: Record<string, string>
}

let registryCache: { at: number; icons: RegistryIcon[] } | null = null

async function getRegistry(): Promise<RegistryIcon[]> {
  // Cache the registry for the lifetime of the server process (it changes rarely)
  if (registryCache && Date.now() - registryCache.at < 1000 * 60 * 60) {
    return registryCache.icons
  }
  const res = await fetch(REGISTRY_URL, { next: { revalidate: 60 * 60 * 24 } })
  if (!res.ok) return []
  const data = (await res.json()) as RegistryIcon[] | { icons: RegistryIcon[] }
  const icons = Array.isArray(data) ? data : (data.icons ?? [])
  registryCache = { at: Date.now(), icons }
  return icons
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function findSlug(icons: RegistryIcon[], brand: string): string | null {
  const target = normalize(brand)
  if (!target) return null

  // 1. Exact slug / title match
  for (const icon of icons) {
    if (normalize(icon.slug) === target) return icon.slug
    if (icon.title && normalize(icon.title) === target) return icon.slug
    if (icon.aliases?.some((a) => normalize(a) === target)) return icon.slug
  }
  // 2. Substring match on title / slug
  for (const icon of icons) {
    if (normalize(icon.slug).includes(target) || (icon.title && normalize(icon.title).includes(target))) {
      return icon.slug
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get("brand")?.trim()
  if (!brand) {
    return NextResponse.json({ error: "brand query param required" }, { status: 400 })
  }

  const icons = await getRegistry()
  const slug = findSlug(icons, brand)
  if (!slug) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const match = icons.find((i) => i.slug === slug)
  const variants = match?.variants ?? {}
  // Prefer a colored/default variant for the printed certificate header
  const variantPath =
    variants.color ?? variants.default ?? variants.mono ?? Object.values(variants)[0]

  if (!variantPath) {
    return NextResponse.json({ error: "no variant" }, { status: 404 })
  }

  const svgRes = await fetch(`${PUBLIC_BASE}${variantPath}`, {
    next: { revalidate: 60 * 60 * 24 },
  })
  if (!svgRes.ok) {
    return NextResponse.json({ error: "svg fetch failed" }, { status: 502 })
  }
  const svg = await svgRes.text()

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
