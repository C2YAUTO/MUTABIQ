import { type NextRequest, NextResponse } from "next/server"
import {
  verifyPassword,
  createSessionCookie,
  getBlockedSeconds,
  recordFailedAttempt,
  clearFailedAttempts,
} from "@/lib/admin-auth"

/** Best-effort client IP from proxy headers, with a safe fallback. */
function getClientIp(request: NextRequest) {
  const fwd = request.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return request.headers.get("x-real-ip")?.trim() || "unknown"
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const password = formData.get("password")
  const ip = getClientIp(request)

  // 1. Refuse early if this IP is temporarily blocked.
  const blockedFor = await getBlockedSeconds(ip)
  if (blockedFor > 0) {
    return NextResponse.redirect(new URL("/admin/login?error=blocked", request.url), { status: 303 })
  }

  // 2. Verify the password; a wrong one counts toward the block threshold.
  if (typeof password !== "string" || !verifyPassword(password)) {
    await recordFailedAttempt(ip)
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), { status: 303 })
  }

  // 3. Success: reset the counter and open a fresh, unique session.
  await clearFailedAttempts(ip)
  const userAgent = request.headers.get("user-agent") ?? ""
  const { name, value, options } = await createSessionCookie(userAgent)

  const res = NextResponse.redirect(new URL("/admin", request.url), { status: 303 })
  res.cookies.set(name, value, options)
  return res
}
