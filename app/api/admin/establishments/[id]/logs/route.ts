import { NextRequest } from "next/server"
import { listEstablishmentLogs } from "@/lib/actions/admin-logs"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") || 1)
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 20))
  const filters: any = {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    action: searchParams.get("action") || undefined,
    actor: searchParams.get("actor") || undefined,
    entityType: searchParams.get("entityType") || undefined,
  }
  try {
    const result = await listEstablishmentLogs(id, { filters, page, pageSize })
    return Response.json(result)
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro" }, { status: 400 })
  }
}
