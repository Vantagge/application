import { NextRequest } from "next/server"
import { getTransactionsPaged } from "@/lib/actions/transactions-history"

function parseBool(v: string | null): boolean {
  return v === "1" || v === "true"
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const future = parseBool(searchParams.get("future"))
  const filters: any = {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    type: (searchParams.get("type") as any) || undefined,
    professionalId: searchParams.get("professionalId") || undefined,
    status: searchParams.get("status") || undefined,
    customerQuery: searchParams.get("q") || undefined,
    serviceId: searchParams.get("serviceId") || undefined,
  }
  const minFinal = searchParams.get("minFinal")
  const maxFinal = searchParams.get("maxFinal")
  if (minFinal) filters.minFinal = Number(minFinal)
  if (maxFinal) filters.maxFinal = Number(maxFinal)

  try {
    // Export up to 5000 rows
    const pageSize = 5000
    const { data } = await getTransactionsPaged({ filters, page: 1, pageSize, future })

    const headers = [
      "ID",
      future ? "Agendado em" : "Criado em",
      "Cliente",
      "WhatsApp",
      "Profissional",
      "Tipo",
      "Subtotal",
      "Desconto",
      "Total",
      "Pontos",
      "Status",
      "Descrição",
    ]

    const csvRows: string[] = []
    csvRows.push(headers.join(";"))

    for (const t of data as any[]) {
      const createdOrScheduled = future ? t.scheduled_at : t.created_at
      const row = [
        t.id,
        createdOrScheduled,
        t.customers?.name || "",
        t.customers?.whatsapp || "",
        t.professionals?.name || "",
        t.type || "",
        (t.monetary_value ?? "").toString(),
        (t.discount_amount ?? "").toString(),
        (t.final_value ?? "").toString(),
        (t.points_moved ?? "").toString(),
        (t.status ?? (future ? "pending" : "completed")),
        (t.description || "").replace(/\n/g, " ")
      ]
      // Escape semicolons and quotes
      const escaped = row.map((v) => {
        const s = String(v ?? "")
        if (s.includes(";") || s.includes('"')) {
          return '"' + s.replace(/"/g, '""') + '"'
        }
        return s
      })
      csvRows.push(escaped.join(";"))
    }

    const csv = csvRows.join("\n")
    const filename = `transacoes_${future ? "futuras" : "realizadas"}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro" }, { status: 400 })
  }
}
