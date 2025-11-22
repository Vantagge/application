"use client"

import { useEffect, useMemo, useRef } from "react"
import { isToday, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns"
import { AppointmentCard } from "./AppointmentCard"
import type { Appointment } from "@/lib/types/database"

export type TimelineProps = {
  date: Date
  appointments: (Appointment & { customers?: { name?: string } | null; professionals?: { name?: string } | null })[]
  hourStart?: number
  hourEnd?: number
  hourHeight?: number
  onEmptySlotClick?: (dateTime: Date) => void
  onAppointmentClick?: (appt: Appointment) => void
}

export function Timeline({ date, appointments, hourStart = 8, hourEnd = 20, hourHeight = 96, onEmptySlotClick, onAppointmentClick }: TimelineProps) {
  const hours = useMemo(() => {
    const arr: number[] = []
    for (let h = hourStart; h <= hourEnd; h++) arr.push(h)
    return arr
  }, [hourStart, hourEnd])

  const containerRef = useRef<HTMLDivElement>(null)

  // Current time indicator
  const showNow = isToday(date)
  const nowTop = useMemo(() => {
    if (!showNow) return 0
    const now = new Date()
    const mins = now.getHours() * 60 + now.getMinutes() - hourStart * 60
    return Math.max(0, (mins / 60) * hourHeight)
  }, [showNow, hourStart, hourHeight, date])

  useEffect(() => {
    if (!showNow) return
    const id = setInterval(() => {
      if (containerRef.current) {
        containerRef.current.style.setProperty("--now-top", `${nowTop}px`)
      }
    }, 60000)
    return () => clearInterval(id)
  }, [showNow, nowTop])

  function handleClick(e: React.MouseEvent) {
    if (!onEmptySlotClick) return
    const bounds = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const y = e.clientY - bounds.top
    const minutesFromStart = (y / hourHeight) * 60
    const hour = Math.floor(minutesFromStart / 60) + hourStart
    const minutes = Math.round((minutesFromStart % 60) / 15) * 15
    let dt = setHours(date, hour)
    dt = setMinutes(dt, minutes)
    dt = setSeconds(dt, 0)
    dt = setMilliseconds(dt, 0)
    onEmptySlotClick(dt)
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-[56px_1fr]">
        <div />
        <div className="relative" onClick={handleClick}>
          {/* events layer */}
          <div className="absolute inset-0" ref={containerRef}>
            {appointments.map((a) => (
              <AppointmentCard key={a.id} appt={a} hourHeight={hourHeight} dayStartHour={hourStart} onClick={onAppointmentClick} />
            ))}
            {showNow && (
              <div className="absolute left-0 right-0" style={{ top: nowTop }}>
                <div className="h-px bg-red-500"></div>
              </div>
            )}
          </div>
          {/* background grid */}
          <div>
            {hours.map((h, i) => (
              <div key={h} className="border-t border-muted bg-background" style={{ height: hourHeight }}>
                {/* empty cell */}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* hour labels */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-[56px]">
        {hours.map((h) => (
          <div key={h} className="h-[96px] flex items-start justify-end pr-2 text-xs text-muted-foreground" style={{ height: hourHeight }}>
            <span className="-translate-y-2">{String(h).padStart(2, "0")}:00</span>
          </div>
        ))}
      </div>
    </div>
  )
}
