"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { translations } from "@/lib/translations/pt-br"
import type { Service, Professional } from "@/lib/types/database"
import { CustomerSearchCombobox } from "./customer-search-combobox"
import { ServiceSelector, type ServiceItem } from "./service-selector"
import { TransactionSummaryCard } from "./transaction-summary-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { recordServiceTransaction } from "@/lib/actions/transaction"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"

export function ServiceTransactionDialog(props: {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  customerId?: string
  customerName?: string
  services?: Service[]
  professionals?: Professional[]
  programType?: "Pontuacao" | "Carimbo"
  valuePerPoint?: number | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState<boolean>(props.isOpen ?? searchParams.get("registrar") === "1")
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(() => {
    if (props.customerId) return { id: props.customerId, name: props.customerName || "" }
    const cid = searchParams.get("customerId")
    return cid ? { id: cid, name: "" } : null
  })
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([])
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | undefined>(undefined)
  const professionals = props.professionals || []

  // Auto-select professional if only one is available
  useMemo(() => {
    if (professionals.length === 1 && !selectedProfessionalId) {
      setSelectedProfessionalId(professionals[0].id)
    }
  }, [professionals, selectedProfessionalId])

  const subtotal = useMemo(
    () => selectedServices.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [selectedServices],
  )
  const finalValue = Math.max(0, subtotal - (discountAmount || 0))

  const [submitting, setSubmitting] = useState(false)

  const onClose = (o: boolean) => {
    setOpen(o)
    props.onOpenChange?.(o)
    if (!o) {
      const sp = new URLSearchParams(Array.from(searchParams.entries()))
      sp.delete("registrar")
      router.replace(`?${sp.toString()}`, { scroll: false })
    }
  }

  const handleToggleService = (svc: Service) => {
    setSelectedServices((prev) => {
      const idx = prev.findIndex((i) => i.serviceId === svc.id)
      if (idx >= 0) return prev.filter((i) => i.serviceId !== svc.id)
      return [...prev, { serviceId: svc.id, name: svc.name, unitPrice: Number(svc.price), quantity: 1 }]
    })
  }

  const handleQtyChange = (serviceId: string, quantity: number) => {
    setSelectedServices((prev) => prev.map((i) => (i.serviceId === serviceId ? { ...i, quantity } : i)))
  }

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast({ title: "Cliente obrigatório", description: "Selecione um cliente." })
      return
    }
    if (selectedServices.length === 0) {
      toast({ title: "Selecione serviços", description: "Escolha pelo menos um serviço." })
      return
    }
    if (discountAmount > subtotal) {
      toast({ title: "Desconto inválido", description: "Desconto não pode ser maior que o subtotal." })
      return
    }
    if (finalValue < 0) {
      toast({ title: "Valor final inválido", description: "O total a pagar deve ser maior ou igual a zero." })
      return
    }
    if (professionals.length > 1 && !selectedProfessionalId) {
      toast({ title: "Profissional obrigatório", description: "Selecione o profissional." })
      return
    }

    try {
      setSubmitting(true)
      const res = await recordServiceTransaction({
        customerId: selectedCustomer.id,
        professionalId: selectedProfessionalId,
        services: selectedServices.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity, unitPrice: i.unitPrice })),
        discountAmount: discountAmount || 0,
        description: undefined,
      })
      toast({ title: "Atendimento registrado", description: `Saldo novo: ${res.newBalance}` })
      onClose(false)
      // reset state
      setSelectedServices([])
      setDiscountAmount(0)
    } catch (e: any) {
      toast({ title: "Erro ao registrar", description: e?.message || "Tente novamente" })
    } finally {
      setSubmitting(false)
    }
  }

  const shouldShowProfessional = professionals.length > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{translations.serviceTransaction.title}</DialogTitle>
        </DialogHeader>

        {/* Step 1: Customer */}
        {!props.customerId && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{translations.serviceTransaction.selectCustomer}</p>
            <CustomerSearchCombobox onSelect={(c) => setSelectedCustomer(c)} />
          </div>
        )}

        {/* Step 2: Services */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{translations.serviceTransaction.selectServices}</p>
          <ServiceSelector
            services={props.services || []}
            selectedServices={selectedServices}
            onServiceToggle={handleToggleService}
            onQuantityChange={handleQtyChange}
          />
        </div>

        {/* Step 3: Professional */}
        {shouldShowProfessional && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{translations.serviceTransaction.selectProfessional}</p>
            {professionals.length === 1 ? (
              <div className="text-sm">{professionals[0].name}</div>
            ) : (
              <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.professional.selectProfessional} />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <Separator />

        {/* Step 4: Summary */}
        <TransactionSummaryCard
          subtotal={subtotal}
          discountAmount={discountAmount}
          onDiscountChange={setDiscountAmount}
          finalValue={finalValue}
          programType={props.programType || "Pontuacao"}
          valuePerPoint={props.valuePerPoint ?? null}
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onClose(false)}>
            {translations.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedCustomer || selectedServices.length === 0}>
            {submitting ? "Salvando..." : translations.common.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
