import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { AdminEditForm } from "@/components/admin-edit-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "New Certificate | Mutabiq",
}

export default async function NewCertificatePage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  return (
    <main className="min-h-dvh bg-secondary">
      <AdminEditForm cert={null} />
    </main>
  )
}
