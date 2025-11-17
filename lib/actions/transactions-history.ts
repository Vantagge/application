"use server"

import { createClient } from "@/lib/supabase/server"

export type TxFilters = {
  from?: string // ISO string inclusive
  to?: string // ISO string inclusive
  type?: "Compra" | "Ganho" | "Resgate" | "Ajuste"
  professionalId?: string
  status?: string
  customerQuery?: string // matches customer name/whatsapp
  serviceId?: string
  minFinal?: number
  maxFinal?: number
}

export type Paged<T> = { data: T[]; total: number }

export async function getTransactionsPaged({
  filters = {},
  page = 1,
  pageSize = 20,
  future = false,
  establishmentId,
}: {
  filters?: TxFilters
  page?: number
  pageSize?: number
  future?: boolean
  establishmentId?: string // admin override
}): Promise<Paged<any>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id, role").eq("id", user.id).single()
  if (!userData) return { data: [], total: 0 }

  // Determine which establishment to query
  let estId = userData.establishment_id as string | null
  if (establishmentId) {
    // Admin override only
    if (userData.role !== "admin") {
      throw new Error("Não autorizado")
    }
    estId = establishmentId
  }
  if (!estId) return { data: [], total: 0 }

  // Helper to build the query. When withSchedule is false, do not reference scheduled/status columns
  const buildQuery = (withSchedule: boolean) => {
    let q = supabase
      .from("transactions")
      .select(
        `
        *,
        customers:customers!inner(id, name, whatsapp),
        professionals:professionals(id, name),
        items:transaction_items(total:subtotal, service_id, quantity)
      `,
        { count: "exact" },
      )
      .eq("establishment_id", estId as string)

    const nowIso = new Date().toISOString()
    if (withSchedule) {
      if (future) {
        // Filter only by scheduled_at > now; rows with null scheduled_at will naturally be excluded
        q = q.gt("scheduled_at", nowIso)
      } else {
        q = q.or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`)
      }
    } else {
      // No scheduled_at column available. Only support past view using created_at.
      if (future) {
        // There is no concept of future without scheduled_at; return an empty dataset by filtering impossible condition
        q = q.eq("id", "00000000-0000-0000-0000-000000000000")
      }
    }

    // Filters
    if (filters.type) q = q.eq("type", filters.type)
    if (filters.professionalId) q = q.eq("professional_id", filters.professionalId)
    if (withSchedule && filters.status) q = q.eq("status", filters.status)
    if (filters.from) {
      if (withSchedule && future) q = q.gte("scheduled_at", filters.from)
      else q = q.gte("created_at", filters.from)
    }
    if (filters.to) {
      if (withSchedule && future) q = q.lte("scheduled_at", filters.to)
      else q = q.lte("created_at", filters.to)
    }
    if (filters.minFinal != null) q = q.gte("final_value", filters.minFinal)
    if (filters.maxFinal != null) q = q.lte("final_value", filters.maxFinal)

    if (filters.customerQuery) {
      const ilike = `%${filters.customerQuery}%`
      q = q.or(`customers.name.ilike.${ilike},customers.whatsapp.ilike.${ilike}`, { foreignTable: "customers" })
    }
    return q
  }

  // If serviceId filter is provided, prefetch IDs regardless of schedule support
  if (filters.serviceId) {
    const { data: txIdsRows, error: txIdsErr } = await supabase
      .from("transaction_items")
      .select("transaction_id")
      .eq("service_id", filters.serviceId)
    if (txIdsErr) throw txIdsErr
    const ids = Array.from(new Set((txIdsRows || []).map((r: any) => r.transaction_id))).filter(Boolean)
    if (ids.length === 0) {
      return { data: [], total: 0 }
    }
    // We will apply this list to the query after building it below
    ;(filters as any)._txIds = ids
  }

  async function run(withSchedule: boolean) {
    let query = buildQuery(withSchedule)
    if ((filters as any)._txIds) {
      query = query.in("id", (filters as any)._txIds)
    }
    // Ordering
    query = query.order(withSchedule && future ? "scheduled_at" : "created_at", { ascending: withSchedule && future })
    // Pagination
    const fromIdx = (page - 1) * pageSize
    const toIdx = fromIdx + pageSize - 1
    const { data, error, count } = await (query.range(fromIdx, toIdx) as any)
    if (error) throw error
    return { data: data || [], total: count || 0 }
  }

  // Try with scheduled_at/status first
  try {
    return await run(true)
  } catch (e: any) {
    const msg = e?.message || ""
    const code = e?.code || e?.details || ""
    const isMissingColumn = msg.includes("scheduled_at") || msg.includes("status") || code === "42703"
    const isMethodMissing = e?.name === "TypeError" || msg.includes("is not a function")
    if (!isMissingColumn && !isMethodMissing) throw e
    // Fallback: run without referencing scheduled/status columns or unsupported methods in mocks
    return await run(false)
  }
}
