import { cookies } from "next/headers"
import { createHmac, timingSafeEqual, randomInt } from "crypto"
import { db } from "@/lib/db"
import { adminLoginCode } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const COOKIE_NAME = "admin_session"
const PENDING_COOKIE_NAME = "admin_2fa_pending"
const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const MAX_CODE_ATTEMPTS = 5

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

/* -------------------------------------------------------------------------- */
/* Two-factor authentication (one-time code by email)                          */
/* -------------------------------------------------------------------------- */

const PENDING_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
  maxAge: 10 * 60, // matches the code TTL
}

function hashCode(code: string) {
  return createHmac("sha256", getSecret()).update(`2fa:${code}`).digest("hex")
}

// Sign the pending-login row id so the client can't forge or swap it.
function signPending(id: number) {
  const sig = createHmac("sha256", getSecret()).update(`pending:${id}`).digest("hex")
  return `${id}.${sig}`
}

function verifyPendingValue(value: string): number | null {
  const [rawId, sig] = value.split(".")
  const id = Number(rawId)
  if (!rawId || !sig || !Number.isInteger(id)) return null
  const expected = createHmac("sha256", getSecret()).update(`pending:${id}`).digest("hex")
  if (!safeEqual(sig, expected)) return null
  return id
}

/**
 * Create a fresh one-time code, store its hash in the database, and set a
 * signed pending cookie that links this browser to that code row.
 * Returns the plaintext code (to email) — it is never stored in the clear.
 */
export async function startTwoFactor(): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)
  const [row] = await db
    .insert(adminLoginCode)
    .values({ codeHash: hashCode(code), expiresAt })
    .returning({ id: adminLoginCode.id })

  const cookieStore = await cookies()
  cookieStore.set(PENDING_COOKIE_NAME, signPending(row.id), PENDING_COOKIE_OPTIONS)
  return code
}

export async function hasPendingTwoFactor(): Promise<boolean> {
  const cookieStore = await cookies()
  const value = cookieStore.get(PENDING_COOKIE_NAME)?.value
  if (!value) return false
  return verifyPendingValue(value) !== null
}

export async function clearPendingTwoFactor() {
  const cookieStore = await cookies()
  cookieStore.delete(PENDING_COOKIE_NAME)
}

/**
 * Verify the submitted code against the pending login row.
 * Returns "ok" on success, otherwise a failure reason.
 */
export async function verifyTwoFactorCode(
  submitted: string,
): Promise<"ok" | "expired" | "invalid" | "no-pending"> {
  const cookieStore = await cookies()
  const value = cookieStore.get(PENDING_COOKIE_NAME)?.value
  if (!value) return "no-pending"
  const id = verifyPendingValue(value)
  if (id === null) return "no-pending"

  const [row] = await db.select().from(adminLoginCode).where(eq(adminLoginCode.id, id)).limit(1)
  if (!row || row.consumed) return "no-pending"

  if (row.expiresAt.getTime() < Date.now() || row.attempts >= MAX_CODE_ATTEMPTS) {
    await db.update(adminLoginCode).set({ consumed: true }).where(eq(adminLoginCode.id, id))
    return "expired"
  }

  const code = submitted.trim()
  const matches = code.length === 6 && safeEqual(hashCode(code), row.codeHash)
  if (!matches) {
    await db.update(adminLoginCode).set({ attempts: row.attempts + 1 }).where(eq(adminLoginCode.id, id))
    return "invalid"
  }

  // Success: burn the code so it can't be reused.
  await db.update(adminLoginCode).set({ consumed: true }).where(eq(adminLoginCode.id, id))
  return "ok"
}
