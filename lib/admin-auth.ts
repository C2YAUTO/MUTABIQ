import { cookies } from "next/headers"
import { createHmac, timingSafeEqual } from "crypto"

const COOKIE_NAME = "admin_session"

/**
 * Read an env var and normalise it: trim whitespace and strip a single layer
 * of matching surrounding quotes. Some env files store values as 'value' or
 * "value"; depending on how they are parsed the quotes may leak into the
 * runtime value, which would break exact string comparisons.
 */
function readEnv(name: string) {
  let v = process.env[name] ?? ""
  v = v.trim()
  if (v.length >= 2) {
    const first = v[0]
    const last = v[v.length - 1]
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
      v = v.slice(1, -1)
    }
  }
  return v
}

function getSecret() {
  return readEnv("ADMIN_SESSION_SECRET") || "insecure-dev-secret-change-me"
}

// The signed token is a constant marker HMAC'd with the server secret.
// Only someone who knows ADMIN_SESSION_SECRET can produce a valid token.
function expectedToken() {
  return createHmac("sha256", getSecret()).update("admin-authenticated").digest("hex")
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function verifyPassword(password: string) {
  const expected = readEnv("ADMIN_PASSWORD")
  if (!expected) return false
  // Trim the typed password so a stray leading/trailing space doesn't block login.
  return safeEqual(password.trim(), expected)
}

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
  maxAge: 60 * 60 * 8, // 8 hours
}

/** Cookie name + signed value + options, for setting directly on a Response. */
export function getSessionCookie() {
  return { name: COOKIE_NAME, value: expectedToken(), options: SESSION_COOKIE_OPTIONS }
}

export async function createAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, expectedToken(), SESSION_COOKIE_OPTIONS)
}

export async function destroyAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  return safeEqual(token, expectedToken())
}
