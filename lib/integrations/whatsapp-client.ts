"use server"

import { createClient } from "@/lib/supabase/server"

export async function sendWhatsAppMessage(params: {
  to: string // Formato: +5511999999999
  body: string
  mediaUrl?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase
    .from("users")
    .select("establishment_id")
    .eq("id", user.id)
    .single()

  const { data: config } = await supabase
    .from("establishment_configs")
    .select("whatsapp_enabled, whatsapp_api_key, whatsapp_sender_number")
    .eq("establishment_id", userData?.establishment_id)
    .single()

  if (!config?.whatsapp_enabled) {
    console.log("[WhatsApp] Integração desabilitada")
    return { sent: false, reason: "disabled" as const }
  }

  const twilioPayload: any = {
    From: `whatsapp:${config.whatsapp_sender_number}`,
    To: `whatsapp:${params.to}`,
    Body: params.body,
    ...(params.mediaUrl && { MediaUrl: [params.mediaUrl] }),
  }

  console.log("[WhatsApp] Payload preparado:", twilioPayload)

  return { sent: false, reason: "not_implemented" as const, payload: twilioPayload }
}
