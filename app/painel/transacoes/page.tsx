import { getProfessionals } from "@/lib/actions/professional"
import { getServices } from "@/lib/actions/service"
import { TransactionsPage } from "@/components/painel/transactions-page"

export default async function TransacoesPage() {
  const [professionals, services] = await Promise.all([getProfessionals(), getServices()])
  return <TransactionsPage professionals={professionals} services={services} />
}
