"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function recordTransaction(formData: {
  customerId: string
  monetaryValue: number
  description?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()

  if (!userData?.establishment_id) throw new Error("Estabelecimento não encontrado")

  // Get establishment config
  const { data: config } = await supabase
    .from("establishment_configs")
    .select("*")
    .eq("establishment_id", userData.establishment_id)
    .single()

  if (!config) throw new Error("Configuração não encontrada")

  // Get current loyalty balance
  const { data: loyalty } = await supabase
    .from("customer_loyalty")
    .select("balance")
    .eq("customer_id", formData.customerId)
    .eq("establishment_id", userData.establishment_id)
    .single()

  if (!loyalty) throw new Error("Cliente não encontrado")

  // Calculate points
  let pointsEarned = 0
  if (config.program_type === "Pontuacao" && config.value_per_point) {
    pointsEarned = Math.floor(formData.monetaryValue / config.value_per_point)
  } else if (config.program_type === "Carimbo") {
    pointsEarned = 1
  }

  const newBalance = loyalty.balance + pointsEarned

  // Update loyalty balance
  const { error: loyaltyError } = await supabase
    .from("customer_loyalty")
    .update({
      balance: newBalance,
      last_transaction_at: new Date().toISOString(),
    })
    .eq("customer_id", formData.customerId)
    .eq("establishment_id", userData.establishment_id)

  if (loyaltyError) throw loyaltyError

  // Record transaction
  const { error: transactionError } = await supabase.from("transactions").insert({
    establishment_id: userData.establishment_id,
    customer_id: formData.customerId,
    type: "Compra",
    monetary_value: formData.monetaryValue,
    points_moved: pointsEarned,
    description: formData.description || null,
    balance_after: newBalance,
  })

  if (transactionError) throw transactionError

  revalidatePath("/painel")
  revalidatePath("/painel/clientes")

  return { pointsEarned, newBalance }
}

export async function redeemReward(formData: {
  customerId: string
  description?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()

  if (!userData?.establishment_id) throw new Error("Estabelecimento não encontrado")

  // Get establishment config
  const { data: config } = await supabase
    .from("establishment_configs")
    .select("*")
    .eq("establishment_id", userData.establishment_id)
    .single()

  if (!config) throw new Error("Configuração não encontrada")

  // Get current loyalty balance
  const { data: loyalty } = await supabase
    .from("customer_loyalty")
    .select("*")
    .eq("customer_id", formData.customerId)
    .eq("establishment_id", userData.establishment_id)
    .single()

  if (!loyalty) throw new Error("Cliente não encontrado")

  // Validate balance
  if (config.program_type === "Carimbo" && config.stamps_for_reward) {
    if (loyalty.balance < config.stamps_for_reward) {
      throw new Error("Saldo insuficiente para resgate")
    }
  }

  const pointsToRedeem =
    config.program_type === "Carimbo" && config.stamps_for_reward ? config.stamps_for_reward : loyalty.balance

  const newBalance = loyalty.balance - pointsToRedeem

  // Update loyalty balance
  const { error: loyaltyError } = await supabase
    .from("customer_loyalty")
    .update({
      balance: newBalance,
      total_redeemed: loyalty.total_redeemed + pointsToRedeem,
      redemption_count: loyalty.redemption_count + 1,
      last_transaction_at: new Date().toISOString(),
    })
    .eq("customer_id", formData.customerId)
    .eq("establishment_id", userData.establishment_id)

  if (loyaltyError) throw loyaltyError

  // Record transaction
  const { error: transactionError } = await supabase.from("transactions").insert({
    establishment_id: userData.establishment_id,
    customer_id: formData.customerId,
    type: "Resgate",
    monetary_value: null,
    points_moved: -pointsToRedeem,
    description: formData.description || "Resgate de recompensa",
    balance_after: newBalance,
  })

  if (transactionError) throw transactionError

  revalidatePath("/painel")
  revalidatePath("/painel/clientes")

  return { pointsRedeemed: pointsToRedeem, newBalance }
}
