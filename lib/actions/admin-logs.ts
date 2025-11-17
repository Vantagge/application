"use server"

import { createClient } from "@/lib/supabase/server"

type LogFilters = {
  from?: string
  to?: string
  action?: string
  actor?: string // user email or name ilike
  entityType?: string
}

export type Paged<T> = { data: T[]; total: number }

async function assertAdmin(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (userData?.role !== "admin") throw new Error("Não autorizado")
}

export async function listEstablishmentLogs(
  establishmentId: string,
  { filters = {}, page = 1, pageSize = 20 }: { filters?: LogFilters; page?: number; pageSize?: number },
): Promise<Paged<any>> {
  const supabase = await createClient()
  await assertAdmin(supabase)

  let q = supabase
    .from("establishment_logs")
    .select(
      `id, establishment_id, actor_user_id, action, entity_type, entity_id, metadata, created_at,
       actor:users!left(id, name, email)`,
      { count: "exact" },
    )
    .eq("establishment_id", establishmentId)

  if (filters.action) q = q.eq("action", filters.action)
  if (filters.entityType) q = q.eq("entity_type", filters.entityType)
  if (filters.from) q = q.gte("created_at", filters.from)
  if (filters.to) q = q.lte("created_at", filters.to)
  if (filters.actor) {
    const ilike = `%${filters.actor}%`
    // search on joined users
    q = (q as any).or(`users.name.ilike.${ilike},users.email.ilike.${ilike}`, { foreignTable: "users" })
  }

  q = q.order("created_at", { ascending: false })

  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1
  const { data, error, count } = (await (q as any).range(fromIdx, toIdx)) as any
  if (error) throw error
  return { data: data || [], total: count || 0 }
}

export async function exportEstablishmentLogsCSV(establishmentId: string, filters: LogFilters) {
  const { data } = await listEstablishmentLogs(establishmentId, { filters, page: 1, pageSize: 5000 })
  const headers = ["ID", "Criado em", "Ação", "Entidade", "ID Entidade", "Ator (nome)", "Ator (email)", "Metadata"]
  const out: string[] = []
  out.push(headers.join(";"))
  for (const r of data) {
    const row = [
      r.id,
      r.created_at,
      r.action || "",
      r.entity_type || "",
      r.entity_id || "",
      r.actor?.name || "",
      r.actor?.email || "",
      r.metadata ? JSON.stringify(r.metadata) : "",
    ]
    const escaped = row.map((v) => {
      const s = String(v ?? "")
      if (s.includes(";") || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"'
      return s
    })
    out.push(escaped.join(";"))
  }
  return out.join("\n")
}
