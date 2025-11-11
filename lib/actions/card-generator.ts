"use server"

import { createClient } from "@/lib/supabase/server"
import sharp from "sharp"
import { createCanvas, loadImage } from "canvas"
import { ensureEstablishmentAssetsBucket } from "@/lib/storage/setup"

export async function generateLoyaltyCardImage(params: {
  establishmentName: string
  logoUrl?: string
  currentStamps: number
  totalStamps: number
  primaryColor?: string
  customerId: string
  establishmentId: string
}) {
  const width = 800
  const height = 500
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, params.primaryColor || "#8B5CF6")
  gradient.addColorStop(1, "#6D28D9")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Header container
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
  // @ts-ignore - roundRect supported in node-canvas recent versions
  ctx.roundRect(40, 40, width - 80, 80, 12)
  ctx.fill()

  // Logo
  if (params.logoUrl) {
    try {
      const logo = await loadImage(params.logoUrl)
      ctx.drawImage(logo, 60, 50, 60, 60)
    } catch (error) {
      console.warn("Logo não carregado:", error)
    }
  }

  // Establishment name
  ctx.fillStyle = "#1F2937"
  ctx.font = "bold 32px Inter, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(params.establishmentName, width / 2, 80)

  // Stamps grid 2x5
  const startX = 140
  const startY = 180
  const stampSize = 80
  const spacing = 20

  for (let i = 0; i < params.totalStamps; i++) {
    const row = Math.floor(i / 5)
    const col = i % 5
    const x = startX + col * (stampSize + spacing)
    const y = startY + row * (stampSize + spacing)

    if (i < params.currentStamps) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      ctx.strokeStyle = "#10B981"
      ctx.lineWidth = 4
      // @ts-ignore
      ctx.roundRect(x, y, stampSize, stampSize, 8)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = "#10B981"
      ctx.font = "bold 48px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("✓", x + stampSize / 2, y + stampSize / 2)
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
      ctx.lineWidth = 3
      ctx.setLineDash([8, 4])
      // @ts-ignore
      ctx.roundRect(x, y, stampSize, stampSize, 8)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // Footer progress
  ctx.fillStyle = "white"
  ctx.font = "bold 20px Inter, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  ctx.fillText(`${params.currentStamps} de ${params.totalStamps} carimbos`, width / 2, height - 70)

  // Convert to PNG buffer
  let buffer = canvas.toBuffer("image/png")

  // If larger than 1MB, compress a bit with sharp
  if (buffer.byteLength > 1_000_000) {
    buffer = await sharp(buffer).png({ quality: 90 }).toBuffer()
  }

  const fileName = `loyalty-cards/${params.establishmentId}/${params.customerId}-${Date.now()}.png`

  const supabase = await createClient()
  // Ensure bucket exists and is public before uploading
  try {
    await ensureEstablishmentAssetsBucket()
  } catch (e) {
    console.warn("Não foi possível validar/criar o bucket establishment-assets:", e)
  }

  const { error: uploadError } = await supabase.storage
    .from("establishment-assets")
    .upload(fileName, buffer, {
      contentType: "image/png",
      upsert: true,
    })

  if (uploadError) throw uploadError

  const { data: publicUrl } = supabase.storage.from("establishment-assets").getPublicUrl(fileName)

  await supabase
    .from("customer_loyalty")
    .update({ last_card_image_url: publicUrl.publicUrl })
    .eq("customer_id", params.customerId)
    .eq("establishment_id", params.establishmentId)

  return publicUrl.publicUrl
}
