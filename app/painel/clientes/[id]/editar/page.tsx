import { getCustomerDetails, updateCustomer } from "@/lib/actions/customer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { translations } from "@/lib/translations/pt-br"

async function update(formData: FormData) {
  "use server"
  const id = String(formData.get("id"))
  const name = String(formData.get("name") || "").trim()
  const whatsapp = String(formData.get("whatsapp") || "").trim()
  const email = String(formData.get("email") || "") || undefined

  // ensure +55 format remains if already formatted
  const cleanWhatsapp = whatsapp.startsWith("+") ? "+" + whatsapp.replace(/\D/g, "") : "+" + whatsapp.replace(/\D/g, "")

  await updateCustomer(id, { name, whatsapp: cleanWhatsapp, email })
}

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { loyalty } = await getCustomerDetails(id)
  const customer = loyalty?.customers

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Cliente não encontrado.</p>
        <Button asChild className="mt-4"><Link href="/painel/clientes">Voltar</Link></Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{translations.common.edit} {translations.customer.singular || "Cliente"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={update} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <div className="space-y-2">
              <Label htmlFor="name">{translations.customer.name}</Label>
              <Input id="name" name="name" defaultValue={customer.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">{translations.customer.whatsapp}</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={customer.whatsapp} required />
              <p className="text-xs text-neutral-500">Formato: +55 DDD NÚMERO</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{translations.customer.email}</Label>
              <Input id="email" name="email" type="email" defaultValue={customer.email || ""} />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">{translations.common.save}</Button>
              <Button asChild variant="ghost">
                <Link href={`/painel/clientes/${id}`}>{translations.common.cancel}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
