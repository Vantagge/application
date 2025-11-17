import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => (globalThis as any).__sbMock,
}))

import { searchCustomers } from '@/lib/actions/customer'

function makeSupabaseForSearch(results: any[]) {
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: (_sel: any) => ({ eq: (_c: string, _v: any) => ({ single: async () => ({ data: { establishment_id: 'est-1' } }) }) }),
        }
      }
      if (table === 'customer_loyalty') {
        const builder: any = {
          select: (_: any) => builder,
          eq: (_: any, __: any) => builder,
          or: (_: any, __: any) => builder,
          limit: (_: any) => ({ data: results }),
        }
        return builder
      }
      throw new Error('unexpected table ' + table)
    },
  }
}

describe('customer.searchCustomers', () => {
  beforeEach(() => {
    ;(globalThis as any).__sbMock = makeSupabaseForSearch([{ customer_id: 'c1', customers: { name: 'Alice', whatsapp: '+5511999999999' } }])
  })

  it('returns mapped data from API', async () => {
    const data = await searchCustomers('ali')
    expect(Array.isArray(data)).toBe(true)
    expect(data[0].customer_id).toBe('c1')
    expect(data[0].customers.name).toBe('Alice')
  })
})
