"use server"

import { destroyAdminSession, revokeAllSessions } from "@/lib/admin-auth"
import { redirect } from "next/navigation"

export async function logoutAdmin() {
  await destroyAdminSession()
  redirect("/admin/login")
}

/** Revoke every active admin session everywhere, then sign this browser out too. */
export async function signOutEverywhere() {
  await revokeAllSessions()
  await destroyAdminSession()
  redirect("/admin/login")
}
