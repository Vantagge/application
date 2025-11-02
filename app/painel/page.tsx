import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getEstablishmentWithConfig, getDashboardStats } from "@/lib/actions/establishment"
import { getCustomers } from "@/lib/actions/customer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Award, Gift } from "lucide-react"
import { translations } from "@/lib/translations/pt-br"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function PainelPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const establishmentData = await getEstablishmentWithConfig()

  // If no establishment, redirect to onboarding
  if (!establishmentData?.establishment) {
    redirect("/painel/configuracao-inicial")
  }

  const stats = await getDashboardStats()
  const customers = await getCustomers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{translations.dashboard.title}</h1>
        <p className="text-neutral-600 mt-1">{establishmentData.establishment.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {translations.dashboard.activeCustomers}
            </CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{stats?.activeCustomers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">{translations.dashboard.totalPoints}</CardTitle>
            <Award className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{stats?.totalPoints || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {translations.dashboard.totalRedemptions}
            </CardTitle>
            <Gift className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{stats?.totalRedemptions || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{translations.dashboard.customerList}</CardTitle>
            <Button asChild size="sm" className="bg-[#25D366] hover:bg-[#20BD5A]">
              <Link href="/painel/clientes/novo">{translations.customer.addCustomer}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">Nenhum cliente cadastrado ainda.</div>
          ) : (
            <div className="space-y-2">
              {customers.slice(0, 5).map((record: any) => (
                <Link
                  key={record.id}
                  href={`/painel/clientes/${record.customer_id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{record.customers.name}</p>
                    <p className="text-sm text-neutral-500">{record.customers.whatsapp}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#25D366]">
                      {record.balance} {establishmentData.config?.program_type === "Carimbo" ? "carimbos" : "pontos"}
                    </p>
                  </div>
                </Link>
              ))}
              {customers.length > 5 && (
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/painel/clientes">Ver todos os clientes</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
