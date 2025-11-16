"use client"

import { useEffect, useRef, useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Spinner } from "@/components/ui/spinner"

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
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (selected) return // stop searching when selected
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        if (!cancelled) setResults(json.data || [])
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [query, selected])

  const handleSelect = (c: { id: string; name: string }) => {
    setSelected(c)
    onSelect(c)
    setQuery(c.name)
    setResults([])
    // blur input to avoid hover changing the highlighted row
    inputRef.current?.blur()
  }

  const clearSelection = () => {
    setSelected(null)
    setQuery("")
  }

  return (
    <div className="relative rounded-md border">
      <div className="p-2">
        <Command className="rounded-md">
          <CommandInput ref={inputRef as any} placeholder={placeholder} onValueChange={setQuery} value={query} />
        </Command>
        {selected ? (
          <div className="flex items-center justify-between px-2 py-2 text-sm bg-neutral-50 rounded">
            <span className="font-medium truncate">Selecionado: {selected.name}</span>
            <button type="button" className="text-primary text-xs" onClick={clearSelection}>
              Trocar
            </button>
          </div>
        ) : (
          <Command className="rounded-md">
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                {results.map((r) => (
                  <CommandItem key={r.customer_id} onSelect={() => handleSelect({ id: r.customer_id, name: r.customers.name })}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{r.customers.name}</div>
                        <div className="text-xs text-neutral-500">{r.customers.whatsapp}</div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </div>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
          <Spinner className="h-5 w-5" />
        </div>
      )}
    </div>
  )
}
