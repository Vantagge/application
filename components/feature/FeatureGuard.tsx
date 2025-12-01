import React from "react"
import { getCurrentUserFeatureMap } from "@/lib/features"

export default async function FeatureGuard({ feature, fallback, children }: { feature: string; fallback?: React.ReactNode; children: React.ReactNode }) {
  const res = await getCurrentUserFeatureMap()
  if (!res) {
    return <>{fallback || null}</>
  }
  const enabled = res.map.get(feature)
  if (enabled) return <>{children}</>
  return <>{fallback || null}</>
}
