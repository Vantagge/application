"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { EstablishmentCategory, ProgramType } from "@/lib/types/database"

export async function isAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  return userData?.role === "admin"
}

export async function getAllEstablishments() {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    throw new Error("Não autorizado")
  }

  const { data: establishments } = await supabase
    .from("establishments")
    .select(`
      *,
      establishment_configs (*)
    `)
    .order("created_at", { ascending: false })

  return establishments || []
}

export async function getAdminStats() {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    throw new Error("Não autorizado")
  }

  // Total establishments
  const { count: totalEstablishments } = await supabase
    .from("establishments")
    .select("*", { count: "exact", head: true })

  // Active establishments
  const { count: activeEstablishments } = await supabase
    .from("establishments")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativo")

  // Total customers across all establishments
  const { count: totalCustomers } = await supabase.from("customer_loyalty").select("*", { count: "exact", head: true })

  // Total transactions
  const { count: totalTransactions } = await supabase.from("transactions").select("*", { count: "exact", head: true })

  return {
    totalEstablishments: totalEstablishments || 0,
    activeEstablishments: activeEstablishments || 0,
    totalCustomers: totalCustomers || 0,
    totalTransactions: totalTransactions || 0,
  }
}

export async function createEstablishmentAsAdmin(formData: {
  name: string
  category: EstablishmentCategory
  address: string
  responsibleName: string
  email: string
  password: string
  programType: ProgramType
  valuePerPoint?: number
  stampsForReward?: number
}) {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    throw new Error("Não autorizado")
  }

  // Create auth user for the establishment owner
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      name: formData.responsibleName,
      role: "lojista",
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error("Erro ao criar usuário")

  // Create establishment
  const { data: establishment, error: estError } = await supabase
    .from("establishments")
    .insert({
      name: formData.name,
      category: formData.category,
      address: formData.address,
      responsible_name: formData.responsibleName,
      status: "ativo",
    })
    .select()
    .single()

  if (estError) throw estError

  // Ensure user profile exists and link it to the establishment atomically (avoids race with trigger)
  const { error: userError } = await supabase
    .from("users")
    .upsert(
      {
        id: authData.user.id,
        email: formData.email,
        name: formData.responsibleName,
        role: "lojista",
        establishment_id: establishment.id,
      },
      { onConflict: "id" }
    )

  if (userError) throw userError

  // Create establishment config
  const configData: any = {
    establishment_id: establishment.id,
    program_type: formData.programType,
  }

  if (formData.programType === "Pontuacao") {
    configData.value_per_point = formData.valuePerPoint
  } else {
    configData.stamps_for_reward = formData.stampsForReward
  }

  const { error: configError } = await supabase.from("establishment_configs").insert(configData)

  if (configError) throw configError

  revalidatePath("/admin")
  return establishment
}

export async function updateEstablishmentStatus(establishmentId: string, status: "ativo" | "inativo" | "trial") {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    throw new Error("Não autorizado")
  }

  const { error } = await supabase.from("establishments").update({ status }).eq("id", establishmentId)

  if (error) throw error

  revalidatePath("/admin")
}

export async function getEstablishment(establishmentId: string) {
  const supabase = await createClient()

  if (!(await isAdmin())) {
    throw new Error("Não autorizado")
  }

  const { data, error } = await supabase
    .from("establishments")
    .select("*, establishment_configs(*)")
    .eq("id", establishmentId)
    .single()

  if (error) throw error
  return data
}
