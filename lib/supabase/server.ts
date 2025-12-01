import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    const missing: string[] = []
    if (!supabaseUrl) missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
    if (!anonKey) missing.push("SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    throw new Error(
      `Supabase credentials not found. Missing: ${missing.join(", ")}. Check your environment variables (.env.local or hosting provider settings).`,
    )
  }

  const secure = process.env.NODE_ENV === "production"

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure,
              sameSite: "lax",
              path: "/",
            }),
          )
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function createAdminClient() {
  // Strictly server-side use only for admin operations (e.g., auth.admin)
  const cookieStore = await cookies()
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Service role credentials not found. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set on the server.")
    }
  const secure = process.env.NODE_ENV === "production"
  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure,
              sameSite: "lax",
              path: "/",
            }),
          )
        } catch {}
      },
    },
  })
}
