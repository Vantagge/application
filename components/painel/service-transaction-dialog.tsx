"use client"

import { useState, useMemo, useEffect } from "react"
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
import { redeemLoyaltyReward } from "@/lib/actions/loyalty"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const [redeeming, setRedeeming] = useState(false)
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)

  useEffect(() => {
    // Sync open state with query param changes
    const isRegister = searchParams.get("registrar") === "1"
    setOpen((prev) => (prev !== isRegister ? isRegister : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const onClose = (o: boolean) => {
    setOpen(o)
    props.onOpenChange?.(o)
    if (!o) {
      const sp = new URLSearchParams(Array.from(searchParams.entries()))
      sp.delete("registrar")
      router.replace(`?${sp.toString()}`, { scroll: false })
      // reset step
      setStep(0)
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

  const handleRedeem = async () => {
    if (!selectedCustomer) {
      toast({ title: "Cliente obrigatório", description: "Selecione um cliente." })
      return
    }
    if (selectedServices.length !== 1) {
      toast({ title: translations.loyalty.selectServiceToRedeem, description: "Escolha exatamente um serviço para resgatar." })
      return
    }
    try {
      setRedeeming(true)
      const svc = selectedServices[0]
      await redeemLoyaltyReward({
        customerId: selectedCustomer.id,
        serviceId: svc.serviceId,
        professionalId: selectedProfessionalId,
      })
      toast({ title: translations.loyalty.redeemSuccess })
      onClose(false)
      setSelectedServices([])
      setDiscountAmount(0)
    } catch (e: any) {
      toast({ title: "Erro no resgate", description: e?.message || translations.errors.generic })
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 sm:max-w-2xl max-h-[90vh] overflow-y-auto top-0 left-0 translate-x-0 translate-y-0 h-svh w-svw sm:top-1/2 sm:left-1/2 sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-auto sm:w-full">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-card px-6 py-4 border-b">
          <DialogHeader className="p-0">
            <DialogTitle>{translations.serviceTransaction.title}</DialogTitle>
          </DialogHeader>
          {/* Simple step indicator */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[translations.serviceTransaction.selectCustomer, translations.serviceTransaction.selectServices, translations.serviceTransaction.selectProfessional, translations.serviceTransaction.summary].map((label, i) => (
              <div key={i} className={`h-1 rounded-full ${step >= i ? 'bg-primary' : 'bg-muted'}`} aria-hidden />
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <ScrollArea className="px-6 py-4 max-h-[calc(90vh-140px)] sm:max-h-[60vh]">
          {/* Step 0: Customer */}
          {step === 0 && !props.customerId && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{translations.serviceTransaction.selectCustomer}</p>
              <CustomerSearchCombobox onSelect={(c) => setSelectedCustomer(c)} />
            </div>
          )}
          {step === 0 && props.customerId && (
            <div className="text-sm text-muted-foreground">Cliente pré-selecionado.</div>
          )}

          {/* Step 1: Services */}
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{translations.serviceTransaction.selectServices}</p>
              <ServiceSelector
                services={props.services || []}
                selectedServices={selectedServices}
                onServiceToggle={handleToggleService}
                onQuantityChange={handleQtyChange}
              />
            </div>
          )}

          {/* Step 2: Professional */}
          {step === 2 && shouldShowProfessional && (
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
          {step === 2 && !shouldShowProfessional && (
            <div className="text-sm text-muted-foreground">Nenhum profissional cadastrado.</div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <TransactionSummaryCard
              subtotal={subtotal}
              discountAmount={discountAmount}
              onDiscountChange={setDiscountAmount}
              finalValue={finalValue}
              programType={props.programType || 'Pontuacao'}
              valuePerPoint={props.valuePerPoint ?? null}
            />
          )}
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-card px-6 py-4 border-t flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => (step === 0 ? onClose(false) : setStep((s) => (s > 0 ? ((s - 1) as any) : s)))}>
            {step === 0 ? translations.common.close : translations.serviceTransaction.back}
          </Button>
          <div className="flex gap-2">
            {step < 3 && (
              <Button
                onClick={() => {
                  // per-step validation before advancing
                  if (step === 0 && !props.customerId && !selectedCustomer) {
                    toast({ title: 'Cliente obrigatório', description: 'Selecione um cliente.' })
                    return
                  }
                  if (step === 1 && selectedServices.length === 0) {
                    toast({ title: 'Selecione serviços', description: 'Escolha pelo menos um serviço.' })
                    return
                  }
                  if (step === 2 && professionals.length > 1 && !selectedProfessionalId) {
                    toast({ title: 'Profissional obrigatório', description: 'Selecione o profissional.' })
                    return
                  }
                  setStep((s) => ((s + 1) as any))
                }}
              >
                {translations.serviceTransaction.next}
              </Button>
            )}
            {step === 3 && (
              <>
                {props.programType === 'Carimbo' && (
                  <Button
                    variant="secondary"
                    onClick={handleRedeem}
                    disabled={redeeming || (!props.customerId && !selectedCustomer) || selectedServices.length !== 1}
                  >
                    {redeeming ? 'Resgatando...' : translations.loyalty.redeem}
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || (!props.customerId && !selectedCustomer) || selectedServices.length === 0}
                >
                  {submitting ? 'Salvando...' : translations.serviceTransaction.finish}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
