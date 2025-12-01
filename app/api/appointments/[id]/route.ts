import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasFeature } from "@/lib/features"
import { z } from "zod"

const patchSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELED"]).optional(),
  start_at: z.string().datetime().optional(),
  professional_id: z.string().uuid().optional(),
  service_ids: z.array(z.string().uuid()).min(1).optional(),
})

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  try {
    const { id } = await context.params
    if (!id) return Response.json({ error: "Dados inválidos" }, { status: 400 })
    const body = await req.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 })
    }
    const { status, start_at, professional_id, service_ids } = parsed.data

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

    const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()
    if (!userData?.establishment_id) return Response.json({ error: "Estabelecimento não encontrado" }, { status: 400 })

    // Feature guard: scheduling module must be enabled
    const schedulingEnabled = await hasFeature(userData.establishment_id, "module_scheduling")
    if (!schedulingEnabled) {
      return Response.json({ error: "Funcionalidade desativada: Agendamento" }, { status: 403 })
    }

    // Load current appointment
    const { data: current, error: currErr } = await supabase
      .from("appointments")
      .select("id, establishment_id, professional_id, service_ids, start_at, end_at, status")
      .eq("id", id)
      .eq("establishment_id", userData.establishment_id)
      .single()
    if (currErr || !current) return Response.json({ error: currErr?.message || "Agendamento não encontrado" }, { status: 404 })

    let updates: any = {}
    if (status) updates.status = status
    if (typeof professional_id === "string") updates.professional_id = professional_id

    let newStart = start_at || current.start_at
    let newEnd = current.end_at

    // If service_ids provided, recalc end based on services duration
    if (Array.isArray(service_ids)) {
      updates.service_ids = service_ids
      const { data: services, error: svcErr } = await supabase
        .from("services")
        .select("id, duration_minutes")
        .in("id", service_ids)
        .eq("establishment_id", userData.establishment_id)
      if (svcErr) return Response.json({ error: svcErr.message }, { status: 400 })
      if (!services || services.length !== service_ids.length) {
        return Response.json({ error: "Serviços inválidos" }, { status: 400 })
      }
      const totalMinutes = services.reduce((sum: number, s: any) => sum + Number(s.duration_minutes || 0), 0)
      if (!totalMinutes || totalMinutes <= 0) return Response.json({ error: "Duração inválida" }, { status: 400 })
      const startDate = new Date(newStart)
      const endDate = new Date(startDate)
      endDate.setMinutes(endDate.getMinutes() + totalMinutes)
      newEnd = endDate.toISOString()
    } else if (start_at) {
      // Keep the same duration
      const durationMs = new Date(current.end_at).getTime() - new Date(current.start_at).getTime()
      const startDate = new Date(newStart)
      const endDate = new Date(startDate.getTime() + durationMs)
      newEnd = endDate.toISOString()
    }

    if (start_at) updates.start_at = newStart
    if (newEnd !== current.end_at) updates.end_at = newEnd

    // Conflict check if time or professional changed and status not canceled
    const checkProfessional = updates.professional_id || current.professional_id
    if ((updates.start_at || updates.end_at || updates.professional_id) && (updates.status ?? current.status) !== "CANCELED") {
      const { data: conflicts, error: cErr } = await supabase
        .from("appointments")
        .select("id, start_at, end_at")
        .eq("establishment_id", userData.establishment_id)
        .eq("professional_id", checkProfessional)
        .neq("status", "CANCELED")
        .neq("id", current.id)
        .lt("start_at", updates.end_at || newEnd)
        .gt("end_at", updates.start_at || newStart)
      if (cErr) return Response.json({ error: cErr.message }, { status: 400 })
      if (conflicts && conflicts.length > 0) return Response.json({ error: "Conflito de horário com outro agendamento" }, { status: 409 })
    }

    if (Object.keys(updates).length === 0) return Response.json({ ok: true }, { status: 200 })

    const { error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .eq("establishment_id", userData.establishment_id)

    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro ao atualizar agendamento" }, { status: 400 })
  }
}
