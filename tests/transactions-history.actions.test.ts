import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => (globalThis as any).__sbTxHistMock,
}))

import { getTransactionsPaged } from '@/lib/actions/transactions-history'

function makeClientForHistory() {
  const client: any = {
    _orders: [] as string[],
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: (_: any) => ({ eq: (_c: string, _v: any) => ({ single: async () => ({ data: { establishment_id: 'est-1' } }) }) }),
        }
      }
      if (table === 'transactions') {
        const builder: any = {
          select: (_sel: any, _opts?: any) => builder,
          eq: (_c: any, _v: any) => builder,
          or: (_: any, __?: any) => builder,
          not: (_: any, __?: any) => builder,
          gte: (_: any, __: any) => builder,
          lte: (_: any, __: any) => builder,
          order: (col: string, _opts?: any) => {
            client._orders.push(col)
            builder._order = col
            return builder
          },
          range: async (_from: number, _to: number) => {
            if (builder._order === 'scheduled_at') {
              const err: any = new Error('column scheduled_at does not exist')
              err.code = '42703'
              throw err
            }
            // created_at order path (legacy)
            return { data: [{ id: 't1', created_at: new Date().toISOString() }], error: null, count: 1 }
          },
        }
        return builder
      }
      throw new Error('unexpected table ' + table)
    },
  }
  return client
}

describe('transactions-history.getTransactionsPaged', () => {
  beforeEach(() => {
    ;(globalThis as any).__sbTxHistMock = makeClientForHistory()
  })

  it('falls back when scheduled_at missing and returns legacy created_at results', async () => {
    const result = await getTransactionsPaged({ future: true })
    expect(result.total).toBe(1)
    expect(result.data[0].id).toBe('t1')
  })
})
