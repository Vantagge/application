"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/actions/admin"

export type ResolvedFeature = { key: string; name: string | null; description: string | null; enabled: boolean }

export async function listFeaturesWithStatus(establishmentId: string): Promise<ResolvedFeature[]> {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    throw new Error("Não autorizado")
  }

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

export async function updateFeatureStatus(establishmentId: string, featureKey: string, status: boolean) {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    throw new Error("Não autorizado")
  }

  const { error } = await supabase
    .from("establishment_features")
    .upsert(
      {
        establishment_id: establishmentId,
        feature_key: featureKey,
        is_enabled: status,
      },
      { onConflict: "establishment_id,feature_key" }
    )

  if (error) throw error
  revalidatePath(`/admin/tenants/${establishmentId}/features`)
  revalidatePath(`/admin/estabelecimentos/${establishmentId}`)
}