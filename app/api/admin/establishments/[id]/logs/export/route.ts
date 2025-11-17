import { NextRequest } from "next/server"
import { exportEstablishmentLogsCSV } from "@/lib/actions/admin-logs"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const filters: any = {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    action: searchParams.get("action") || undefined,
    actor: searchParams.get("actor") || undefined,
    entityType: searchParams.get("entityType") || undefined,
  }
  try {
    const csv = await exportEstablishmentLogsCSV(id, filters)
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=estabelecimento_${id}_logs.csv`,
      },
    })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro" }, { status: 400 })
  }
}
