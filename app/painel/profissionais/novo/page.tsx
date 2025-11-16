import { createProfessional } from "@/lib/actions/professional"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SubmitButtonWithOverlay } from "@/components/ui/form-submit-overlay"
import { Label } from "@/components/ui/label"
import { translations } from "@/lib/translations/pt-br"
import Link from "next/link"

async function create(formData: FormData) {
  "use server"
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "") || null
  const phone = String(formData.get("phone") || "") || null
  const commission = formData.get("commission_percentage")
    ? Number(formData.get("commission_percentage"))
    : null

  await createProfessional({ name, email, phone, commission_percentage: commission })
}

export default function NovoProfissionalPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{translations.professional.addProfessional}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={create} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{translations.professional.name}</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_percentage">{translations.professional.commission}</Label>
              <Input id="commission_percentage" name="commission_percentage" type="number" step="0.01" />
            </div>
            <div className="flex items-center gap-2">
              <SubmitButtonWithOverlay label={translations.common.save} />
              <Button asChild variant="ghost">
                <Link href="/painel/profissionais">{translations.common.cancel}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
