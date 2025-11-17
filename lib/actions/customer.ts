"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getCustomers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()

  if (!userData?.establishment_id) return []

  const { data: loyaltyRecords } = await supabase
    .from("customer_loyalty")
    .select(`
      *,
      customers (*)
    `)
    .eq("establishment_id", userData.establishment_id)
    .order("created_at", { ascending: false })

  return loyaltyRecords || []
}

export async function createCustomer(formData: {
  name: string
  whatsapp: string
  email?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()

  if (!userData?.establishment_id) throw new Error("Estabelecimento não encontrado")

  // Use SECURITY DEFINER RPC to avoid RLS issues when creating customers and loyalty records
  const { data: customer, error: rpcError } = await supabase.rpc("setup_customer_with_loyalty", {
    p_name: formData.name,
    p_whatsapp: formData.whatsapp,
    p_email: formData.email ?? null,
  })

  if (rpcError) {
    // Handle PostgreSQL exceptions from SECURITY DEFINER function gracefully
    // P0001 is a generic raise exception; rethrow a clean Error message for UI handling
    const anyErr = rpcError as any
    if (anyErr.code === "P0001") {
      const cleanMsg = anyErr.details || anyErr.message || "Erro ao criar cliente"
      throw new Error(cleanMsg)
    }
    // Fallback: wrap unknown errors to avoid leaking raw objects
    throw new Error(anyErr?.message || "Erro ao criar cliente")
  }

  // Write activity log (non-blocking)
  try {
    await supabase.rpc("log_establishment_action", {
      p_establishment_id: userData.establishment_id,
      p_action: "customer.create",
      p_entity_type: "customer",
      p_entity_id: customer?.id || null,
      p_metadata: { name: formData.name, whatsapp: formData.whatsapp, email: formData.email ?? null },
    })
  } catch (e) {
    // ignore logging errors
  }

  revalidatePath("/painel/clientes")
  return { success: true, customer }
}

export async function getCustomerDetails(customerId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()

  if (!userData?.establishment_id) throw new Error("Estabelecimento não encontrado")

  const { data: loyalty } = await supabase
    .from("customer_loyalty")
    .select(`
      *,
      customers (*)
    `)
    .eq("customer_id", customerId)
    .eq("establishment_id", userData.establishment_id)
    .single()

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("customer_id", customerId)
    .eq("establishment_id", userData.establishment_id)
    .order("created_at", { ascending: false })
    .limit(20)

  return { loyalty, transactions: transactions || [] }
}

export async function updateCustomer(customerId: string, formData: { name: string; whatsapp: string; email?: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const updates = {
    name: formData.name,
    whatsapp: formData.whatsapp,
    email: formData.email ?? null,
  }

  const { error } = await supabase.from("customers").update(updates).eq("id", customerId)
  if (error) throw error

  revalidatePath("/painel/clientes")
  revalidatePath(`/painel/clientes/${customerId}`)
}

export async function searchCustomers(query: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()
  if (!userData?.establishment_id) return []

  const ilike = `%${query}%`
  const { data } = await supabase
    .from("customer_loyalty")
    .select(`
      *,
      customers!inner(*)
    `)
    .eq("establishment_id", userData.establishment_id)
    .or(`name.ilike.${ilike},whatsapp.ilike.${ilike}`, { foreignTable: "customers" })
    .limit(20)

  return data || []
}
