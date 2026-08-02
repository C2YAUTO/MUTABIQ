import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { listCertificates } from "@/app/actions/certificate"
import { AdminCertList } from "@/components/admin-cert-list"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Administration | Mutabiq",
}

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const certs = await listCertificates()

  return (
    <main className="min-h-dvh bg-secondary">
      <AdminCertList certs={certs} />
    </main>
  )
}
