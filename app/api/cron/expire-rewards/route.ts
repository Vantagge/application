import { NextResponse } from "next/server"
import { expireOverdueRewards } from "@/lib/jobs/expire-rewards"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const result = await expireOverdueRewards()
  return NextResponse.json(result)
}
