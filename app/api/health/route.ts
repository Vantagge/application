import { NextResponse } from "next/server"

export async function GET() {
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    supabaseUrlPresent: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
  }
  return NextResponse.json(status)
}
