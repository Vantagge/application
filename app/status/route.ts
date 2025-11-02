import { NextResponse } from "next/server"
import pkg from "../../../package.json"
import { checkDatabaseSetup } from "@/lib/db/setup"

export async function GET() {
  const env = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  let dbChecks: { table: string; exists: boolean }[] | null = null
  let dbError: string | null = null
  try {
    dbChecks = await checkDatabaseSetup()
  } catch (e: any) {
    dbError = e?.message || String(e)
  }

  return NextResponse.json({
    name: pkg.name,
    version: pkg.version,
    now: new Date().toISOString(),
    env,
    database: {
      checks: dbChecks,
      error: dbError,
    },
  })
}
