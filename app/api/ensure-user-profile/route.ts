import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { id, email, name, role } = body as {
      id?: string
      email?: string | null
      name?: string | null
      role?: string | null
    }

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 })
    }

    // Default values, mirroring trigger logic
    const payload: any = {
      id,
      email: email ?? null,
      name: name ?? "",
      role: (role as any) ?? "lojista",
    }

    const { error } = await supabase.from("users").upsert(payload).select("id").single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
