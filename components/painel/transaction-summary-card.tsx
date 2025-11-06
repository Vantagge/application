"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Gift } from "lucide-react"
import { translations } from "@/lib/translations/pt-br"
import type { ProgramType } from "@/lib/types/database"

export function TransactionSummaryCard({
  subtotal,
  discountAmount,
  onDiscountChange,
  finalValue,
  programType,
  valuePerPoint,
}: {
  subtotal: number
  discountAmount: number
  onDiscountChange: (v: number) => void
  finalValue: number
  programType: ProgramType
  valuePerPoint?: number | null
}) {
  const pointsToEarn = (() => {
    if (programType === "Carimbo") return 1
    const vpp = valuePerPoint || 10
    return Math.floor((finalValue || 0) / vpp)
  })()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translations.serviceTransaction.summary}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <Label>Desconto (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={Number(discountAmount).toString()}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            className="w-32"
          />
        </div>

        <Separator />

        <div className="flex justify-between text-lg">
          <span className="font-bold">Total a Pagar</span>
          <span className="font-bold text-green-600">R$ {finalValue.toFixed(2)}</span>
        </div>

        <Alert>
          <Gift className="h-4 w-4" />
          <AlertDescription>
            {translations.serviceTransaction.willEarn} <strong>{pointsToEarn}</strong>{" "}
            {programType === "Carimbo" ? "carimbos" : "pontos"}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
