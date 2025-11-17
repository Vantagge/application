import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => (globalThis as any).__sbMock,
}))

import { listEstablishmentUsers } from '@/lib/actions/admin-establishment-users'

function makeSupabaseForListUsers({ members = [], owner, isAdmin = true }: any) {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: 'admin-1' } } }),
    },
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: (sel: any) => {
            const selStr = String(sel)
            if (selStr.includes('establishment_id') && selStr.includes('id, name')) {
              // owners list query
              return {
                eq: (_col: string, _val: any) => ({ data: owner ? [owner] : [], error: null }),
              }
            }
            // default admin role check
            return {
              eq: (_col: string, _val: any) => ({
                single: async () => ({ data: isAdmin ? { role: 'admin' } : { role: 'lojista' } }),
              }),
            }
          },
        }
      }
      if (table === 'establishment_users') {
        const builder: any = {
          select: (_sel: any) => builder,
          eq: (_col: string, _val: any) => builder,
          order: (_col: string, _opts: any) => ({ data: members, error: null }),
        }
        return builder
      }
      // fallback
      return {} as any
    },
  }
}

describe('admin.listEstablishmentUsers', () => {
  beforeEach(() => {
    ;(globalThis as any).__sbMock = makeSupabaseForListUsers({
      members: [],
      owner: { id: 'u1', name: 'Owner', email: 'owner@ex.com', role: 'lojista', created_at: '2024-01-01', establishment_id: 'est-1' },
      isAdmin: true,
    })
  })

  it('returns owner when there are no membership rows', async () => {
    const users = await listEstablishmentUsers('est-1')
    expect(Array.isArray(users)).toBe(true)
    expect(users.length).toBe(1)
    expect(users[0].users.email).toBe('owner@ex.com')
    expect(users[0].is_active).toBe(true)
  })
})
