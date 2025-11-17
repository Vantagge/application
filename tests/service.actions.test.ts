import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => (globalThis as any).__sbMock,
}))

import { createService } from '@/lib/actions/service'

function makeAuthUser(id: string) {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id } } }),
    },
    from: (table: string) => ({
      select: (_sel?: any) => ({
        eq: (_c: string, _v: any) => ({ single: async () => ({ data: { establishment_id: 'est-1' } }) }),
      }),
      insert: (payload: any) => ({
        select: () => ({ single: async () => ({ data: { id: 'svc-1', ...payload } }) }),
      }),
    }),
  }
}

describe('service.createService', () => {
  beforeEach(() => {
    ;(globalThis as any).__sbMock = makeAuthUser('user-1')
  })

  it('creates a service successfully', async () => {
    const res = await createService({ name: 'Corte', price: 50, description: null, duration_minutes: null, is_active: true })
    expect(res.id).toBe('svc-1')
    expect(res.name).toBe('Corte')
  })

  it('maps unique violation 23505 to friendly error', async () => {
    ;(globalThis as any).__sbMock = {
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: (table: string) => ({
        select: (_: any) => ({ eq: (_c: string, _v: any) => ({ single: async () => ({ data: { establishment_id: 'est-1' } }) }) }),
        insert: (_payload: any) => ({ select: () => ({ single: async () => ({ data: null, error: { code: '23505' } }) }) }),
      }),
    }
    await expect(
      createService({ name: 'Duplicado', price: 10, description: null, duration_minutes: null, is_active: true })
    ).rejects.toThrow('Serviço já cadastrado')
  })
})
