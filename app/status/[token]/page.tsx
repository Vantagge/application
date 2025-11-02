import { getCustomerLoyaltyByToken } from "@/lib/actions/b2c"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Gift, CheckCircle2 } from "lucide-react"
import { translations } from "@/lib/translations/pt-br"

export default async function StatusPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getCustomerLoyaltyByToken(token)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-50 to-neutral-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-neutral-500">Link inválido ou expirado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { loyalty, config, customer, establishment } = data
  const programType = config?.program_type
  const isStampProgram = programType === "Carimbo"
  const unit = isStampProgram ? "carimbos" : "pontos"

  // Calculate progress
  let progress = 0
  let nextRewardAt = 0
  let remaining = 0

  if (isStampProgram && config?.stamps_for_reward) {
    nextRewardAt = config.stamps_for_reward
    progress = (loyalty.balance / nextRewardAt) * 100
    remaining = Math.max(0, nextRewardAt - loyalty.balance)
  }

  const canRedeem = isStampProgram ? loyalty.balance >= (config?.stamps_for_reward || 0) : loyalty.balance > 0

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#25D366]/10 via-neutral-50 to-neutral-100">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#25D366] mb-2">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">{translations.b2c.title}</h1>
          <p className="text-neutral-600">{establishment.name}</p>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-[#25D366] to-[#20BD5A] p-6 text-white">
            <p className="text-sm opacity-90 mb-2">Olá, {customer.name}!</p>
            <div className="space-y-1">
              <p className="text-sm opacity-90">{translations.b2c.yourBalance}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold">{loyalty.balance}</p>
                <p className="text-xl opacity-90">{unit}</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Progress for Stamp Program */}
            {isStampProgram && config?.stamps_for_reward && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Progresso para recompensa</span>
                  <span className="font-medium text-neutral-900">
                    {loyalty.balance} / {nextRewardAt}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#25D366] to-[#20BD5A] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                {/* Stamp Visualization */}
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: nextRewardAt }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center border-2 transition-all ${
                        i < loyalty.balance ? "bg-[#25D366] border-[#25D366]" : "bg-white border-neutral-200"
                      }`}
                    >
                      {i < loyalty.balance && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </div>
                  ))}
                </div>

                {canRedeem ? (
                  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <Gift className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-green-900">
                      Você pode resgatar sua recompensa! Mostre esta tela no estabelecimento.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-neutral-50 rounded-lg">
                    <Gift className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                    <p className="text-sm text-neutral-600">
                      Faltam apenas <span className="font-semibold text-neutral-900">{remaining}</span>{" "}
                      {remaining === 1 ? "carimbo" : "carimbos"} para sua próxima recompensa!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Points Program */}
            {!isStampProgram && (
              <div className="space-y-3">
                {canRedeem ? (
                  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <Gift className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-green-900">
                      Você tem pontos para resgatar! Mostre esta tela no estabelecimento.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-neutral-50 rounded-lg">
                    <Award className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                    <p className="text-sm text-neutral-600">Continue acumulando pontos para resgatar recompensas!</p>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900">{loyalty.redemption_count}</p>
                <p className="text-xs text-neutral-500 mt-1">Resgates realizados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900">{loyalty.total_redeemed}</p>
                <p className="text-xs text-neutral-500 mt-1">Total resgatado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            Powered by <span className="font-semibold">Vantagge</span>
          </p>
        </div>
      </div>
    </div>
  )
}
