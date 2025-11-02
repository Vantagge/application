"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { EstablishmentCategory, ProgramType } from "@/lib/types/database"

export async function getEstablishmentWithConfig() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()

  if (!userData?.establishment_id) {
    return null
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("*")
    .eq("id", userData.establishment_id)
    .single()

  const { data: config } = await supabase
    .from("establishment_configs")
    .select("*")
    .eq("establishment_id", userData.establishment_id)
    .single()

  return { establishment, config }
}

export async function createEstablishment(formData: {
  name: string
  category: EstablishmentCategory
  address: string
  responsibleName: string
  programType: ProgramType
  valuePerPoint?: number
  stampsForReward?: number
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  // Use a SECURITY DEFINER RPC to perform the full setup atomically and avoid RLS issues
  const { data: establishment, error: rpcError } = await supabase.rpc("setup_establishment_with_config", {
    p_name: formData.name,
    p_category: formData.category,
    p_address: formData.address,
    p_responsible_name: formData.responsibleName,
    p_program_type: formData.programType,
    p_value_per_point: formData.programType === "Pontuacao" ? formData.valuePerPoint ?? 0 : null,
    p_stamps_for_reward: formData.programType === "Carimbo" ? formData.stampsForReward ?? 0 : null,
  })

  if (rpcError) throw rpcError

  revalidatePath("/painel")
  return establishment
}

export async function updateEstablishmentConfig(formData: {
  programType: ProgramType
  valuePerPoint?: number
  stampsForReward?: number
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()

  if (!userData?.establishment_id) throw new Error("Estabelecimento não encontrado")

  const updateData: any = {
    program_type: formData.programType,
    value_per_point: null,
    stamps_for_reward: null,
  }

  if (formData.programType === "Pontuacao") {
    updateData.value_per_point = formData.valuePerPoint
  } else {
    updateData.stamps_for_reward = formData.stampsForReward
  }

  const { error } = await supabase
    .from("establishment_configs")
    .update(updateData)
    .eq("establishment_id", userData.establishment_id)

  if (error) throw error

  revalidatePath("/painel")
}

export async function getDashboardStats() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()

  if (!userData?.establishment_id) return null

  // Get total active customers
  const { count: activeCustomers } = await supabase
    .from("customer_loyalty")
    .select("*", { count: "exact", head: true })
    .eq("establishment_id", userData.establishment_id)

  // Get total points distributed
  const { data: loyaltyData } = await supabase
    .from("customer_loyalty")
    .select("balance, total_redeemed")
    .eq("establishment_id", userData.establishment_id)

  const totalPoints = loyaltyData?.reduce((sum, record) => sum + record.balance + record.total_redeemed, 0) || 0

  // Get total redemptions
  const { count: totalRedemptions } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("establishment_id", userData.establishment_id)
    .eq("type", "Resgate")

  return {
    activeCustomers: activeCustomers || 0,
    totalPoints,
    totalRedemptions: totalRedemptions || 0,
  }
}
