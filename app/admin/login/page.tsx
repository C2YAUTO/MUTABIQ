import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { AdminLoginForm } from "@/components/admin-login-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Admin Sign in | Mutabiq",
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (await isAdminAuthenticated()) redirect("/admin")
  const { error } = await searchParams

  let formError: "password" | "blocked" | undefined
  if (error === "1") formError = "password"
  else if (error === "blocked") formError = "blocked"

  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary px-4">
      <AdminLoginForm error={formError} />
    </main>
  )
}
