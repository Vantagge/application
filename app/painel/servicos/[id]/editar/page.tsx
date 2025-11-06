import { getService, updateService } from "@/lib/actions/service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"

async function update(id: string, formData: FormData) {
  "use server"
  const name = String(formData.get("name") || "").trim()
  const price = Number(formData.get("price") || 0)
  const duration = formData.get("duration_minutes") ? Number(formData.get("duration_minutes")) : null
  const description = String(formData.get("description") || "") || null
  const is_active = String(formData.get("is_active") || "true") === "true"

  await updateService(id, { name, price, duration_minutes: duration, description, is_active })
}

export default async function EditarServicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await getService(id)

  if (!service) {
    return <div className="text-center py-8 text-neutral-500">Serviço não encontrado.</div>
  }

  async function action(formData: FormData) {
    "use server"
    await update(id, formData)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Editar Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={service.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>
              <Input id="price" name="price" type="number" step="0.01" defaultValue={Number(service.price)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (minutos)</Label>
              <Input id="duration_minutes" name="duration_minutes" type="number" defaultValue={service.duration_minutes ?? undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" name="description" defaultValue={service.description ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <select id="is_active" name="is_active" defaultValue={service.is_active ? "true" : "false"} className="border rounded px-3 py-2">
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">Salvar</Button>
              <Button asChild variant="ghost">
                <Link href="/painel/servicos">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
