"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Professional, Service } from "@/lib/types/database"
import { LocalLoadingOverlay, LoadingOverlay } from "@/components/ui/loading-overlay"
import { translations } from "@/lib/translations/pt-br"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import * as React from "react"

type Tx = any

type FiltersState = {
  from: string
  to: string
  type: string
  professionalId: string
  status: string
  q: string
  serviceId: string
  minFinal: string
  maxFinal: string
}

function FiltersAccordion({
  filters,
  setFilters,
  professionals,
  services,
  clearFilters,
}: {
  filters: FiltersState
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>
  professionals: Professional[]
  services: Service[]
  clearFilters: () => void
}) {
  const activeCount = React.useMemo(() => {
    return Object.values(filters).filter((v) => String(v || '').trim() !== '').length
  }, [filters])

  return (
    <Accordion type="single" collapsible defaultValue="filters" className="mb-4">
      <AccordionItem value="filters">
        <AccordionTrigger className="px-2">
          <div className="flex w-full items-center justify-between">
            <span className="font-medium">Filtros</span>
            <span className="text-xs text-muted-foreground">{activeCount > 0 ? `${activeCount} ativos` : 'Nenhum filtro'}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="space-y-1">
              <Label>Profissional</Label>
              <Select value={filters.professionalId || undefined} onValueChange={(v) => setFilters((f) => ({ ...f, professionalId: v === 'all' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Cliente</Label>
              <Input placeholder="Nome ou WhatsApp" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Serviço</Label>
              <Select value={filters.serviceId || undefined} onValueChange={(v) => setFilters((f) => ({ ...f, serviceId: v === 'all' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Valor Mínimo</Label>
              <Input type="number" step="0.01" value={filters.minFinal} onChange={(e) => setFilters((f) => ({ ...f, minFinal: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Valor Máximo</Label>
              <Input type="number" step="0.01" value={filters.maxFinal} onChange={(e) => setFilters((f) => ({ ...f, maxFinal: e.target.value }))} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function TransactionsPage({ professionals, services }: { professionals: Professional[]; services: Service[] }) {
  const [tab, setTab] = useState<"past" | "future">("past")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    type: "",
    professionalId: "",
    status: "",
    q: "",
    serviceId: "",
    minFinal: "",
    maxFinal: "",
  })

  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [rows, setRows] = useState<Tx[]>([])

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.from) params.set("from", filters.from)
    if (filters.to) params.set("to", filters.to)
    if (filters.type) params.set("type", filters.type)
    if (filters.professionalId) params.set("professionalId", filters.professionalId)
    if (filters.status) params.set("status", filters.status)
    if (filters.q) params.set("q", filters.q)
    if (filters.serviceId) params.set("serviceId", filters.serviceId)
    if (filters.minFinal) params.set("minFinal", filters.minFinal)
    if (filters.maxFinal) params.set("maxFinal", filters.maxFinal)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    params.set("future", tab === "future" ? "1" : "0")
    return params.toString()
  }, [filters, page, pageSize, tab])

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
      } catch (e) {
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

  // Reset page when tab or filters change (except page itself)
  useEffect(() => {
    setPage(1)
  }, [tab, filters.from, filters.to, filters.type, filters.professionalId, filters.status, filters.q, filters.serviceId, filters.minFinal, filters.maxFinal])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const clearFilters = () => {
    setFilters({ from: "", to: "", type: "", professionalId: "", status: "", q: "", serviceId: "", minFinal: "", maxFinal: "" })
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/transactions/export?${query.replace(/(&|^)page=[^&]*/g, "").replace(/(&|^)pageSize=[^&]*/g, "")}`)
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
    <div className="min-h-screen px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{translations.transactionHistory?.title || "Transações"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearFilters}>{translations.common?.filter || "Filtrar"}: {translations.common?.clear || "Limpar"}</Button>
          <Button onClick={handleExport} disabled={exporting}>{exporting ? (translations.common?.loading || "Carregando...") : (translations.transactionHistory?.export || "Exportar")}</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="past">{translations.transactionHistory?.tabs?.past || "Realizadas"}</TabsTrigger>
          <TabsTrigger value="future">{translations.transactionHistory?.tabs?.future || "Futuras"}</TabsTrigger>
        </TabsList>
        {/* Filtros em Accordion para melhor usabilidade */}
        <FiltersAccordion
          filters={filters}
          setFilters={setFilters}
          professionals={professionals}
          services={services}
          clearFilters={clearFilters}
        />

        <TabsContent value="past">
          <Card className="relative">
            <CardHeader>
              <CardTitle>{translations.transactionHistory?.tabs?.past || "Realizadas"}</CardTitle>
            </CardHeader>
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
                    <div className="py-8 text-center text-sm text-muted-foreground">{translations.transactionHistory?.empty || "Nenhuma transação"}</div>
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
              {/* Mobile/Tablet cards */}
              <div className="lg:hidden grid gap-3">
                {rows.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">{translations.transactionHistory?.empty || "Nenhuma transação"}</div>
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
          <Card className="relative">
            <CardHeader>
              <CardTitle>{translations.transactionHistory?.tabs?.future || "Futuras"}</CardTitle>
            </CardHeader>
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
                    <div className="py-8 text-center text-sm text-muted-foreground">{translations.transactionHistory?.empty || "Nenhum agendamento"}</div>
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
              {/* Mobile/Tablet cards */}
              <div className="lg:hidden grid gap-3">
                {rows.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">{translations.transactionHistory?.empty || "Nenhum agendamento"}</div>
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

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total > 0 ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} de ${total}` : "0 de 0"}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{translations.common.previous}</Button>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{translations.common.next}</Button>
        </div>
      </div>

      <LoadingOverlay show={exporting} label="Gerando arquivo..." fullscreen />
    </div>
  )
}
