"use client"

import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-lg bg-background/90 px-6 py-4 shadow">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    </div>
  )
}
