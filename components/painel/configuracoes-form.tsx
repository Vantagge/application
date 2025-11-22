"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { translations } from "@/lib/translations/pt-br"
import type { ProgramType } from "@/lib/types/database"
import { updateEstablishmentConfig } from "@/lib/actions/establishment"

export default function ConfiguracoesForm({
  initialProgramType,
  initialValuePerPoint,
  initialStampsForReward,
}: {
  initialProgramType: ProgramType
  initialValuePerPoint: number
  initialStampsForReward: number
}) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    programType: initialProgramType as ProgramType,
    valuePerPoint: initialValuePerPoint,
    stampsForReward: initialStampsForReward,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateEstablishmentConfig(formData)
      toast({
        title: translations.success.updated,
        description: "Configurações atualizadas com sucesso!",
      })
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <Label>{translations.establishment.programType}</Label>
        <RadioGroup
          value={formData.programType}
          onValueChange={(value) => setFormData({ ...formData, programType: value as ProgramType })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Pontuacao" id="pontuacao" />
            <Label htmlFor="pontuacao" className="font-normal cursor-pointer">
              Pontuação (cliente ganha pontos por valor gasto)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Carimbo" id="carimbo" />
            <Label htmlFor="carimbo" className="font-normal cursor-pointer">
              Carimbo (cliente ganha 1 carimbo por visita)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {formData.programType === "Pontuacao" ? (
        <div className="grid gap-2">
          <Label htmlFor="valuePerPoint">{translations.establishment.valuePerPoint}</Label>
          <Input
            id="valuePerPoint"
            type="number"
            min="1"
            step="0.01"
            required
            value={formData.valuePerPoint}
            onChange={(e) => setFormData({ ...formData, valuePerPoint: Number.parseFloat(e.target.value) })}
          />
          <p className="text-sm text-neutral-500">Ex: R$ 10,00 = 1 ponto</p>
        </div>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="stampsForReward">{translations.establishment.stampsForReward}</Label>
          <Input
            id="stampsForReward"
            type="number"
            min="1"
            required
            value={formData.stampsForReward}
            onChange={(e) => setFormData({ ...formData, stampsForReward: Number.parseInt(e.target.value) })}
          />
          <p className="text-sm text-neutral-500">Ex: 10 carimbos = 1 recompensa</p>
        </div>
      )}

      <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#20BD5A]" disabled={isLoading}>
        {isLoading ? "Salvando..." : translations.common.save}
      </Button>
    </form>
  )
}
