"use client"

import { useMemo, useState } from "react"
import { addDays, format, startOfWeek } from "date-fns"
import { DayStrip } from "./DayStrip"
import { Timeline } from "./Timeline"
import { useSchedule } from "@/hooks/useSchedule"
import type { Professional, Service, Appointment } from "@/lib/types/database"
import { DetailsDialog } from "./DetailsDialog"
import { QuickAppointmentDialog } from "./QuickAppointmentDialog"

export function AgendaClient(props: { professionals: Professional[]; services: Service[] }) {
  const [mode, setMode] = useState<"day" | "week">("day")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { appointments, reload, patchAppointment } = useSchedule(selectedDate, { status: "PENDING" })
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickDate, setQuickDate] = useState<Date | null>(null)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)

  function handleEmptySlotClick(dt: Date) {
    setQuickDate(dt)
    setQuickOpen(true)
  }

  function handleApptClick(a: any) {
    setSelectedAppt(a)
    setDetailsOpen(true)
  }

  async function handleCancel(id: string) {
    await patchAppointment(id, { status: "CANCELED" })
    setDetailsOpen(false)
  }
  async function handleComplete(id: string) {
    await patchAppointment(id, { status: "COMPLETED" })
    setDetailsOpen(false)
  }

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i))
  }, [selectedDate])

  return (
    <div className="min-h-screen">
      <DayStrip baseDate={new Date()} selectedDate={selectedDate} onSelect={setSelectedDate} mode={mode} onModeChange={setMode} />
      <div className="p-4">
        {mode === "day" ? (
          <Timeline date={selectedDate} appointments={appointments as any} onEmptySlotClick={handleEmptySlotClick} onAppointmentClick={handleApptClick} />
        ) : (
          <div className="hidden md:grid grid-cols-7 gap-4">
            {weekDays.map((d) => (
              <div key={d.toISOString()} className="border rounded-md overflow-hidden">
                <div className="px-3 py-2 text-sm font-medium border-b bg-muted">{format(d, 'EEE d')}</div>
                <div className="p-2">
                  <Timeline date={d} appointments={(appointments as any).filter((a: any) => new Date(a.start_at).toDateString() === d.toDateString())} onEmptySlotClick={handleEmptySlotClick} onAppointmentClick={handleApptClick} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} appointment={selectedAppt} onCancel={handleCancel} onComplete={handleComplete} onEdit={(a) => {
        setQuickDate(new Date(a.start_at))
        setEditingAppt(a as any)
        setQuickOpen(true)
      }} />

      <QuickAppointmentDialog open={quickOpen} onOpenChange={(o) => { setQuickOpen(o); if (!o) { setQuickDate(null); setEditingAppt(null) } }} initialDate={quickDate} professionals={props.professionals} services={props.services} existingAppointment={editingAppt as any} onSaved={reload} />
    </div>
  )
}
