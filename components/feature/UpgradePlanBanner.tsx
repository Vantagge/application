"use client"
import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function UpgradePlanBanner({ message = "Recurso disponível em planos superiores.", onClick }: { message?: string; onClick?: () => void }) {
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-900">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="font-semibold">Recurso indisponível</AlertTitle>
          <AlertDescription className="mt-1 text-sm">
            {message}
          </AlertDescription>
        </div>
        <Button size="sm" className="bg-[#25D366] hover:bg-[#20BD5A]" onClick={onClick}>
          Ver planos
        </Button>
      </div>
    </Alert>
  )
}
