"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Professional } from "@/lib/types/database"

export type ProfessionalFormData = {
  name: string
  email?: string | null
  phone?: string | null
  commission_percentage?: number | null
  is_active?: boolean
}

export async function getProfessionals(): Promise<Professional[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()
  if (!userData?.establishment_id) return []

  const { data } = await supabase
    .from("professionals")
    .select("*")
    .eq("establishment_id", userData.establishment_id)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true })

  return (data as Professional[]) || []
}

export async function getProfessional(id: string): Promise<Professional | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("professionals").select("*").eq("id", id).single()
  return (data as Professional) || null
}

export async function createProfessional(form: ProfessionalFormData): Promise<Professional> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()
  if (!userData?.establishment_id) throw new Error("Estabelecimento não encontrado")

  const payload = {
    establishment_id: userData.establishment_id,
    name: form.name,
    email: form.email ?? null,
    phone: form.phone ?? null,
    commission_percentage: form.commission_percentage ?? null,
    is_active: form.is_active ?? true,
  }

  const { data, error } = await supabase.from("professionals").insert(payload).select("*").single()
  if (error) throw error

  revalidatePath("/painel/profissionais")
  return data as Professional
}

export async function updateProfessional(id: string, form: ProfessionalFormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const updates: any = {
    name: form.name,
    email: form.email ?? null,
    phone: form.phone ?? null,
    commission_percentage: form.commission_percentage ?? null,
  }
  if (typeof form.is_active === "boolean") updates.is_active = form.is_active

  const { error } = await supabase.from("professionals").update(updates).eq("id", id)
  if (error) throw error

  revalidatePath("/painel/profissionais")
}

export async function toggleProfessionalStatus(id: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase.from("professionals").select("is_active").eq("id", id).single()
  const { error } = await supabase.from("professionals").update({ is_active: !data?.is_active }).eq("id", id)
  if (error) throw error
  revalidatePath("/painel/profissionais")
}
