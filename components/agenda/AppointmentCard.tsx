"use client"

import { differenceInMinutes, format } from "date-fns"
import type { Appointment } from "@/lib/types/database"

export function minutesFromStartOfDay(dateIso: string, dayStartHour: number) {
  const d = new Date(dateIso)
  const start = new Date(d)
  start.setHours(dayStartHour, 0, 0, 0)
  return Math.max(0, differenceInMinutes(d, start))
}

export function appointmentPosition(
  appt: Pick<Appointment, "start_at" | "end_at">,
  opts: { hourHeight: number; dayStartHour: number }
) {
  const minsFromStart = minutesFromStartOfDay(appt.start_at, opts.dayStartHour)
  const durationMins = Math.max(15, differenceInMinutes(new Date(appt.end_at), new Date(appt.start_at)))
  const top = (minsFromStart / 60) * opts.hourHeight
  const height = (durationMins / 60) * opts.hourHeight
  return { top, height }
}

export function AppointmentCard(props: {
  appt: Appointment & { customers?: { name?: string } | null; professionals?: { name?: string } | null }
  hourHeight: number
  dayStartHour: number
  onClick?: (appt: Appointment) => void
}) {
  const { appt, hourHeight, dayStartHour } = props
  const { top, height } = appointmentPosition(appt, { hourHeight, dayStartHour })
  const durationMins = Math.max(15, differenceInMinutes(new Date(appt.end_at), new Date(appt.start_at)))
  const isCompact = height < hourHeight * 0.6
  const startTime = format(new Date(appt.start_at), "HH:mm")
  const endTime = format(new Date(appt.end_at), "HH:mm")

  const statusColor = appt.status === "COMPLETED" ? "bg-green-500" : appt.status === "CANCELED" ? "bg-gray-400" : "bg-blue-500"

  return (
    <button
      className="absolute left-1 right-1 rounded-md bg-blue-50 border border-blue-100 shadow-sm text-left overflow-hidden"
      style={{ top, height, minHeight: 24 }}
      onClick={() => props.onClick?.(appt)}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor}`} />
      <div className="px-2 py-1 h-full flex flex-col gap-0.5">
        <div className="text-xs font-semibold truncate">{appt.customers?.name || "Cliente"}</div>
        {!isCompact && (
          <>
            <div className="text-[11px] text-muted-foreground truncate">{appt.professionals?.name}</div>
            <div className="text-[11px] text-muted-foreground">{startTime} - {endTime}</div>
          </>
        )}
        {isCompact && (
          <div className="text-[11px] text-muted-foreground">{startTime}</div>
        )}
      </div>
    </button>
  )
}
