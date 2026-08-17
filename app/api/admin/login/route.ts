import { type NextRequest, NextResponse } from "next/server"
import {
  verifyPassword,
  getSessionCookie,
  startTwoFactor,
  verifyTwoFactorCode,
  clearPendingTwoFactor,
} from "@/lib/admin-auth"
import { sendAdminLoginCode } from "@/lib/email"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const step = formData.get("step")

  // Step 2: verify the one-time code and open the session.
  if (step === "code") {
    const code = formData.get("code")
    if (typeof code !== "string") {
      return NextResponse.redirect(new URL("/admin/login?step=code&error=code", request.url), { status: 303 })
    }
    const result = await verifyTwoFactorCode(code)
    if (result === "ok") {
      const res = NextResponse.redirect(new URL("/admin", request.url), { status: 303 })
      const { name, value, options } = getSessionCookie()
      res.cookies.set(name, value, options)
      return res
    }
    if (result === "expired" || result === "no-pending") {
      // Code expired or too many attempts: send the user back to the start.
      await clearPendingTwoFactor()
      return NextResponse.redirect(new URL("/admin/login?error=expired", request.url), { status: 303 })
    }
    return NextResponse.redirect(new URL("/admin/login?step=code&error=code", request.url), { status: 303 })
  }

  // Step 1: verify the password, then send a one-time code by email.
  const password = formData.get("password")
  if (typeof password !== "string" || !verifyPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), { status: 303 })
  }

  const code = await startTwoFactor()
  await sendAdminLoginCode(code)
  return NextResponse.redirect(new URL("/admin/login?step=code", request.url), { status: 303 })
}
