"use client"

import { useEffect, useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"

export function CustomerSearchCombobox({
  onSelect,
  placeholder = "Buscar por nome ou telefone...",
}: {
  onSelect: (customer: { id: string; name: string }) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const data = await searchCustomers(query)
        if (!cancelled) setResults(data || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <Command className="rounded-md border">
      <CommandInput placeholder={placeholder} onValueChange={setQuery} />
      {loading && (
        <div className="p-2">
          <Spinner className="h-4 w-4" />
        </div>
      )}
      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
      <CommandGroup>
        {results.map((r) => (
          <CommandItem key={r.customer_id} onSelect={() => onSelect({ id: r.customer_id, name: r.customers.name })}>
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="font-medium">{r.customers.name}</div>
                <div className="text-xs text-neutral-500">{r.customers.whatsapp}</div>
              </div>
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  )
}
