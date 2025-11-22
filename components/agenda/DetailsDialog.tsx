"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Appointment } from "@/lib/types/database"

export function DetailsDialog(props: {
  open: boolean
  onOpenChange: (o: boolean) => void
  appointment: (Appointment & { customers?: { name?: string } | null; professionals?: { name?: string } | null }) | null
  onCancel: (id: string) => Promise<void> | void
  onComplete: (id: string) => Promise<void> | void
  onEdit: (appt: Appointment) => void
}) {
  const a = props.appointment
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
        </DialogHeader>
        {a ? (
          <div className="space-y-2">
            <div className="text-sm"><span className="font-medium">Cliente:</span> {a.customers?.name || a.client_id}</div>
            <div className="text-sm"><span className="font-medium">Profissional:</span> {a.professionals?.name || a.professional_id}</div>
            <div className="text-sm"><span className="font-medium">Status:</span> {a.status}</div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => props.onEdit(a)}>Editar</Button>
              <Button variant="destructive" onClick={() => props.onCancel(a.id)}>Cancelar</Button>
              <Button onClick={() => props.onComplete(a.id)}>Concluir</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
