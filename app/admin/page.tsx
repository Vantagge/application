import { getAdminStats, getAllEstablishments } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, TrendingUp, Activity } from "lucide-react"
import { translations } from "@/lib/translations/pt-br"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
  const stats = await getAdminStats()
  const establishments = await getAllEstablishments()

  const recentEstablishments = establishments.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{translations.admin.title}</h1>
        <p className="text-neutral-600 mt-1">Visão geral da plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {translations.admin.totalEstablishments}
            </CardTitle>
            <Building2 className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{stats.totalEstablishments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {translations.admin.activeEstablishments}
            </CardTitle>
            <Activity className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{stats.activeEstablishments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Total de Transações</CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{stats.totalTransactions}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Estabelecimentos Recentes</CardTitle>
            <Button asChild size="sm" className="bg-[#25D366] hover:bg-[#20BD5A]">
              <Link href="/admin/estabelecimentos/novo">{translations.admin.addEstablishment}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentEstablishments.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">Nenhum estabelecimento cadastrado ainda.</div>
          ) : (
            <div className="space-y-2">
              {recentEstablishments.map((est: any) => (
                <Link
                  key={est.id}
                  href={`/admin/estabelecimentos/${est.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{est.name}</p>
                    <p className="text-sm text-neutral-500">
                      {est.category} • {est.responsible_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        est.status === "ativo"
                          ? "bg-green-100 text-green-800"
                          : est.status === "trial"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {est.status}
                    </span>
                  </div>
                </Link>
              ))}
              {establishments.length > 5 && (
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/admin/estabelecimentos">Ver todos os estabelecimentos</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
