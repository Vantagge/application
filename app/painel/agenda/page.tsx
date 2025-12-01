import { getProfessionals } from "@/lib/actions/professional"
import { getServices } from "@/lib/actions/service"
import { AgendaClient } from "@/components/agenda/AgendaClient"
import FeatureGuard from "@/components/feature/FeatureGuard"
import UpgradePlanBanner from "@/components/feature/UpgradePlanBanner"

export default async function PainelAgendaPage() {
  const [professionals, services] = await Promise.all([getProfessionals(), getServices()])
  return (
    <div className="min-h-screen">
      <FeatureGuard feature="module_scheduling" fallback={<UpgradePlanBanner message="A Agenda está disponível em planos que incluem o módulo de Agendamento." /> }>
        <AgendaClient professionals={professionals} services={services} />
      </FeatureGuard>
    </div>
  )
}
