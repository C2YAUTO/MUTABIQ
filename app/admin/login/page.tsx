import { redirect } from "next/navigation"
import { isAdminAuthenticated, hasPendingTwoFactor } from "@/lib/admin-auth"
import { AdminLoginForm } from "@/components/admin-login-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Admin Sign in | Mutabiq",
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; step?: string }>
}) {
  if (await isAdminAuthenticated()) redirect("/admin")
  const { error, step } = await searchParams

  // Only show the code step if the user really has a pending 2FA challenge.
  const showCodeStep = step === "code" && (await hasPendingTwoFactor())

  let formError: "password" | "code" | "expired" | undefined
  if (error === "1") formError = "password"
  else if (error === "code") formError = "code"
  else if (error === "expired") formError = "expired"

  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary px-4">
      <AdminLoginForm step={showCodeStep ? "code" : "password"} error={formError} />
    </main>
  )
}
