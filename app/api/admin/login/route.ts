import { type NextRequest, NextResponse } from "next/server"
import { verifyPassword, getSessionCookie } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const password = formData.get("password")

  if (typeof password !== "string" || !verifyPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), { status: 303 })
  }

  const res = NextResponse.redirect(new URL("/admin", request.url), { status: 303 })
  const { name, value, options } = getSessionCookie()
  res.cookies.set(name, value, options)
  return res
}
