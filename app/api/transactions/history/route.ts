import { NextRequest } from "next/server"
import { getTransactionsPaged } from "@/lib/actions/transactions-history"

function parseBool(v: string | null): boolean {
  return v === "1" || v === "true"
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const future = parseBool(searchParams.get("future"))
  const page = Number(searchParams.get("page") || 1)
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 20))
  const rawEstId = searchParams.get("establishmentId")
  const establishmentId = !rawEstId || rawEstId === "null" || rawEstId === "undefined" ? undefined : rawEstId
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
    const result = await getTransactionsPaged({ filters, page, pageSize, future, establishmentId })
    return Response.json(result)
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro" }, { status: 400 })
  }
}
