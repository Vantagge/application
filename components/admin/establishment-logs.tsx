"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LocalLoadingOverlay, LoadingOverlay } from "@/components/ui/loading-overlay"

export function EstablishmentLogs({ establishmentId }: { establishmentId: string }) {
  type Log = any
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [filters, setFilters] = useState({ from: "", to: "", action: "", actor: "", entityType: "" })
  const [rows, setRows] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.from) p.set("from", filters.from)
    if (filters.to) p.set("to", filters.to)
    if (filters.action) p.set("action", filters.action)
    if (filters.actor) p.set("actor", filters.actor)
    if (filters.entityType) p.set("entityType", filters.entityType)
    p.set("page", String(page))
    p.set("pageSize", String(pageSize))
    return p.toString()
  }, [filters, page, pageSize])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/establishments/${establishmentId}/logs?${query}`)
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
    return () => { cancelled = true }
  }, [query, establishmentId])

  useEffect(() => { setPage(1) }, [filters.from, filters.to, filters.action, filters.actor, filters.entityType])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleExport = async () => {
    setExporting(true)
    try {
      const qs = query.replace(/(&|^)page=[^&]*/g, "").replace(/(&|^)pageSize=[^&]*/g, "")
      const res = await fetch(`/api/admin/establishments/${establishmentId}/logs/export?${qs}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `logs_${establishmentId}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Logs de Atividade</CardTitle>
        <Button onClick={handleExport} size="sm" disabled={exporting}>{exporting ? "Gerando..." : "Exportar"}</Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <Label>De</Label>
            <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Até</Label>
            <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Ação</Label>
            <Input placeholder="ex: service.create" value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Ator (nome/email)</Label>
            <Input placeholder="Buscar" value={filters.actor} onChange={(e) => setFilters((f) => ({ ...f, actor: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Entidade</Label>
            <Input placeholder="ex: services, professionals" value={filters.entityType} onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value }))} />
          </div>
        </div>

        <div className="mt-4 hidden lg:block">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 py-1">
            <div className="col-span-2">Data</div>
            <div className="col-span-2">Ação</div>
            <div className="col-span-2">Entidade</div>
            <div className="col-span-2">Ator</div>
            <div className="col-span-4">Metadata</div>
          </div>
          <div className="divide-y">
            {rows.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhum log</div>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="grid grid-cols-12 gap-2 px-2 py-3 text-sm">
                  <div className="col-span-2">{new Date(r.created_at).toLocaleString()}</div>
                  <div className="col-span-2 truncate">{r.action}</div>
                  <div className="col-span-2 truncate">{r.entity_type || "-"}</div>
                  <div className="col-span-2 truncate">{r.actor?.name || "-"} <span className="text-muted-foreground">{r.actor?.email || ""}</span></div>
                  <div className="col-span-4 truncate">{r.metadata ? JSON.stringify(r.metadata) : "-"}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 lg:hidden grid gap-3">
          {rows.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Nenhum log</div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.action}</span>
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-muted-foreground">{r.entity_type || "-"}</div>
                <div className="mt-1 text-xs">{r.actor?.name || "-"} <span className="text-muted-foreground">{r.actor?.email || ""}</span></div>
                <div className="mt-1 text-xs text-muted-foreground break-all">{r.metadata ? JSON.stringify(r.metadata) : "-"}</div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{total > 0 ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} de ${total}` : "0 de 0"}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Próximo</Button>
          </div>
        </div>
        <LocalLoadingOverlay show={loading} />
      </CardContent>
      <LoadingOverlay show={exporting} label="Gerando arquivo..." fullscreen />
    </Card>
  )
}
