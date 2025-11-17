"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { updateLoyaltyRewardStatus } from "@/lib/actions/loyalty"
import { generateLoyaltyCardImage } from "@/lib/actions/card-generator"
import { z } from "zod"

const recordTransactionSchema = z.object({
  customerId: z.string().uuid(),
  monetaryValue: z.number().finite().nonnegative(),
  description: z.string().max(500).optional(),
})

export async function recordTransaction(formData: {
  customerId: string
  monetaryValue: number
  description?: string
}) {
  // Validate input DTO
  const parsed = recordTransactionSchema.parse(formData)
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

const redeemRewardSchema = z.object({
  customerId: z.string().uuid(),
  description: z.string().max(500).optional(),
})

export async function redeemReward(formData: {
  customerId: string
  description?: string
}) {
  const parsed = redeemRewardSchema.parse(formData)
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

const serviceItemSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().int().positive().max(999),
  unitPrice: z.number().finite().nonnegative(),
})

const recordServiceTransactionSchema = z.object({
  customerId: z.string().uuid(),
  professionalId: z.string().uuid().optional(),
  services: z.array(serviceItemSchema).min(1),
  discountAmount: z.number().finite().nonnegative().max(9_999_999),
  description: z.string().max(500).optional(),
})

export async function recordServiceTransaction(formData: {
  customerId: string
  professionalId?: string
  services: Array<{
    serviceId: string
    quantity: number
    unitPrice: number
  }>
  discountAmount: number
  description?: string
}) {
  // Delay strict validation until after establishment-level business rules that don't depend on payload shape
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()
  if (!userData?.establishment_id) throw new Error("Estabelecimento não encontrado")

  const establishment_id = userData.establishment_id

  // Business rules validation
  // 1) Must have at least one active professional in the establishment
  const { count: activeProfCount } = await supabase
    .from("professionals")
    .select("id", { count: "exact", head: true })
    .eq("establishment_id", establishment_id)
    .eq("is_active", true)
  if (!activeProfCount || activeProfCount === 0) {
    throw new Error("Não há profissionais ativos no estabelecimento. Ative um profissional para registrar o atendimento.")
  }

  // Only after establishment-level guardrails, validate the payload strictly
  const parsed = recordServiceTransactionSchema.parse(formData)

  // 2) If a professional was selected, ensure it's active and belongs to the establishment
  if (parsed.professionalId) {
    const { data: prof } = await supabase
      .from("professionals")
      .select("id, establishment_id, is_active")
      .eq("id", parsed.professionalId)
      .single()
    if (!prof || prof.establishment_id !== establishment_id || !prof.is_active) {
      throw new Error("Profissional inválido ou inativo para este estabelecimento.")
    }
  }

  // 3) Services must be active and belong to the establishment
  const serviceIds = parsed.services.map((s) => s.serviceId)
  const { data: activeServices } = await supabase
    .from("services")
    .select("id")
    .in("id", serviceIds)
    .eq("establishment_id", establishment_id)
    .eq("is_active", true)
  if (!activeServices || activeServices.length !== serviceIds.length) {
    throw new Error("Um ou mais serviços selecionados estão inativos ou não pertencem ao estabelecimento.")
  }

  // Get establishment info
  const { data: establishment } = await supabase
    .from("establishments")
    .select("name")
    .eq("id", establishment_id)
    .single()

  // Get establishment config
  const { data: config } = await supabase
    .from("establishment_configs")
    .select("*")
    .eq("establishment_id", establishment_id)
    .single()
  if (!config) throw new Error("Configuração não encontrada")

  // Get current loyalty balance
  const { data: loyalty } = await supabase
    .from("customer_loyalty")
    .select("balance")
    .eq("customer_id", formData.customerId)
    .eq("establishment_id", establishment_id)
    .single()
  if (!loyalty) throw new Error("Cliente não encontrado")

  // Calculate values
  const subtotal = formData.services.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0)
  const discountAmount = Math.max(0, formData.discountAmount || 0)
  if (discountAmount > subtotal) throw new Error("Desconto maior que o subtotal")
  const finalValue = subtotal - discountAmount

  // Calculate points
  let pointsEarned = 0
  if (config.program_type === "Pontuacao" && config.value_per_point) {
    pointsEarned = Math.floor(finalValue / config.value_per_point)
  } else if (config.program_type === "Carimbo") {
    pointsEarned = 1
  }

  const newBalance = loyalty.balance + pointsEarned

  // Update loyalty first to keep balance consistent
  const { error: loyaltyError } = await supabase
    .from("customer_loyalty")
    .update({ balance: newBalance, last_transaction_at: new Date().toISOString() })
    .eq("customer_id", formData.customerId)
    .eq("establishment_id", establishment_id)
  if (loyaltyError) throw loyaltyError

  // Insert transaction and get id
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      establishment_id,
      customer_id: formData.customerId,
      professional_id: formData.professionalId || null,
      type: "Compra",
      monetary_value: subtotal,
      discount_amount: discountAmount,
      final_value: finalValue,
      points_moved: pointsEarned,
      description: formData.description || null,
      balance_after: newBalance,
    })
    .select("*")
    .single()
  if (txError) throw txError

  // Insert items
  const items = formData.services.map((s) => ({
    transaction_id: transaction.id,
    service_id: s.serviceId,
    professional_id: formData.professionalId || null,
    quantity: s.quantity,
    unit_price: s.unitPrice,
    subtotal: s.quantity * s.unitPrice,
  }))

  const { error: itemsError } = await supabase.from("transaction_items").insert(items)
  if (itemsError) throw itemsError

  // Update reward status for stamp programs and generate card image
  if (config.program_type === "Carimbo") {
    try {
      await updateLoyaltyRewardStatus({
        customerId: formData.customerId,
        establishmentId: establishment_id,
        newBalance,
        stampsForReward: config.stamps_for_reward || 10,
        rewardValidityDays: config.reward_validity_days || 30,
      })

      await generateLoyaltyCardImage({
        establishmentName: establishment?.name || "Estabelecimento",
        logoUrl: (config as any).establishment_logo_url || undefined,
        currentStamps: newBalance,
        totalStamps: config.stamps_for_reward || 10,
        primaryColor: (config as any).card_primary_color || undefined,
        customerId: formData.customerId,
        establishmentId: establishment_id,
      })
    } catch (err) {
      console.error("Erro ao atualizar status/gerar cartão:", err)
    }
  }

  revalidatePath("/painel")
  revalidatePath("/painel/clientes")
  return { pointsEarned, newBalance, transactionId: transaction.id }
}
