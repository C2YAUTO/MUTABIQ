import { Resend } from "resend"

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

/**
 * Send the one-time admin login code by email via Resend.
 * Returns true on success. Falls back to logging in dev if no API key is set.
 */
export async function sendAdminLoginCode(code: string): Promise<boolean> {
  const apiKey = readEnv("RESEND_API_KEY")
  const to = readEnv("ADMIN_EMAIL")
  // Use a verified sender if provided, otherwise Resend's shared onboarding address.
  const from = readEnv("ADMIN_EMAIL_FROM") || "Mutabiq <onboarding@resend.dev>"

  if (!apiKey || !to) {
    console.log("[v0] Missing RESEND_API_KEY or ADMIN_EMAIL; login code (dev only):", code)
    return false
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Your Mutabiq admin login code: ${code}`,
      text: `Your one-time admin login code is ${code}.\n\nIt expires in 10 minutes. If you did not try to sign in, ignore this email and consider changing your admin password.`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 420px; margin: 0 auto;">
          <h2 style="color: #111;">Mutabiq admin login</h2>
          <p style="color: #444;">Use the following one-time code to finish signing in:</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111; margin: 16px 0;">${code}</p>
          <p style="color: #888; font-size: 13px;">This code expires in 10 minutes. If you did not try to sign in, ignore this email and consider changing your admin password.</p>
        </div>
      `,
    })
    if (error) {
      console.log("[v0] Resend error sending login code:", error)
      return false
    }
    return true
  } catch (err) {
    console.log("[v0] Failed to send login code email:", err)
    return false
  }
}
