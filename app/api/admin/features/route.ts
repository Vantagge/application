import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { listResolvedFeatures } from "@/lib/features"

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  return userData?.role === "admin"
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  try {
    if (!(await isAdmin())) return Response.json({ error: "Não autorizado" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const establishmentId = searchParams.get("establishmentId")
    if (!establishmentId) return Response.json({ error: "establishmentId obrigatório" }, { status: 400 })

    const features = await listResolvedFeatures(establishmentId)
    return Response.json({ data: features })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro ao listar features" }, { status: 400 })
  }
}
