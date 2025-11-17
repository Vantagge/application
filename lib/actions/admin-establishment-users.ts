"use server"

import { createClient } from "@/lib/supabase/server"

async function assertAdmin(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (userData?.role !== "admin") throw new Error("Não autorizado")
}

export async function listEstablishmentUsers(establishmentId: string) {
  const supabase = await createClient()
  await assertAdmin(supabase)
  // Join establishment_users with users (members)
  const { data: members, error } = await supabase
    .from("establishment_users")
    .select("user_id, role, is_active, created_at, users:users!establishment_users_user_id_fkey(id, name, email)")
    .eq("establishment_id", establishmentId)
    .order("created_at", { ascending: false })
  if (error) throw error

  // Also include owner or legacy-linked users with users.establishment_id = establishmentId
  const { data: owners } = await supabase
    .from("users")
    .select("id, name, email, role, created_at, establishment_id")
    .eq("establishment_id", establishmentId)

  const byId = new Map<string, any>()
  for (const m of members || []) {
    if (m.user_id) byId.set(m.user_id, m)
  }
  for (const u of owners || []) {
    if (!u?.id) continue
    if (byId.has(u.id)) continue
    byId.set(u.id, {
      user_id: u.id,
      role: u.role || "proprietario",
      is_active: true,
      created_at: u.created_at,
      users: { id: u.id, name: u.name, email: u.email },
    })
  }

  // Return as an array, newest first by created_at
  return Array.from(byId.values()).sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
}

export async function addUserToEstablishmentByEmail(establishmentId: string, email: string) {
  const supabase = await createClient()
  await assertAdmin(supabase)

  const normalized = email.trim().toLowerCase()
  // Try find existing user profile by email
  const { data: existing } = await supabase.from("users").select("id").eq("email", normalized).maybeSingle()

  let userId = existing?.id as string | undefined
  if (!userId) {
    // Invite user by email (Supabase will send email)
    const { data: invite, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(normalized)
    if (inviteErr) throw inviteErr
    userId = invite?.user?.id
    if (!userId) throw new Error("Convite enviado, mas ID do usuário não retornado")

    // Ensure a row exists in public.users (profile)
    await supabase.from("users").upsert({ id: userId, email: normalized, role: "lojista" }, { onConflict: "id" })
  }

  // Link membership (idempotent upsert)
  const { error } = await supabase
    .from("establishment_users")
    .upsert(
      { establishment_id: establishmentId, user_id: userId, role: "membro", is_active: true },
      { onConflict: "establishment_id,user_id" }
    )
  if (error) throw error
  return { success: true }
}

export async function toggleEstablishmentUserActive(establishmentId: string, userId: string) {
  const supabase = await createClient()
  await assertAdmin(supabase)
  const { data: row } = await supabase
    .from("establishment_users")
    .select("is_active")
    .eq("establishment_id", establishmentId)
    .eq("user_id", userId)
    .single()
  const next = !row?.is_active
  const { error } = await supabase
    .from("establishment_users")
    .update({ is_active: next })
    .eq("establishment_id", establishmentId)
    .eq("user_id", userId)
  if (error) throw error
  return { success: true, is_active: next }
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = await createClient()
  await assertAdmin(supabase)
  const normalized = email.trim().toLowerCase()
  const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
    redirectTo: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
      : undefined,
  } as any)
  if (error) throw error
  return { success: true }
}
