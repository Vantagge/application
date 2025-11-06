import { getProfessionals, toggleProfessionalStatus } from "@/lib/actions/professional"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { translations } from "@/lib/translations/pt-br"

async function toggle(formData: FormData) {
  "use server"
  const id = String(formData.get("id"))
  await toggleProfessionalStatus(id)
}

export default async function ProfissionaisPage() {
  const professionals = await getProfessionals()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translations.professional.title}</h1>
        <Button asChild>
          <Link href="/painel/profissionais/novo">{translations.professional.addProfessional}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translations.professional.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {professionals.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">Nenhum profissional cadastrado</p>
          ) : (
            <div className="divide-y">
              {professionals.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    {p.commission_percentage != null && (
                      <p className="text-sm text-neutral-500">{translations.professional.commission}: {Number(p.commission_percentage).toFixed(2)}%</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${p.is_active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"}`}>
                    {p.is_active ? "Ativo" : "Inativo"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/painel/profissionais/${p.id}/editar`}>{translations.common.edit}</Link>
                    </Button>
                    <form action={toggle}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button variant="ghost" size="sm">{p.is_active ? "Desativar" : "Ativar"}</Button>
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
