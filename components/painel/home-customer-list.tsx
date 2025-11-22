"use client"
import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export type SimpleCustomer = { id: string; name: string; whatsapp?: string | null }

export default function HomeCustomerList({ customers }: { customers: SimpleCustomer[] }) {
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return customers
    return customers.filter((c) =>
      [c.name, c.whatsapp || ""].some((v) => (v || "").toLowerCase().includes(term)),
    )
  }, [q, customers])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="divide-y rounded-md border">
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              href={`/painel/clientes/${c.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{c.name}</p>
                {c.whatsapp && (
                  <p className="text-sm text-muted-foreground truncate">{c.whatsapp}</p>
                )}
              </div>
              <span className="text-primary text-sm font-medium">Ver perfil</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
