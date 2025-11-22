"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { translations } from "@/lib/translations/pt-br"
import { createService, updateService } from "@/lib/actions/service"
import type { Service } from "@/lib/types/database"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

const serviceSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome muito longo (máx. 255 caracteres)"),
  description: z.string().max(500, "Descrição muito longa (máx. 500 caracteres)").optional(),
  price: z
    .number({ invalid_type_error: "Preço inválido" })
    .positive("Preço deve ser maior que zero")
    .multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais"),
  duration_minutes: z
    .number({ invalid_type_error: "Duração inválida" })
    .int("Duração deve ser um número inteiro")
    .positive("Duração deve ser maior que zero"),
  is_active: z.boolean().default(true),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

export function ServiceForm({
  service,
  mode,
}: {
  service?: Service
  mode: "create" | "edit"
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description || "",
          price: Number(service.price),
          duration_minutes: service.duration_minutes,
          is_active: service.is_active,
        }
      : {
          name: "",
          description: "",
          price: 0,
          duration_minutes: 30,
          is_active: true,
        },
  })

  const onSubmit = async (data: ServiceFormData) => {
    try {
      setSubmitting(true)

      if (mode === "create") {
        await createService(data)
        toast({ title: translations.success.created })
      } else if (service) {
        await updateService(service.id, data)
        toast({ title: translations.success.updated })
      }

      router.push("/painel/servicos")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar serviço",
        description: error?.message || "Tente novamente",
        variant: "destructive",
      })
    } finally {
        setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm("Deseja descartar as alterações?")
      if (!confirmDiscard) return
    }
    router.push("/painel/servicos")
  }

  const isActive = watch("is_active")

  return (
    <div className="relative min-h-screen md:min-h-0 px-4 sm:px-6 py-6">
      <div className="md:hidden mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card className="relative max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? translations.service.addService : translations.service.editService}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="required">
                {translations.service.name}
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ex: Corte Masculino"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="required">
                {translations.service.price}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price", { valueAsNumber: true })}
                  placeholder="0,00"
                  className={`pl-12 ${errors.price ? "border-destructive" : ""}`}
                />
              </div>
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes" className="required">
                {translations.service.duration}
              </Label>
              <div className="relative">
                <Input
                  id="duration_minutes"
                  type="number"
                  min="1"
                  {...register("duration_minutes", {
                    valueAsNumber: true,
                  })}
                  placeholder="Ex: 30"
                  className={errors.duration_minutes ? "border-destructive" : ""}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  min
                </span>
              </div>
              {errors.duration_minutes && (
                <p className="text-sm text-destructive">
                  {errors.duration_minutes.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {translations.service.description || "Descrição"}
                <span className="text-muted-foreground ml-1">(Opcional)</span>
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={translations.service.descriptionPlaceholder || "Detalhes sobre o serviço..."}
                rows={3}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {mode === "edit" && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-base">
                    Serviço Ativo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Desative para ocultar este serviço no registro de atendimentos
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("is_active", checked, { shouldDirty: true })}
                />
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:w-auto"
                disabled={submitting}
              >
                {translations.common.cancel}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  translations.common.save
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <LoadingOverlay show={submitting} label="Salvando..." fullscreen />
    </div>
  )
}
