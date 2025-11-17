import { describe, it, expect, vi } from 'vitest'

// For API route tests that import server actions, we will mock those actions
vi.mock('@/lib/actions/transaction', () => ({
  recordServiceTransaction: vi.fn(async (_body: any) => ({ newBalance: 10, pointsEarned: 1, transactionId: 'tx1' })),
}))
vi.mock('@/lib/actions/customer', () => ({
  searchCustomers: vi.fn(async (q: string) => [{ customer_id: 'c1', customers: { name: 'Bob', whatsapp: '+55' } }]),
}))
vi.mock('@/lib/actions/transactions-history', () => ({
  getTransactionsPaged: vi.fn(async () => ({ data: [{ id: 't1' }], total: 1 })),
}))

import { POST as servicePOST } from '@/app/api/transactions/service/route'
import { GET as customersGET } from '@/app/api/customers/search/route'
import { GET as historyGET } from '@/app/api/transactions/history/route'

function makeReq(url: string, init?: any) {
  return new Request(url, init)
}

describe('API routes', () => {
  it('POST /api/transactions/service returns 200 on success', async () => {
    const req = makeReq('http://localhost/api/transactions/service', { method: 'POST', body: JSON.stringify({}) })
    const res = await servicePOST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.transactionId).toBe('tx1')
  })

  it('POST /api/transactions/service returns 400 on business error', async () => {
    const mod = await import('@/lib/actions/transaction')
    ;(mod as any).recordServiceTransaction.mockRejectedValueOnce(new Error('Regra de negócio'))
    const req = makeReq('http://localhost/api/transactions/service', { method: 'POST', body: JSON.stringify({}) })
    const res = await servicePOST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Regra')
  })

  it('GET /api/customers/search proxies to action and returns data', async () => {
    const req = makeReq('http://localhost/api/customers/search?q=bo')
    const res = await customersGET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data[0].customer_id).toBe('c1')
  })

  it('GET /api/transactions/history returns data', async () => {
    const req = makeReq('http://localhost/api/transactions/history?page=1&pageSize=20&future=0')
    const res = await historyGET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(1)
  })
})
