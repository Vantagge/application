"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Service } from "@/lib/types/database"

export type ServiceFormData = {
  name: string
  description?: string | null
  price: number
  duration_minutes?: number | null
  is_active?: boolean
}

export async function getServices(): Promise<Service[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: userData } = await supabase.from("users").select("establishment_id").eq("id", user.id).single()
  if (!userData?.establishment_id) return []

  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("establishment_id", userData.establishment_id)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true })

  return (data as Service[]) || []
}

export async function getService(id: string): Promise<Service | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("services").select("*").eq("id", id).single()
  return (data as Service) || null
}

export async function createService(form: ServiceFormData): Promise<Service> {
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
    description: form.description ?? null,
    price: form.price,
    duration_minutes: form.duration_minutes ?? null,
    is_active: form.is_active ?? true,
  }

  const { data, error } = await supabase.from("services").insert(payload).select("*").single()
  if (error) throw error

  revalidatePath("/painel/servicos")
  return data as Service
}

export async function updateService(id: string, form: ServiceFormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const updates: any = {
    name: form.name,
    description: form.description ?? null,
    price: form.price,
    duration_minutes: form.duration_minutes ?? null,
  }
  if (typeof form.is_active === "boolean") updates.is_active = form.is_active

  const { error } = await supabase.from("services").update(updates).eq("id", id)
  if (error) throw error

  revalidatePath("/painel/servicos")
}

export async function toggleServiceStatus(id: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase.from("services").select("is_active").eq("id", id).single()
  const { error } = await supabase.from("services").update({ is_active: !data?.is_active }).eq("id", id)
  if (error) throw error
  revalidatePath("/painel/servicos")
}
