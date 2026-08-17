import { cookies } from "next/headers"
import { createHmac, timingSafeEqual, randomBytes } from "crypto"
import { db } from "@/lib/db"
import { adminSession, adminLoginAttempt } from "@/lib/db/schema"
import { eq, lt } from "drizzle-orm"

const COOKIE_NAME = "admin_session"
const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

// Brute-force policy: after MAX_FAILED wrong passwords, block the IP for BLOCK_MS.
const MAX_FAILED = 5
const BLOCK_MS = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // failures older than this decay

/**
 * Read an env var and normalise it: trim whitespace and strip a single layer
 * of matching surrounding quotes. Depending on how the env file is parsed the
 * quotes may leak into the runtime value, which would break comparisons.
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

/* -------------------------------------------------------------------------- */
/* Sessions — unique, hashed, and revocable                                    */
/* -------------------------------------------------------------------------- */

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
}

// The cookie holds a random secret; the database only stores its hash, so a
// leaked database row can't be turned back into a working session token.
function hashToken(token: string) {
  return createHmac("sha256", getSecret()).update(`session:${token}`).digest("hex")
}

/**
 * Create a brand-new unique session. Returns the cookie to set on the Response.
 * Each login gets its own random token and database row.
 */
export async function createSessionCookie(userAgent = "") {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.insert(adminSession).values({
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: userAgent.slice(0, 300),
  })
  return { name: COOKIE_NAME, value: token, options: SESSION_COOKIE_OPTIONS }
}

export async function destroyAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (token) {
    await db.delete(adminSession).where(eq(adminSession.tokenHash, hashToken(token)))
  }
  cookieStore.delete(COOKIE_NAME)
}

/** Sign every admin out by deleting all sessions. */
export async function revokeAllSessions() {
  await db.delete(adminSession)
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false

  const [row] = await db
    .select()
    .from(adminSession)
    .where(eq(adminSession.tokenHash, hashToken(token)))
    .limit(1)

  if (!row) return false
  if (row.expiresAt.getTime() < Date.now()) {
    // Clean up expired session lazily.
    await db.delete(adminSession).where(eq(adminSession.id, row.id))
    return false
  }
  return true
}

/* -------------------------------------------------------------------------- */
/* Brute-force protection — per-IP failed attempt tracking                     */
/* -------------------------------------------------------------------------- */

/** Returns how many seconds remain if this IP is currently blocked, else 0. */
export async function getBlockedSeconds(ip: string): Promise<number> {
  const [row] = await db.select().from(adminLoginAttempt).where(eq(adminLoginAttempt.ip, ip)).limit(1)
  if (!row?.blockedUntil) return 0
  const remaining = row.blockedUntil.getTime() - Date.now()
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

/** Record a failed password attempt for an IP and block it once over the limit. */
export async function recordFailedAttempt(ip: string) {
  const now = Date.now()
  const [row] = await db.select().from(adminLoginAttempt).where(eq(adminLoginAttempt.ip, ip)).limit(1)

  // Decay old failures so an occasional typo months ago doesn't count forever.
  const withinWindow = row && now - row.updatedAt.getTime() < ATTEMPT_WINDOW_MS
  const failedCount = (withinWindow ? row!.failedCount : 0) + 1
  const blockedUntil = failedCount >= MAX_FAILED ? new Date(now + BLOCK_MS) : null

  if (row) {
    await db
      .update(adminLoginAttempt)
      .set({ failedCount, blockedUntil, updatedAt: new Date(now) })
      .where(eq(adminLoginAttempt.ip, ip))
  } else {
    await db.insert(adminLoginAttempt).values({ ip, failedCount, blockedUntil, updatedAt: new Date(now) })
  }
}

/** Clear the failure counter for an IP after a successful login. */
export async function clearFailedAttempts(ip: string) {
  await db.delete(adminLoginAttempt).where(eq(adminLoginAttempt.ip, ip))
}

/** Best-effort cleanup of expired sessions (safe to call opportunistically). */
export async function pruneExpiredSessions() {
  await db.delete(adminSession).where(lt(adminSession.expiresAt, new Date()))
}
