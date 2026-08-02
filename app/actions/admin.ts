"use server"

import { destroyAdminSession } from "@/lib/admin-auth"
import { redirect } from "next/navigation"

export async function logoutAdmin() {
  await destroyAdminSession()
  redirect("/admin/login")
}
