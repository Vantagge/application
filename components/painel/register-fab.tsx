"use client"
import { useRouter, useSearchParams } from "next/navigation"

export function RegisterFab() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const openDialog = () => {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set("registrar", "1")
    router.replace(`?${sp.toString()}`, { scroll: false })
  }

  return (
    <button
      onClick={openDialog}
      className="md:hidden fixed z-50 right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] h-14 w-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center justify-center"
      aria-label="Registrar Atendimento"
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
    </button>
  )
}
