import { getProfessionals } from "@/lib/actions/professional"
import { getServices } from "@/lib/actions/service"
import { TransactionsPage } from "@/components/painel/transactions-page"
import FeatureGuard from "@/components/feature/FeatureGuard"
import UpgradePlanBanner from "@/components/feature/UpgradePlanBanner"

export default async function PainelTransacoesPage() {
  const [professionals, services] = await Promise.all([getProfessionals(), getServices()])
  return (
    <div className="min-h-screen">
      <FeatureGuard feature="module_transactions" fallback={<UpgradePlanBanner message="A tela de Transações está disponível em planos que incluem o módulo de Transações." /> }>
        <TransactionsPage professionals={professionals} services={services} />
      </FeatureGuard>
    </div>
  )
}
