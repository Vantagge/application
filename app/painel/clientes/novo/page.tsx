"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { translations } from "@/lib/translations/pt-br"
import { createCustomer } from "@/lib/actions/customer"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NovoClientePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
  })

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return `+${numbers}`
    if (numbers.length <= 4) return `+${numbers.slice(0, 2)} ${numbers.slice(2)}`
    if (numbers.length <= 6) return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`
    if (numbers.length <= 11)
      return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9)}`
    return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`
  }

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value)
    setFormData({ ...formData, whatsapp: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const cleanWhatsApp = "+" + formData.whatsapp.replace(/\D/g, "")

      if (!cleanWhatsApp.match(/^\+55[0-9]{10,11}$/)) {
        throw new Error(translations.errors.invalidWhatsApp)
      }

      await createCustomer({
        name: formData.name,
        whatsapp: cleanWhatsApp,
        email: formData.email || undefined,
      })

      router.push("/painel/clientes")
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/painel/clientes" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {translations.common.back}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{translations.customer.addCustomer}</CardTitle>
          <CardDescription>Cadastre um novo cliente no programa de fidelidade</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">{translations.customer.name} *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo do cliente"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="whatsapp">{translations.customer.whatsapp} *</Label>
              <Input
                id="whatsapp"
                required
                value={formData.whatsapp}
                onChange={handleWhatsAppChange}
                placeholder="+55 11 99999-9999"
                disabled={isLoading}
              />
              <p className="text-xs text-neutral-500">Formato: +55 DDD NÚMERO</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">{translations.customer.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                disabled={isLoading}
              />
            </div>

            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {translations.common.cancel}
              </Button>
              <Button type="submit" className="flex-1 bg-[#25D366] hover:bg-[#20BD5A]" disabled={isLoading}>
                {isLoading ? "Cadastrando..." : translations.common.save}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
