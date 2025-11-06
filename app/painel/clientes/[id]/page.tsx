import { getCustomerDetails } from "@/lib/actions/customer"
import { getEstablishmentWithConfig } from "@/lib/actions/establishment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Phone, Mail } from "lucide-react"
import { translations } from "@/lib/translations/pt-br"
import { TransactionForm } from "@/components/painel/transaction-form"
import { RedeemButton } from "@/components/painel/redeem-button"

export default async function ClienteDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { loyalty, transactions } = await getCustomerDetails(id)
  const establishmentData = await getEstablishmentWithConfig()

  if (!loyalty) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Cliente não encontrado</p>
      </div>
    )
  }

  const customer = loyalty.customers
  const config = establishmentData?.config
  const programType = config?.program_type
  const unit = programType === "Carimbo" ? "carimbos" : "pontos"

  const canRedeem =
    programType === "Carimbo" ? loyalty.balance >= (config?.stamps_for_reward || 0) : loyalty.balance > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button asChild variant="ghost">
        <Link href="/painel/clientes" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {translations.common.back}
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{translations.customer.customerDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{customer.name}</p>
            </div>

            <div className="flex items-center gap-2 text-neutral-600">
              <Phone className="h-4 w-4" />
              <span className="text-sm">{customer.whatsapp}</span>
            </div>

            {customer.email && (
              <div className="flex items-center gap-2 text-neutral-600">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{customer.email}</span>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-neutral-500 mb-1">{translations.customer.loyaltyBalance}</p>
              <p className="text-4xl font-bold text-[#25D366]">{loyalty.balance}</p>
              <p className="text-sm text-neutral-500">{unit}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-neutral-500">Total Resgatado</p>
                <p className="text-lg font-semibold text-neutral-900">{loyalty.total_redeemed}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Resgates</p>
                <p className="text-lg font-semibold text-neutral-900">{loyalty.redemption_count}</p>
              </div>
            </div>

            <RedeemButton
              customerId={id}
              canRedeem={canRedeem}
              balance={loyalty.balance}
              programType={programType || "Pontuacao"}
              stampsNeeded={config?.stamps_for_reward || 0}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{translations.transaction.addTransaction}</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/painel?registrar=1&customerId=${id}`}>Registrar Atendimento</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionForm
              customerId={id}
              customerName={customer.name}
              programType={programType || "Pontuacao"}
              valuePerPoint={config?.value_per_point || 10}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translations.customer.transactionHistory}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-neutral-500">Nenhuma transação registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          transaction.type === "Resgate" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {transaction.type}
                      </span>
                      {transaction.monetary_value && (
                        <span className="text-sm text-neutral-500">R$ {transaction.monetary_value.toFixed(2)}</span>
                      )}
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-neutral-600 mt-1">{transaction.description}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(transaction.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.points_moved > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.points_moved > 0 ? "+" : ""}
                      {transaction.points_moved}
                    </p>
                    <p className="text-xs text-neutral-500">Saldo: {transaction.balance_after}</p>
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
