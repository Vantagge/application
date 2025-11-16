import { NextRequest } from "next/server"
import { recordServiceTransaction } from "@/lib/actions/transaction"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await recordServiceTransaction(body)
    return Response.json(result, { status: 200 })
  } catch (e: any) {
    // Treat validation/business-rule errors as 400 so the frontend can show the message
    const message = e?.message || "Erro ao registrar atendimento"
    // Fallback to 400 for any handled error coming from the action
    return Response.json({ error: message }, { status: 400 })
  }
}
