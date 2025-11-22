import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

function addMinutes(dateIso: string, minutes: number) {
  const d = new Date(dateIso)
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString()
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  try {
    const body = await req.json()
    const {
      clientId,
      professionalId,
      serviceIds,
      startAt,
    }: { clientId: string; professionalId: string; serviceIds: string[]; startAt: string } = body

    if (!clientId || !professionalId || !Array.isArray(serviceIds) || serviceIds.length === 0 || !startAt) {
      return Response.json({ error: "Dados inválidos" }, { status: 400 })
    }

    // Auth and establishment
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

    const { data: userData, error: userErr } = await supabase
      .from("users")
      .select("establishment_id")
      .eq("id", user.id)
      .single()
    if (userErr || !userData?.establishment_id) return Response.json({ error: "Estabelecimento não encontrado" }, { status: 400 })

    // Fetch services to compute total duration
    const { data: services, error: svcErr } = await supabase
      .from("services")
      .select("id, duration_minutes")
      .in("id", serviceIds)
      .eq("establishment_id", userData.establishment_id)
    if (svcErr) return Response.json({ error: svcErr.message }, { status: 400 })
    if (!services || services.length !== serviceIds.length) {
      return Response.json({ error: "Serviços inválidos" }, { status: 400 })
    }

    const totalMinutes = services.reduce((sum: number, s: any) => sum + Number(s.duration_minutes || 0), 0)
    if (!totalMinutes || totalMinutes <= 0) {
      return Response.json({ error: "Duração dos serviços inválida" }, { status: 400 })
    }
    const endAt = addMinutes(startAt, totalMinutes)

    // Conflict check: overlapping for professional within same establishment
    const { data: conflicts, error: cErr } = await supabase
      .from("appointments")
      .select("id, start_at, end_at, status")
      .eq("professional_id", professionalId)
      .eq("establishment_id", userData.establishment_id)
      .neq("status", "CANCELED")
      .lt("start_at", endAt)
      .gt("end_at", startAt)

    if (cErr) return Response.json({ error: cErr.message }, { status: 400 })
    if (conflicts && conflicts.length > 0) {
      return Response.json({ error: "Conflito de horário com outro agendamento" }, { status: 409 })
    }

    const payload = {
      establishment_id: userData.establishment_id,
      client_id: clientId,
      professional_id: professionalId,
      service_ids: serviceIds,
      start_at: startAt,
      end_at: endAt,
      status: "PENDING" as const,
    }

    const { data, error } = await supabase.from("appointments").insert(payload).select("*").single()
    if (error) return Response.json({ error: error.message }, { status: 400 })

    return Response.json({ data }, { status: 201 })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro ao criar agendamento" }, { status: 400 })
  }
}

// Optional: GET can list with filters, including today pending via query params
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  try {
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get("scope") // e.g., "today"
    const status = searchParams.get("status") || "PENDING"
    const date = searchParams.get("date") // YYYY-MM-DD

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

    const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()
    if (!userData?.establishment_id) return Response.json({ error: "Estabelecimento não encontrado" }, { status: 400 })

    let from = new Date()
    let to = new Date()
    if (date) {
      const d = new Date(date + "T00:00:00")
      from = new Date(d)
      to = new Date(d)
      from.setHours(0, 0, 0, 0)
      to.setHours(23, 59, 59, 999)
    } else if (scope === "today") {
      from.setHours(0, 0, 0, 0)
      to.setHours(23, 59, 59, 999)
    } else {
      // default to next 7 days
      to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

    const { data, error } = await supabase
      .from("appointments")
      .select("id, client_id, professional_id, service_ids, start_at, end_at, status, customers:client_id (id, name), professionals:professional_id (id, name)")
      .eq("establishment_id", userData.establishment_id)
      .eq("status", status)
      .gte("start_at", from.toISOString())
      .lte("start_at", to.toISOString())
      .order("start_at", { ascending: true })

    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ data }, { status: 200 })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro ao listar agendamentos" }, { status: 400 })
  }
}
