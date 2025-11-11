"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const updateLoyaltyRewardStatusSchema = z.object({
  customerId: z.string().uuid(),
  establishmentId: z.string().uuid(),
  newBalance: z.number().int().nonnegative(),
  stampsForReward: z.number().int().positive(),
  rewardValidityDays: z.number().int().positive().max(366),
})

export async function updateLoyaltyRewardStatus(params: {
  customerId: string
  establishmentId: string
  newBalance: number
  stampsForReward: number
  rewardValidityDays: number
}) {
  const parsed = updateLoyaltyRewardStatusSchema.parse(params)
  const supabase = await createClient()

  if (parsed.newBalance === parsed.stampsForReward) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (parsed.rewardValidityDays || 30))

    await supabase
      .from("customer_loyalty")
      .update({
        reward_ready: true,
        reward_expires_at: expiresAt.toISOString(),
      })
      .eq("customer_id", parsed.customerId)
      .eq("establishment_id", parsed.establishmentId)
  }
}

const redeemLoyaltyRewardSchema = z.object({
  customerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  professionalId: z.string().uuid().optional(),
})

export async function redeemLoyaltyReward(params: {
  customerId: string
  serviceId: string
  professionalId?: string
}) {
  const parsed = redeemLoyaltyRewardSchema.parse(params)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase
    .from("users")
    .select("establishment_id")
    .eq("id", user.id)
    .single()
  if (!userData?.establishment_id) throw new Error("Estabelecimento não encontrado")

  const establishmentId = userData.establishment_id

  const { data: loyalty } = await supabase
    .from("customer_loyalty")
    .select("*, establishment_configs(stamps_for_reward, reward_validity_days)")
    .eq("customer_id", params.customerId)
    .eq("establishment_id", establishmentId)
    .single()

  if (!loyalty?.reward_ready) {
    throw new Error("Cliente não possui recompensa disponível")
  }

  if (loyalty.reward_expires_at && new Date(loyalty.reward_expires_at) < new Date()) {
    throw new Error("Recompensa expirada")
  }

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", params.serviceId)
    .single()
  if (!service) throw new Error("Serviço não encontrado")

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      establishment_id: establishmentId,
      customer_id: params.customerId,
      professional_id: params.professionalId || null,
      type: "Resgate",
      monetary_value: 0,
      discount_amount: service.price,
      final_value: 0,
      points_moved: -loyalty.balance,
      description: `Resgate: ${service.name}`,
      balance_after: 0,
    })
    .select("*")
    .single()
  if (txError) throw txError

  await supabase.from("reward_redemptions").insert({
    establishment_id: establishmentId,
    customer_id: params.customerId,
    transaction_id: transaction.id,
    service_id: params.serviceId,
    stamps_redeemed: loyalty.balance,
  })

  await supabase
    .from("customer_loyalty")
    .update({
      balance: 0,
      reward_ready: false,
      reward_expires_at: null,
      total_redeemed: (loyalty.total_redeemed || 0) + (loyalty.balance || 0),
      redemption_count: (loyalty.redemption_count || 0) + 1,
      last_transaction_at: new Date().toISOString(),
    })
    .eq("customer_id", params.customerId)
    .eq("establishment_id", establishmentId)

  return { success: true, transactionId: transaction.id }
}
