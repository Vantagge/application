import { ServiceForm } from "@/components/painel/service-form"
import { getService } from "@/lib/actions/service"

export default async function EditarServicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const service = await getService(id)

  if (!service) {
    return <div>Serviço não encontrado</div>
  }

  return <ServiceForm mode="edit" service={service} />
}
