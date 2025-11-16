"use client"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export function LoadingOverlay({
  show,
  label = "Carregando...",
  className,
  fullscreen = false,
}: {
  show: boolean
  label?: string
  className?: string
  fullscreen?: boolean
}) {
  if (!show) return null
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[60] flex items-center justify-center",
        fullscreen ? "" : "",
        className,
      )}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-3 rounded-lg bg-background/80 px-6 py-4 shadow-xl backdrop-blur supports-[backdrop-filter]:backdrop-blur">
        <Spinner className="h-6 w-6" />
        {label && <span className="text-sm text-foreground/90">{label}</span>}
      </div>
    </div>
  )
}

export function LocalLoadingOverlay({ show, label, className }: { show: boolean; label?: string; className?: string }) {
  if (!show) return null
  return (
    <div className={cn("absolute inset-0 z-20 flex items-center justify-center", className)}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex items-center gap-2 rounded bg-background/90 px-3 py-2 shadow">
        <Spinner className="h-4 w-4" />
        {label && <span className="text-xs text-foreground/90">{label}</span>}
      </div>
    </div>
  )
}
