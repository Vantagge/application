import { getAllEstablishments } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { translations } from "@/lib/translations/pt-br"

export default async function EstabelecimentosPage() {
  const establishments = await getAllEstablishments()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">{translations.admin.establishments}</h1>
        <Button asChild className="bg-[#25D366] hover:bg-[#20BD5A]">
          <Link href="/admin/estabelecimentos/novo" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {translations.admin.addEstablishment}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input placeholder={translations.common.search} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {establishments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">Nenhum estabelecimento cadastrado ainda.</p>
              <Button asChild className="bg-[#25D366] hover:bg-[#20BD5A]">
                <Link href="/admin/estabelecimentos/novo">Cadastrar Primeiro Estabelecimento</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {establishments.map((est: any) => (
                <Link
                  key={est.id}
                  href={`/admin/estabelecimentos/${est.id}`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 flex items-center gap-2">
                      {est.name}
                      {est.registration && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                          #{est.registration}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {est.category} • {est.responsible_name}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Criado em: {new Date(est.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
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
                    {est.establishment_configs && (
                      <p className="text-xs text-neutral-500">{est.establishment_configs.program_type}</p>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/tenants/${est.id}/features`}>Gerenciar Features</Link>
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
