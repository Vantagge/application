import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => (globalThis as any).__sbTxMock,
}))

import { recordServiceTransaction } from '@/lib/actions/transaction'

function makeClientWithNoActivePros() {
  const client: any = {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: (table: string) => {
      if (table === 'users') {
        return { select: (_: any) => ({ eq: (_: any, __: any) => ({ single: async () => ({ data: { establishment_id: 'est-1' } }) }) }) }
      }
      if (table === 'professionals') {
        return { select: (_: any, opts?: any) => ({ eq: (_: any, __: any) => ({ eq: (_: any, __: any) => ({ count: 0 }) }) }) }
      }
      if (table === 'services') {
        return { select: (_: any) => ({ in: (_: any, __: any) => ({ eq: (_: any, __: any) => ({ eq: (_: any, __: any) => ({ data: [] }) }) }) }) }
      }
      if (table === 'establishments') {
        return { select: (_: any) => ({ eq: (_: any, __: any) => ({ single: async () => ({ data: { name: 'Est' } }) }) }) }
      }
      if (table === 'establishment_configs') {
        return { select: (_: any) => ({ eq: (_: any, __: any) => ({ single: async () => ({ data: { program_type: 'Pontuacao', value_per_point: 10 } }) }) }) }
      }
      if (table === 'customer_loyalty') {
        return {
          select: (_: any) => ({ eq: (_: any, __: any) => ({ eq: (_: any, __: any) => ({ single: async () => ({ data: { balance: 0 } }) }) }) }),
          update: (_: any) => ({ eq: (_: any, __: any) => ({ eq: (_: any, __: any) => ({ error: null }) }) }),
        }
      }
      if (table === 'transactions') {
        return { insert: (_: any) => ({ select: () => ({ single: async () => ({ data: { id: 'tx1' } }) }) }) }
      }
      if (table === 'transaction_items') {
        return { insert: (_: any) => ({ error: null }) }
      }
      return {}
    },
  }
  return client
}

describe('transaction.recordServiceTransaction', () => {
  beforeEach(() => {
    ;(globalThis as any).__sbTxMock = makeClientWithNoActivePros()
  })

  it('throws when there are no active professionals', async () => {
    await expect(
      recordServiceTransaction({
        customerId: 'c1',
        professionalId: undefined,
        services: [{ serviceId: 's1', quantity: 1, unitPrice: 10 }],
        discountAmount: 0,
      })
    ).rejects.toThrow('Não há profissionais ativos')
  })
})
