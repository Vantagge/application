import { createService } from "@/lib/actions/service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { translations } from "@/lib/translations/pt-br"
import Link from "next/link"

async function create(formData: FormData) {
  "use server"
  const name = String(formData.get("name") || "").trim()
  const price = Number(formData.get("price") || 0)
  const duration = formData.get("duration_minutes") ? Number(formData.get("duration_minutes")) : null
  const description = String(formData.get("description") || "") || null

  await createService({ name, price, duration_minutes: duration, description })
}

export default function NovoServicoPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{translations.service.addService}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={create} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{translations.service.name}</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">{translations.service.price}</Label>
              <Input id="price" name="price" type="number" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">{translations.service.duration}</Label>
              <Input id="duration_minutes" name="duration_minutes" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" name="description" />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">{translations.common.save}</Button>
              <Button asChild variant="ghost">
                <Link href="/painel/servicos">{translations.common.cancel}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
