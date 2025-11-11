"use client"

import { Card } from "@/components/ui/card"
import Image from "next/image"

export function LoyaltyCardViewer({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) return null

  return (
    <Card className="p-4">
      <div className="relative w-full aspect-[8/5] rounded-lg overflow-hidden">
        <Image src={imageUrl} alt="Cartão Fidelidade" fill className="object-cover" />
      </div>
    </Card>
  )
}
