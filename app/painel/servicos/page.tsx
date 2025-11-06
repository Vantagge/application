import { getServices, toggleServiceStatus } from "@/lib/actions/service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { translations } from "@/lib/translations/pt-br"

async function toggle(formData: FormData) {
  "use server"
  const id = String(formData.get("id"))
  await toggleServiceStatus(id)
}

export default async function ServicosPage() {
  const services = await getServices()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translations.service.title}</h1>
        <Button asChild>
          <Link href="/painel/servicos/novo">{translations.service.addService}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translations.service.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">{translations.service.noServices}</p>
          ) : (
            <div className="divide-y">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-neutral-500">R$ {Number(s.price).toFixed(2)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${s.is_active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"}`}>
                    {s.is_active ? "Ativo" : "Inativo"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/painel/servicos/${s.id}/editar`}>{translations.common.edit}</Link>
                    </Button>
                    <form action={toggle}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button variant="ghost" size="sm">{s.is_active ? "Desativar" : "Ativar"}</Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
