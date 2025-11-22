"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { translations } from "@/lib/translations/pt-br"
import { getEstablishmentWithConfig, updateEstablishmentConfig } from "@/lib/actions/establishment"
import { useToast } from "@/hooks/use-toast"
import type { ProgramType } from "@/lib/types/database"
import { LogoUploader } from "@/components/painel/logo-uploader"

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [establishment, setEstablishment] = useState<any>(null)

  const [formData, setFormData] = useState({
    programType: "Pontuacao" as ProgramType,
    valuePerPoint: 10,
    stampsForReward: 10,
  })

  useEffect(() => {
    async function loadData() {
      const data = await getEstablishmentWithConfig()
      if (data?.config) {
        setEstablishment(data)
        setFormData({
          programType: data.config.program_type,
          valuePerPoint: data.config.value_per_point || 10,
          stampsForReward: data.config.stamps_for_reward || 10,
        })
      }
    }
    loadData()
  }, [])

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

  if (!establishment) {
    return <div>Carregando...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Estabelecimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <LogoUploader
              initialUrl={establishment.establishment.logo_url}
              establishmentName={establishment.establishment.name}
              onUploaded={(url) => setEstablishment((prev: any) => ({ ...prev, establishment: { ...prev.establishment, logo_url: url } }))}
            />
            <div className="flex-1 space-y-4">
              <div>
                <Label className="text-neutral-500">Nome</Label>
                <p className="text-lg font-medium flex items-center gap-2">
                  {establishment.establishment.name}
                  {establishment.establishment.registration && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                      #{establishment.establishment.registration}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-neutral-500">Categoria</Label>
                <p className="text-lg font-medium">{establishment.establishment.category}</p>
              </div>
              <div>
                <Label className="text-neutral-500">Responsável</Label>
                <p className="text-lg font-medium">{establishment.establishment.responsible_name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programa de Fidelidade</CardTitle>
          <CardDescription>Configure as regras do seu programa de fidelidade</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
