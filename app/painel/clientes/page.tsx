import { getCustomers } from "@/lib/actions/customer"
import { getEstablishmentWithConfig } from "@/lib/actions/establishment"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { translations } from "@/lib/translations/pt-br"

export default async function ClientesPage() {
  const customers = await getCustomers()
  const establishmentData = await getEstablishmentWithConfig()

  const programType = establishmentData?.config?.program_type
  const unit = programType === "Carimbo" ? "carimbos" : "pontos"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{translations.dashboard.customerList}</h1>
        <Button asChild>
          <Link href="/painel/clientes/novo" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {translations.customer.addCustomer}
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
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">Nenhum cliente cadastrado ainda.</p>
              <Button asChild className="bg-[#25D366] hover:bg-[#20BD5A]">
                <Link href="/painel/clientes/novo">Cadastrar Primeiro Cliente</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {customers.map((record: any) => (
                <Link
                  key={record.id}
                  href={`/painel/clientes/${record.customer_id}`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{record.customers.name}</p>
                    <p className="text-sm text-neutral-500">{record.customers.whatsapp}</p>
                    {record.last_transaction_at && (
                      <p className="text-xs text-neutral-400 mt-1">
                        Última visita: {new Date(record.last_transaction_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#25D366]">{record.balance}</p>
                    <p className="text-xs text-neutral-500">{unit}</p>
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
