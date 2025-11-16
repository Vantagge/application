import { NextResponse } from "next/server"
import { searchCustomers } from "@/lib/actions/customer"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  try {
    const data = await searchCustomers(q)
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao buscar clientes" }, { status: 400 })
  }
}
