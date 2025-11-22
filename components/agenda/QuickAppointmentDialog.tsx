"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Professional, Service } from "@/lib/types/database"
import { CustomerSearchCombobox } from "@/components/painel/customer-search-combobox"
import type { ServiceItem } from "@/components/painel/service-selector"

export function QuickAppointmentDialog(props: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialDate: Date | null
  professionals: Professional[]
  services: Service[]
  existingAppointment?: { id: string; client_id: string; professional_id: string; service_ids: string[]; start_at: string } | null
  onSaved?: () => void
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null)
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("")
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([])
  const [dateTime, setDateTime] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const professionals = useMemo(() => (props.professionals || []).filter((p) => p.is_active), [props.professionals])
  const services = useMemo(() => (props.services || []).filter((s) => s.is_active), [props.services])

  // Prefill for new creation
  useEffect(() => {
    if (props.initialDate) {
      const iso = new Date(props.initialDate.getTime() - props.initialDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setDateTime(iso)
    }
  }, [props.initialDate])

  // Prefill for editing existing appointment
  useEffect(() => {
    const a = props.existingAppointment
    if (a) {
      setSelectedCustomer((prev) => prev ?? { id: a.client_id, name: "" })
      setSelectedProfessionalId(a.professional_id)
      setSelectedServices(props.services.filter(s => a.service_ids.includes(s.id)).map(s => ({ serviceId: s.id, name: s.name, unitPrice: Number(s.price), quantity: 1 })))
      const d = new Date(a.start_at)
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16)
      setDateTime(iso)
    } else {
      // reset when switching back to create mode
      setSelectedProfessionalId("")
      setSelectedServices([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.existingAppointment])

  function toggleService(svc: Service) {
    setSelectedServices((prev) => {
      const idx = prev.findIndex((i) => i.serviceId === svc.id)
      if (idx >= 0) return prev.filter((i) => i.serviceId !== svc.id)
      return [...prev, { serviceId: svc.id, name: svc.name, unitPrice: Number(svc.price), quantity: 1 }]
    })
  }

  async function handleSave() {
    if (!selectedProfessionalId) return
    if (selectedServices.length === 0) return
    if (!dateTime) return
    setSubmitting(true)
    try {
      const startIso = new Date(dateTime).toISOString()
      if (props.existingAppointment?.id) {
        // Edit existing
        const res = await fetch(`/api/appointments/${props.existingAppointment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_at: startIso,
            professional_id: selectedProfessionalId,
            service_ids: selectedServices.map((s) => s.serviceId),
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || "Erro ao atualizar agendamento")
      } else {
        // Create new
        if (!selectedCustomer) return
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedCustomer.id,
            professionalId: selectedProfessionalId,
            serviceIds: selectedServices.map((s) => s.serviceId),
            startAt: startIso,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Erro ao criar agendamento")
      }
      props.onOpenChange(false)
      // reset
      setSelectedCustomer(null)
      setSelectedProfessionalId("")
      setSelectedServices([])
      props.onSaved?.()
    } catch (e: any) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Cliente</Label>
            <CustomerSearchCombobox onSelect={(c) => setSelectedCustomer({ id: c.id, name: c.name })} selectedCustomerId={selectedCustomer?.id} />
          </div>
          <div>
            <Label className="text-xs">Profissional</Label>
            <select className="w-full border rounded-md h-9 px-2" value={selectedProfessionalId} onChange={(e) => setSelectedProfessionalId(e.target.value)}>
              <option value="">Selecione</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Data e horário</Label>
            <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Serviços</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-auto">
              {services.map((s) => (
                <button key={s.id} onClick={() => toggleService(s)} className={`text-left border rounded-md px-2 py-1 ${selectedServices.some((i) => i.serviceId === s.id) ? 'bg-primary text-primary-foreground border-primary' : ''}`}>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.duration_minutes} min</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => props.onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
