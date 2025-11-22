"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import type { Appointment } from "@/lib/types/database"

export type UseScheduleOptions = {
  status?: "PENDING" | "COMPLETED" | "CANCELED"
}

export function useSchedule(date: Date, opts: UseScheduleOptions = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const status = opts.status ?? "PENDING"

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/appointments?status=${encodeURIComponent(status)}&date=${format(date, "yyyy-MM-dd")}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Erro ao carregar agenda")
      setAppointments(json.data || [])
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar agenda")
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format(date, "yyyy-MM-dd"), status])

  // Optimistic create
  async function createAppointment(payload: {
    clientId: string
    professionalId: string
    serviceIds: string[]
    startAt: string
  }) {
    // optimistic item (id will be replaced after server returns)
    const optimistic: Appointment = {
      id: `tmp_${Math.random().toString(36).slice(2)}`,
      establishment_id: "",
      client_id: payload.clientId,
      professional_id: payload.professionalId,
      service_ids: payload.serviceIds,
      start_at: payload.startAt,
      end_at: payload.startAt,
      status: "PENDING",
      google_event_id: null,
      created_at: new Date().toISOString(),
    }
    setAppointments((prev) => [...prev, optimistic])
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Erro ao criar agendamento")
      setAppointments((prev) => prev.map((a) => (a.id === optimistic.id ? json.data : a)))
      return json.data as Appointment
    } catch (e) {
      // rollback
      setAppointments((prev) => prev.filter((a) => a.id !== optimistic.id))
      throw e
    }
  }

  async function patchAppointment(id: string, updates: Partial<Pick<Appointment, "status" | "start_at" | "professional_id" | "service_ids">> & { durationMinutes?: number }) {
    // optimistic update
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } as Appointment : a)))
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "Erro ao atualizar agendamento")
      // reload to keep server truth (end_at may change)
      await load()
      return true
    } catch (e) {
      // reload to rollback
      await load()
      throw e
    }
  }

  return {
    appointments,
    loading,
    error,
    reload: load,
    createAppointment,
    patchAppointment,
  }
}
