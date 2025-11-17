import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/actions/transactions-history', () => ({
  getTransactionsPaged: vi.fn(async () => ({ data: [], total: 0 })),
}))

import { GET as historyGET } from '@/app/api/transactions/history/route'

function makeReq(url: string) {
  return new Request(url)
}

describe('GET /api/transactions/history establishmentId sanitization', () => {
  it('treats establishmentId=null as undefined and returns 200', async () => {
    const req = makeReq('http://localhost/api/transactions/history?page=1&pageSize=10&future=0&establishmentId=null')
    const res = await historyGET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(0)
  })

  it('treats establishmentId=undefined as undefined and returns 200', async () => {
    const req = makeReq('http://localhost/api/transactions/history?page=1&pageSize=10&future=0&establishmentId=undefined')
    const res = await historyGET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(0)
  })
})
