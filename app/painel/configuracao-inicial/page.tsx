"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { translations } from "@/lib/translations/pt-br"
import { createEstablishment } from "@/lib/actions/establishment"
import type { EstablishmentCategory, ProgramType } from "@/lib/types/database"

export default function ConfiguracaoInicialPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    category: "Barbearia" as EstablishmentCategory,
    address: "",
    responsibleName: "",
    programType: "Pontuacao" as ProgramType,
    valuePerPoint: 10,
    stampsForReward: 10,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await createEstablishment(formData)
      router.push("/painel")
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>Configure seu estabelecimento e programa de fidelidade</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Dados do Estabelecimento</h3>

              <div className="grid gap-2">
                <Label htmlFor="name">{translations.establishment.name}</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Barbearia do João"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">{translations.establishment.category}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as EstablishmentCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Barbearia">Barbearia</SelectItem>
                    <SelectItem value="Salão de Beleza">Salão de Beleza</SelectItem>
                    <SelectItem value="Estética">Estética</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">{translations.establishment.address}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="responsibleName">{translations.establishment.responsibleName}</Label>
                <Input
                  id="responsibleName"
                  required
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Programa de Fidelidade</h3>

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
            </div>

            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#20BD5A]" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Concluir Configuração"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
