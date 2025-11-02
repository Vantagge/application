"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { translations } from "@/lib/translations/pt-br"
import { recordTransaction } from "@/lib/actions/transaction"
import { useToast } from "@/hooks/use-toast"

interface TransactionFormProps {
  customerId: string
  customerName: string
  programType: string
  valuePerPoint: number
}

export function TransactionForm({ customerId, customerName, programType, valuePerPoint }: TransactionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [monetaryValue, setMonetaryValue] = useState("")
  const [description, setDescription] = useState("")

  const calculatePoints = () => {
    const value = Number.parseFloat(monetaryValue) || 0
    if (programType === "Pontuacao") {
      return Math.floor(value / valuePerPoint)
    }
    return 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const value = Number.parseFloat(monetaryValue)
      if (isNaN(value) || value <= 0) {
        throw new Error("Valor inválido")
      }

      const result = await recordTransaction({
        customerId,
        monetaryValue: value,
        description: description || undefined,
      })

      toast({
        title: translations.success.transactionRecorded,
        description: `${customerName} ganhou ${result.pointsEarned} ${programType === "Carimbo" ? "carimbos" : "pontos"}!`,
      })

      setMonetaryValue("")
      setDescription("")
      router.refresh()
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : translations.errors.generic,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const points = calculatePoints()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="value">Valor da Compra (R$) *</Label>
        <Input
          id="value"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={monetaryValue}
          onChange={(e) => setMonetaryValue(e.target.value)}
          placeholder="0.00"
          disabled={isLoading}
        />
        {monetaryValue && (
          <p className="text-sm text-[#25D366] font-medium">
            Cliente ganhará: {points} {programType === "Carimbo" ? "carimbo(s)" : "ponto(s)"}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Corte de cabelo"
          disabled={isLoading}
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#20BD5A]" disabled={isLoading}>
        {isLoading ? "Registrando..." : "Registrar Transação"}
      </Button>
    </form>
  )
}
