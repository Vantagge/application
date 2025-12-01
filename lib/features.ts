import { createClient } from "@/lib/supabase/server"

// Simple in-memory cache for server runtime. Flushes on redeploy.
// Keyed by establishmentId; stores a Map<featureKey, boolean> and timestamp
const cache = new Map<string, { ts: number; map: Map<string, boolean> }>()
const TTL_MS = 60 * 1000 // 1 minute TTL to balance freshness and performance

export type FeatureRow = {
  key: string
  name: string | null
  description: string | null
  enabled: boolean
}

export async function listResolvedFeatures(establishmentId: string): Promise<FeatureRow[]> {
  const supabase = await createClient()

  // Join features with overrides to compute final enabled
  const { data, error } = await supabase
    .from("features")
    .select(
      `key, name, description, default_enabled,
       establishment_features:establishment_features!left(establishment_id, feature_key, is_enabled)`
    )
    .order("key", { ascending: true })

  if (error) throw error

  return (data || []).map((row: any) => {
    const override = Array.isArray(row.establishment_features)
      ? row.establishment_features.find((ef: any) => ef.establishment_id === establishmentId)
      : null
    const enabled = override?.is_enabled ?? row.default_enabled ?? false
    return { key: row.key, name: row.name, description: row.description, enabled }
  })
}

export async function getFeatureMap(establishmentId: string): Promise<Map<string, boolean>> {
  // Cache lookup
  const entry = cache.get(establishmentId)
  const now = Date.now()
  if (entry && now - entry.ts < TTL_MS) {
    return entry.map
  }

  const features = await listResolvedFeatures(establishmentId)
  const map = new Map<string, boolean>()
  for (const f of features) map.set(f.key, f.enabled)
  cache.set(establishmentId, { ts: now, map })
  return map
}

export async function hasFeature(establishmentId: string, featureKey: string): Promise<boolean> {
  const map = await getFeatureMap(establishmentId)
  return map.get(featureKey) ?? false
}

// Convenience for current authenticated user
export async function getCurrentUserFeatureMap(): Promise<{ establishmentId: string; map: Map<string, boolean> } | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()
  if (!userData?.establishment_id) return null
  const map = await getFeatureMap(userData.establishment_id)
  return { establishmentId: userData.establishment_id, map }
}
