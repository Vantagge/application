"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { translations } from "@/lib/translations/pt-br"
import type { Service, Professional } from "@/lib/types/database"
import { CustomerSearchCombobox } from "./customer-search-combobox"
import { ServiceSelector, type ServiceItem } from "./service-selector"
import { TransactionSummaryCard } from "./transaction-summary-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { redeemLoyaltyReward } from "@/lib/actions/loyalty"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ServiceTransactionDialog(props: {
  isOpen: boolean
  onOpenChange?: (open: boolean) => void
  customerId?: string
  customerName?: string
  services?: Service[]
  professionals?: Professional[]
  programType?: "Pontuacao" | "Carimbo"
  valuePerPoint?: number | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState<boolean>(props.isOpen)
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(() => {
    if (props.customerId) return { id: props.customerId, name: props.customerName || "" }
    return null
  })
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([])
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | undefined>(undefined)
  // Only show active professionals in the dialog
  const professionals = useMemo(() => (props.professionals || []).filter((p) => p.is_active), [props.professionals])
  // Only show active services in the selector
  const services = useMemo(() => (props.services || []).filter((s) => s.is_active), [props.services])

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
  const [appointmentMode, setAppointmentMode] = useState<"none" | "appointment" | "walkin">("none")
  const [appointments, setAppointments] = useState<any[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof props.isOpen === "boolean") setOpen(props.isOpen)
  }, [props.isOpen])

  // Load today's pending appointments when in appointment mode
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (appointmentMode !== "appointment" || !open) return
      setLoadingAppointments(true)
      try {
        const res = await fetch(`/api/appointments?scope=today&status=PENDING`, { cache: "no-store" })
        const json = await res.json()
        if (!cancelled) setAppointments(json.data || [])
      } catch {
        if (!cancelled) setAppointments([])
      } finally {
        if (!cancelled) setLoadingAppointments(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [appointmentMode, open])


  const onClose = (o: boolean) => {
    setOpen(o)
    props.onOpenChange?.(o)
    if (!o) {
      // reset state
      setStep(0)
      setAppointmentMode("none")
      setAppointments([])
      setSelectedAppointmentId(null)
      setSelectedCustomer(props.customerId ? { id: props.customerId, name: props.customerName || "" } : null)
      setSelectedServices([])
      setDiscountAmount(0)
      setSelectedProfessionalId(undefined)
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
      const response = await fetch("/api/transactions/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          professionalId: selectedProfessionalId,
          services: selectedServices.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity, unitPrice: i.unitPrice })),
          discountAmount: discountAmount || 0,
          description: undefined,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        toast({ title: "Erro ao registrar", description: err?.error || "Tente novamente" })
        return
      }

      const data = await response.json()
      // If this came from an appointment, mark it completed
      if (selectedAppointmentId) {
        try {
          await fetch(`/api/appointments/${selectedAppointmentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COMPLETED' }),
          })
        } catch {}
      }
      toast({ title: "Atendimento registrado", description: `Saldo novo: ${data.newBalance}` })
      onClose(false)
      // reset state
      setSelectedServices([])
      setDiscountAmount(0)
      setSelectedAppointmentId(null)
      setAppointmentMode('none')
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
    <Dialog open={props.isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
          {/* Initial Step: choose mode */}
          {appointmentMode === "none" && (
            <div className="grid gap-3">
              <p className="text-sm font-medium">Como deseja registrar?</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAppointmentMode("appointment")
                  }}
                >
                  Selecionar Agendamento
                </Button>
                <Button
                  onClick={() => {
                    setAppointmentMode("walkin")
                    setStep(0)
                  }}
                >
                  Atendimento Avulso
                </Button>
              </div>
            </div>
          )}

          {/* Appointment list when selecting an appointment */}
          {appointmentMode === "appointment" && (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Agendamentos de hoje (PENDING)</p>
                <Button variant="ghost" size="sm" onClick={() => setAppointmentMode("none")}>Voltar</Button>
              </div>
              {loadingAppointments ? (
                <div className="text-sm text-muted-foreground">Carregando...</div>
              ) : appointments.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</div>
              ) : (
                <div className="space-y-2">
                  {appointments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedAppointmentId(a.id)
                        // populate from appointment
                        if (a.customers) setSelectedCustomer({ id: a.client_id, name: a.customers.name })
                        setSelectedProfessionalId(a.professional_id)
                        // Map service_ids to known services
                        const svcMap = new Map(services.map((s) => [s.id, s]))
                        const svcItems = (a.service_ids as string[]).map((sid: string) => {
                          const s = svcMap.get(sid)
                          return s ? { serviceId: s.id, name: s.name, unitPrice: Number(s.price), quantity: 1 } : null
                        }).filter(Boolean) as ServiceItem[]
                        setSelectedServices(svcItems)
                        setAppointmentMode("walkin")
                        setStep(1) // skip customer
                      }}
                      className={`w-full text-left rounded-md border p-3 hover:bg-muted ${selectedAppointmentId === a.id ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{a.customers?.name || 'Cliente'}</div>
                          <div className="text-xs text-muted-foreground">{new Date(a.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(a.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{professionals.find(p=>p.id===a.professional_id)?.name || ''}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 0: Customer */}
          {appointmentMode === "walkin" && step === 0 && !props.customerId && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{translations.serviceTransaction.selectCustomer}</p>
              <CustomerSearchCombobox onSelect={(c) => setSelectedCustomer(c)} />
            </div>
          )}
          {appointmentMode === "walkin" && step === 0 && props.customerId && (
            <div className="text-sm text-muted-foreground">Cliente pré-selecionado.</div>
          )}

          {/* Step 1: Services */}
          {appointmentMode !== "none" && step === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{translations.serviceTransaction.selectServices}</p>
              <ServiceSelector
                services={services}
                selectedServices={selectedServices}
                onServiceToggle={handleToggleService}
                onQuantityChange={handleQtyChange}
              />
            </div>
          )}

          {/* Step 2: Professional */}
          {appointmentMode !== "none" && step === 2 && shouldShowProfessional && (
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
          {appointmentMode !== "none" && step === 2 && !shouldShowProfessional && (
            <div className="text-sm text-muted-foreground">Nenhum profissional ativo.</div>
          )}

          {/* Step 3: Summary */}
          {appointmentMode !== "none" && step === 3 && (
            <>
              <TransactionSummaryCard
                subtotal={subtotal}
                discountAmount={discountAmount}
                onDiscountChange={setDiscountAmount}
                finalValue={finalValue}
                programType={props.programType || 'Pontuacao'}
                valuePerPoint={props.valuePerPoint ?? null}
              />
              {/* Duration info */}
              <div className="text-xs text-muted-foreground mt-2">
                Tempo total estimado: {selectedServices.reduce((sum, i) => {
                  const svc = services.find(s => s.id === i.serviceId)
                  return sum + (svc ? svc.duration_minutes * i.quantity : 0)
                }, 0)} min
              </div>
            </>
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
        {(submitting || redeeming) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-lg bg-background/90 px-5 py-4 shadow">
              <span className="text-sm">{submitting ? 'Salvando...' : 'Processando...'}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
