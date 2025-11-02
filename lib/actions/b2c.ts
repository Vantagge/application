"use server"

import { createClient } from "@/lib/supabase/server"

export async function getCustomerLoyaltyByToken(token: string) {
  const supabase = await createClient()

  // Query customer_loyalty by b2c_token
  const { data: loyalty, error } = await supabase
    .from("customer_loyalty")
    .select(`
      *,
      customers (*),
      establishments (
        name,
        category
      )
    `)
    .eq("b2c_token", token)
    .single()

  if (error || !loyalty) {
    return null
  }

  // Get establishment config
  const { data: config } = await supabase
    .from("establishment_configs")
    .select("*")
    .eq("establishment_id", loyalty.establishment_id)
    .single()

  return {
    loyalty,
    config,
    customer: loyalty.customers,
    establishment: loyalty.establishments,
  }
}
