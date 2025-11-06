import { getCommissionReport } from "@/lib/actions/report"
import { getProfessionals } from "@/lib/actions/professional"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function toCSV(rows: Array<{ professionalId: string; name: string; commissionPct: number; totalSales: number; commissionDue: number }>) {
  const header = ["Profissional", "Total Vendas", "% Comissão", "Comissão Devida"]
  const lines = rows.map((r) => [r.name, r.totalSales.toFixed(2), r.commissionPct.toFixed(2), r.commissionDue.toFixed(2)].join(","))
  return [header.join(","), ...lines].join("\n")
}

export default async function ComissoesPage({ searchParams }: { searchParams?: Promise<{ from?: string; to?: string; professionalId?: string }> }) {
  const sp = (await searchParams) || {}
  const professionals = await getProfessionals()

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = sp.from || startOfMonth.toISOString()
  const to = sp.to || new Date().toISOString()
  const professionalId = sp.professionalId

  const data = await getCommissionReport({ from, to, professionalId })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatório de Comissões</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid md:grid-cols-4 gap-4" action="/painel/relatorios/comissoes" method="get">
            <div>
              <label className="text-sm block mb-1">De</label>
              <Input type="datetime-local" name="from" defaultValue={from.slice(0, 16)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Até</label>
              <Input type="datetime-local" name="to" defaultValue={to.slice(0, 16)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Profissional</label>
              <Select name="professionalId" defaultValue={professionalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Filtrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">Nenhum dado no período.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <form
                  action={async () => {
                    "use server"
                  }}
                >
                  {/* For static export we provide a link that generates CSV via data URI */}
                  <a
                    href={`data:text/csv;charset=utf-8,${encodeURIComponent(toCSV(data))}`}
                    download={`comissoes_${new Date(from).toISOString()}_${new Date(to).toISOString()}.csv`}
                    className="text-sm underline"
                  >
                    Exportar CSV
                  </a>
                </form>
              </div>
              <div className="rounded border">
                <div className="grid grid-cols-4 gap-2 p-2 bg-neutral-50 text-sm font-medium">
                  <div>Profissional</div>
                  <div className="text-right">Total Vendas (R$)</div>
                  <div className="text-right">% Comissão</div>
                  <div className="text-right">Comissão (R$)</div>
                </div>
                {data.map((row) => (
                  <div key={row.professionalId} className="grid grid-cols-4 gap-2 p-2 border-t text-sm">
                    <div>{row.name}</div>
                    <div className="text-right">{row.totalSales.toFixed(2)}</div>
                    <div className="text-right">{row.commissionPct.toFixed(2)}</div>
                    <div className="text-right">{row.commissionDue.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
