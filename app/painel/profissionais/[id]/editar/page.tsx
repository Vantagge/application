import { getProfessional, updateProfessional } from "@/lib/actions/professional"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SubmitButtonWithOverlay } from "@/components/ui/form-submit-overlay"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { translations } from "@/lib/translations/pt-br"

async function update(formData: FormData) {
  "use server"
  const id = String(formData.get("id"))
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "") || null
  const phone = String(formData.get("phone") || "") || null
  const commission = formData.get("commission_percentage") ? Number(formData.get("commission_percentage")) : null

  await updateProfessional(id, { name, email, phone, commission_percentage: commission })
}

export default async function EditarProfissionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const professional = await getProfessional(id)

  if (!professional) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Profissional não encontrado.</p>
        <Button asChild className="mt-4"><Link href="/painel/profissionais">Voltar</Link></Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{translations.common.edit} {translations.professional.singular || "Profissional"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={update} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <div className="space-y-2">
              <Label htmlFor="name">{translations.professional.name}</Label>
              <Input id="name" name="name" defaultValue={professional.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={professional.email || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={professional.phone || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_percentage">{translations.professional.commission}</Label>
              <Input id="commission_percentage" name="commission_percentage" type="number" step="0.01" defaultValue={professional.commission_percentage ?? undefined} />
            </div>
            <div className="flex items-center gap-2">
              <SubmitButtonWithOverlay label={translations.common.save} />
              <Button asChild variant="ghost">
                <Link href={`/painel/profissionais`}>{translations.common.cancel}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
