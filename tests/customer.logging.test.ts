import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => (globalThis as any).__sbMock,
}))

import { createCustomer } from '@/lib/actions/customer'

function makeSupabaseForCreate() {
  const rpcCalls: any[] = []
  return {
    __rpcCalls: rpcCalls,
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: (table: string) => {
      if (table === 'users') {
        return { select: (_sel: any) => ({ eq: (_c: string, _v: any) => ({ single: async () => ({ data: { establishment_id: 'est-1' } }) }) }) }
      }
      return { upsert: () => ({}) } as any
    },
    rpc: async (fn: string, args: any) => {
      rpcCalls.push({ fn, args })
      if (fn === 'setup_customer_with_loyalty') {
        return { data: { id: 'cust-1' }, error: null }
      }
      return { data: null, error: null }
    },
  }
}

describe('customer.createCustomer logging', () => {
  beforeEach(() => {
    ;(globalThis as any).__sbMock = makeSupabaseForCreate()
  })

  it('calls log_establishment_action after creating customer', async () => {
    const res = await createCustomer({ name: 'Alice', whatsapp: '+55', email: 'a@a.com' })
    expect(res.success).toBe(true)
    const calls = (globalThis as any).__sbMock.__rpcCalls
    const logCall = calls.find((c: any) => c.fn === 'log_establishment_action')
    expect(logCall).toBeTruthy()
    expect(logCall.args.p_action).toBe('customer.create')
    expect(logCall.args.p_establishment_id).toBe('est-1')
  })
})
