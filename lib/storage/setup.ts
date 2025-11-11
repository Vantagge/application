"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Ensure the Supabase Storage bucket used for establishment assets exists and is public.
 * Safe to call multiple times; it will no-op if the bucket already exists.
 */
export async function ensureEstablishmentAssetsBucket() {
  const supabase = await createClient()

  // Try to get bucket details first (listBuckets doesn't filter by name, so we try create and ignore conflict)
  const { error } = await supabase.storage.createBucket("establishment-assets", {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB cap for safety
  })

  // If bucket already exists, ignore the error
  if (error && !String(error.message || "").toLowerCase().includes("already exists")) {
    // Some drivers return code "409" for existing bucket; any other error should bubble up
    if ((error as any).status !== 409) {
      throw error
    }
  }

  // For older backends where public flag might not apply retroactively, attempt to update policy via updateBucket
  // Not all versions expose updateBucket; ignore failures silently here to keep upload flow resilient
  try {
    // @ts-ignore - updateBucket may not be typed depending on supabase-js version
    await supabase.storage.updateBucket("establishment-assets", { public: true })
  } catch {
    // ignore
  }
}
