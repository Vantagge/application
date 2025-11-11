"use server"

import { createClient } from "@/lib/supabase/server"

export async function expireOverdueRewards() {
  const supabase = await createClient()

  const { data: expiredLoyalties } = await supabase
    .from("customer_loyalty")
    .select("*")
    .eq("reward_ready", true)
    .lt("reward_expires_at", new Date().toISOString())

  if (!expiredLoyalties || expiredLoyalties.length === 0) {
    return { expired: 0 }
  }

  for (const loyalty of expiredLoyalties as any[]) {
    await supabase.from("reward_redemptions").insert({
      establishment_id: loyalty.establishment_id,
      customer_id: loyalty.customer_id,
      stamps_redeemed: loyalty.balance,
      expired: true,
      expired_at: new Date().toISOString(),
    })

    await supabase
      .from("customer_loyalty")
      .update({
        balance: 0,
        reward_ready: false,
        reward_expires_at: null,
      })
      .eq("id", loyalty.id)
  }

  return { expired: expiredLoyalties.length }
}
