"use client"

import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isToday, startOfMonth, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"

export function DayStrip(props: {
  baseDate: Date
  selectedDate: Date
  onSelect: (d: Date) => void
  mode: "day" | "week"
  onModeChange?: (m: "day" | "week") => void
}) {
  const { baseDate, selectedDate, onSelect, mode, onModeChange } = props
  const monthLabel = format(selectedDate, "MMMM yyyy", { locale: ptBR })

  const start = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  return (
    <div className="sticky top-0 z-20 bg-background border-b">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="text-base font-semibold capitalize">{monthLabel}</div>
        <div className="flex items-center gap-2">
          <button className="text-sm px-2 py-1 rounded-md border" onClick={() => onSelect(new Date())}>Hoje</button>
          <div className="hidden md:flex gap-1 text-sm bg-muted rounded-md p-1">
            <button className={`px-2 py-1 rounded ${mode === 'day' ? 'bg-background shadow-sm' : ''}`} onClick={() => onModeChange?.('day')}>Dia</button>
            <button className={`px-2 py-1 rounded ${mode === 'week' ? 'bg-background shadow-sm' : ''}`} onClick={() => onModeChange?.('week')}>Semana</button>
          </div>
        </div>
      </div>
      <div className="flex overflow-x-auto gap-2 px-4 pb-3">
        {days.map((d) => {
          const selected = isSameDay(d, selectedDate)
          const today = isToday(d)
          return (
            <button key={d.toISOString()} className={`flex-shrink-0 w-16 text-center rounded-md border px-2 py-2 ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'} ${today && !selected ? 'border-primary/50' : ''}`} onClick={() => onSelect(d)}>
              <div className="text-[10px] font-medium uppercase text-muted-foreground">{format(d, 'EEE', { locale: ptBR })}</div>
              <div className="text-base font-semibold">{format(d, 'd')}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
