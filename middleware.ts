import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Allow health and cron endpoints without auth redirects
  const path = request.nextUrl.pathname
  if (path.startsWith("/api/health") || path.startsWith("/api/cron")) {
    return NextResponse.next()
  }
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
