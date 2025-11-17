"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LocalLoadingOverlay, LoadingOverlay } from "@/components/ui/loading-overlay"

export function EstablishmentTransactions({ establishmentId }: { establishmentId: string }) {
  type Tx = any
  const [tab, setTab] = useState<"past" | "future">("past")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [filters, setFilters] = useState({ from: "", to: "", type: "", professionalId: "", status: "", q: "", serviceId: "" })
  const [rows, setRows] = useState<Tx[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.from) p.set("from", filters.from)
    if (filters.to) p.set("to", filters.to)
    if (filters.type) p.set("type", filters.type)
    if (filters.professionalId) p.set("professionalId", filters.professionalId)
    if (filters.status) p.set("status", filters.status)
    if (filters.q) p.set("q", filters.q)
    if (filters.serviceId) p.set("serviceId", filters.serviceId)
    p.set("page", String(page))
    p.set("pageSize", String(pageSize))
    p.set("future", tab === "future" ? "1" : "0")
    p.set("establishmentId", establishmentId)
    return p.toString()
  }, [filters, page, pageSize, tab, establishmentId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/transactions/history?${query}`)
        const json = await res.json()
        if (!cancelled) {
          setRows(json.data || [])
          setTotal(json.total || 0)
        }
      } catch {
        if (!cancelled) {
          setRows([])
          setTotal(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [tab, filters.from, filters.to, filters.type, filters.professionalId, filters.status, filters.q, filters.serviceId])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleExport = async () => {
    setExporting(true)
    try {
      const qs = query.replace(/(&|^)page=[^&]*/g, "").replace(/(&|^)pageSize=[^&]*/g, "")
      const res = await fetch(`/api/transactions/export?${qs}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = tab === "future" ? "transacoes_futuras.csv" : "transacoes_realizadas.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">Total: {total}</div>
        <Button onClick={handleExport} size="sm" disabled={exporting}>{exporting ? "Gerando..." : "Exportar"}</Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-3">
          <TabsTrigger value="past">Realizadas</TabsTrigger>
          <TabsTrigger value="future">Futuras</TabsTrigger>
        </TabsList>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>De</Label>
            <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Até</Label>
            <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v === 'all' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Compra">Compra</SelectItem>
                <SelectItem value="Ganho">Ganho</SelectItem>
                <SelectItem value="Resgate">Resgate</SelectItem>
                <SelectItem value="Ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="past">
          <Card className="relative mt-3">
            <CardContent>
              <div className="hidden lg:block">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 py-1">
                  <div className="col-span-2">Data</div>
                  <div className="col-span-3">Cliente</div>
                  <div className="col-span-2">Profissional</div>
                  <div className="col-span-1">Tipo</div>
                  <div className="col-span-2">Valores</div>
                  <div className="col-span-1">Pontos</div>
                  <div className="col-span-1">Status</div>
                </div>
                <div className="divide-y">
                  {rows.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação</div>
                  ) : (
                    rows.map((t) => (
                      <div key={t.id} className="grid grid-cols-12 gap-2 px-2 py-3 text-sm">
                        <div className="col-span-2">{new Date(t.created_at).toLocaleString()}</div>
                        <div className="col-span-3 truncate">{t.customers?.name} <span className="text-muted-foreground">{t.customers?.whatsapp}</span></div>
                        <div className="col-span-2 truncate">{t.professionals?.name || "-"}</div>
                        <div className="col-span-1">{t.type}</div>
                        <div className="col-span-2">
                          <div className="flex flex-col">
                            <span>Subtotal: R$ {Number(t.monetary_value || 0).toFixed(2)}</span>
                            {t.discount_amount ? <span>Desc.: R$ {Number(t.discount_amount).toFixed(2)}</span> : null}
                            <span className="font-semibold">Total: R$ {Number(t.final_value || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="col-span-1">{Number(t.points_moved || 0)}</div>
                        <div className="col-span-1 capitalize">{t.status || "completed"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="lg:hidden grid gap-3">
                {rows.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma transação</div>
                ) : (
                  rows.map((t) => (
                    <div key={t.id} className="rounded border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{t.customers?.name}</span>
                        <span className="text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{t.professionals?.name || "-"}</div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span>{t.type}</span>
                        <span className="font-semibold">R$ {Number(t.final_value || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <LocalLoadingOverlay show={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="future">
          <Card className="relative mt-3">
            <CardContent>
              <div className="hidden lg:block">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 py-1">
                  <div className="col-span-2">Agendado</div>
                  <div className="col-span-3">Cliente</div>
                  <div className="col-span-2">Profissional</div>
                  <div className="col-span-1">Tipo</div>
                  <div className="col-span-2">Valores</div>
                  <div className="col-span-1">Pontos</div>
                  <div className="col-span-1">Status</div>
                </div>
                <div className="divide-y">
                  {rows.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Nenhum agendamento</div>
                  ) : (
                    rows.map((t) => (
                      <div key={t.id} className="grid grid-cols-12 gap-2 px-2 py-3 text-sm">
                        <div className="col-span-2">{t.scheduled_at ? new Date(t.scheduled_at).toLocaleString() : "-"}</div>
                        <div className="col-span-3 truncate">{t.customers?.name} <span className="text-muted-foreground">{t.customers?.whatsapp}</span></div>
                        <div className="col-span-2 truncate">{t.professionals?.name || "-"}</div>
                        <div className="col-span-1">{t.type}</div>
                        <div className="col-span-2">
                          <div className="flex flex-col">
                            <span>Subtotal: R$ {Number(t.monetary_value || 0).toFixed(2)}</span>
                            {t.discount_amount ? <span>Desc.: R$ {Number(t.discount_amount).toFixed(2)}</span> : null}
                            <span className="font-semibold">Total: R$ {Number(t.final_value || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="col-span-1">{Number(t.points_moved || 0)}</div>
                        <div className="col-span-1 capitalize">{t.status || "pending"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="lg:hidden grid gap-3">
                {rows.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Nenhum agendamento</div>
                ) : (
                  rows.map((t) => (
                    <div key={t.id} className="rounded border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{t.customers?.name}</span>
                        <span className="text-muted-foreground">{t.scheduled_at ? new Date(t.scheduled_at).toLocaleDateString() : "-"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{t.professionals?.name || "-"}</div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span>{t.type}</span>
                        <span className="font-semibold">R$ {Number(t.final_value || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <LocalLoadingOverlay show={loading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{total > 0 ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} de ${total}` : "0 de 0"}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Próximo</Button>
        </div>
      </div>

      <LoadingOverlay show={exporting} label="Gerando arquivo..." fullscreen />
    </div>
  )
}
