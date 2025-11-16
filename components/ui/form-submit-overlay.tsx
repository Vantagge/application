"use client"

import { useFormStatus } from "react-dom"
import { Spinner } from "@/components/ui/spinner"

export function SubmitButtonWithOverlay({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <>
      <button type="submit" disabled={pending} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90 disabled:opacity-50">
        {pending ? (
          <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Processando...</span>
        ) : (
          label
        )}
      </button>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-background/90 px-5 py-4 shadow">
            <span className="text-sm">Processando...</span>
          </div>
        </div>
      )}
    </>
  )
}
