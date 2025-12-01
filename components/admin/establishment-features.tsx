"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

export type FeatureItem = { key: string; name: string | null; description: string | null; enabled: boolean }

export function EstablishmentFeatures({ establishmentId, initial }: { establishmentId: string; initial: FeatureItem[] }) {
  const { toast } = useToast()
  const [items, setItems] = React.useState<FeatureItem[]>(initial)
  const [loadingKey, setLoadingKey] = React.useState<string | null>(null)

  async function toggle(key: string, next: boolean) {
    setLoadingKey(key)
    const prev = items
    setItems((cur) => cur.map((i) => (i.key === key ? { ...i, enabled: next } : i)))
    try {
      const res = await fetch("/api/admin/features/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ establishmentId, featureKey: key, isEnabled: next }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "Falha ao atualizar feature")
      toast({ title: "Alterações salvas", description: `Feature '${key}' ${next ? "ativada" : "desativada"}.` })
    } catch (e: any) {
      setItems(prev)
      toast({ title: "Erro", description: e?.message || "Não foi possível salvar.", variant: "destructive" as any })
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funcionalidades</CardTitle>
        <CardDescription>Ative ou desative módulos disponíveis para este estabelecimento.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {items.map((f) => (
            <div key={f.key} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <div className="font-medium">{f.name || f.key}</div>
                {f.description ? <div className="text-sm text-muted-foreground">{f.description}</div> : null}
              </div>
              <Switch
                checked={!!f.enabled}
                disabled={loadingKey === f.key}
                onCheckedChange={(v) => toggle(f.key, !!v)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
