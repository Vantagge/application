import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  return userData?.role === "admin"
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  try {
    if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 403 })

    const body = await req.json()
    const { establishmentId, featureKey, isEnabled } = body || {}
    if (!establishmentId || !featureKey || typeof isEnabled !== "boolean") {
      return Response.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    const { error } = await supabase
      .from("establishment_features")
      .upsert({ establishment_id: establishmentId, feature_key: featureKey, is_enabled: isEnabled }, { onConflict: "establishment_id,feature_key" })

    if (error) return Response.json({ error: error.message }, { status: 400 })

    return Response.json({ ok: true })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro ao atualizar feature" }, { status: 400 })
  }
}
