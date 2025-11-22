import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const MAX_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED = new Set(["image/png", "image/jpeg"]) // jpg/jpeg

function extFromType(type: string) {
  if (type === "image/png") return "png"
  if (type === "image/jpeg") return "jpg"
  return "bin"
}

function extractStoragePathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null
  // Example: https://<project>.supabase.co/storage/v1/object/public/establishment-assets/logos/abc.png
  const marker = "/storage/v1/object/public/"
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const rest = url.substring(idx + marker.length) // establishment-assets/logos/abc.png
  const slashIdx = rest.indexOf("/")
  if (slashIdx === -1) return null
  // return the key after bucket name: logos/abc.png
  return rest.substring(slashIdx + 1)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  // Resolve establishment id
  const { data: userData, error: userErr } = await supabase
    .from("users")
    .select("establishment_id")
    .eq("id", user.id)
    .single()
  if (userErr || !userData?.establishment_id)
    return Response.json({ error: "Estabelecimento não encontrado" }, { status: 400 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return Response.json({ error: "Arquivo não enviado" }, { status: 400 })

  const type = file.type
  if (!ALLOWED.has(type)) {
    return Response.json({ error: "Formato inválido. Use PNG ou JPEG." }, { status: 400 })
  }
  const size = file.size
  if (size > MAX_BYTES) {
    return Response.json({ error: "Arquivo muito grande (máx. 2MB)" }, { status: 400 })
  }

  // Read old logo url before updating
  const { data: estData } = await supabase
    .from("establishments")
    .select("logo_url")
    .eq("id", userData.establishment_id)
    .single()

  const ext = extFromType(type)
  const filename = `logos/${userData.establishment_id}-${Date.now()}.${ext}`

  // Upload to storage (public bucket)
  const bucket = supabase.storage.from("establishment-assets")
  const { error: uploadErr } = await bucket.upload(filename, file, {
    upsert: true,
    contentType: type,
  })
  if (uploadErr) {
    return Response.json({ error: uploadErr.message || "Falha no upload" }, { status: 400 })
  }

  // Get public URL
  const { data: pub } = bucket.getPublicUrl(filename)
  const publicUrl = pub.publicUrl

  // Update DB
  const { error: updErr } = await supabase
    .from("establishments")
    .update({ logo_url: publicUrl })
    .eq("id", userData.establishment_id)
  if (updErr) {
    return Response.json({ error: updErr.message || "Falha ao salvar URL" }, { status: 400 })
  }

  // Best-effort delete old file to save space
  const oldKey = extractStoragePathFromPublicUrl(estData?.logo_url || null)
  if (oldKey && oldKey !== filename) {
    try {
      await bucket.remove([oldKey])
    } catch {}
  }

  // Revalidate UI
  revalidatePath("/painel")
  revalidatePath("/painel/configuracoes")

  return Response.json({ url: publicUrl })
}
