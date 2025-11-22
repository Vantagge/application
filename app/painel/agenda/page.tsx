import { getProfessionals } from "@/lib/actions/professional"
import { getServices } from "@/lib/actions/service"
import { AgendaClient } from "@/components/agenda/AgendaClient"

export default async function PainelAgendaPage() {
  const [professionals, services] = await Promise.all([getProfessionals(), getServices()])
  return (
    <div className="min-h-screen">
      <AgendaClient professionals={professionals} services={services} />
    </div>
  )
}
