"use server"

import { createClient } from "@/lib/supabase/server"

export type CommissionFilter = {
  from: string // ISO date (inclusive)
  to: string   // ISO date (exclusive or end of day)
  professionalId?: string
}

export async function getCommissionReport(filter: CommissionFilter) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()
  if (!userData?.establishment_id) return []

  // Get transaction items joined with transactions and professionals
  // Filter by date range on transactions.created_at and establishment_id
  let query = supabase
    .from("transaction_items")
    .select(
      `
      subtotal,
      professionals ( id, name, commission_percentage ),
      transactions:transactions!inner (
        id,
        created_at,
        establishment_id
      )
    `,
    )
    .gte("transactions.created_at", filter.from)
    .lte("transactions.created_at", filter.to)
    .eq("transactions.establishment_id", userData.establishment_id)

  if (filter.professionalId) {
    query = query.eq("professional_id", filter.professionalId)
  }

  const { data, error } = await query
  if (error) throw error

  type Row = {
    subtotal: number
    professionals: { id: string; name: string; commission_percentage: number | null } | null
    transactions: { id: string; created_at: string; establishment_id: string }
  }

  const byProf = new Map<string, { professionalId: string; name: string; commissionPct: number; totalSales: number; commissionDue: number }>()

  for (const r of (data as any as Row[])) {
    const profId = r.professionals?.id || "sem_profissional"
    const name = r.professionals?.name || "Sem Profissional"
    const pct = r.professionals?.commission_percentage != null ? Number(r.professionals.commission_percentage) : 0
    const subtotal = Number(r.subtotal || 0)

    const current = byProf.get(profId) || { professionalId: profId, name, commissionPct: pct, totalSales: 0, commissionDue: 0 }
    current.totalSales += subtotal
    current.commissionPct = pct
    current.commissionDue = current.totalSales * (pct / 100)
    byProf.set(profId, current)
  }

  return Array.from(byProf.values())
}
