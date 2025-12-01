import { isAdmin, getEstablishment } from "@/lib/actions/admin"
import { listFeaturesWithStatus } from "@/lib/actions/features-admin"
import { EstablishmentFeatures } from "@/components/admin/establishment-features"
import { redirect } from "next/navigation"

export default async function AdminTenantFeaturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!(await isAdmin())) {
    redirect("/auth/login")
  }

  const establishment = await getEstablishment(id)
  const features = await listFeaturesWithStatus(id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Funcionalidades de {establishment.name}</h1>
      <EstablishmentFeatures establishmentId={id} initial={features} />
    </div>
  )
}
