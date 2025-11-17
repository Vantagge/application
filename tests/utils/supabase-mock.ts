// Simple Supabase server client mock wiring for Vitest
// Usage:
//   import { setSupabaseMock } from './utils/supabase-mock'
//   setSupabaseMock({ ...fake implementation... })
// Any code calling createClient() from '@/lib/supabase/server' will receive this object.

export type SupabaseMock = any

export function setSupabaseMock(mock: SupabaseMock) {
  ;(globalThis as any).__sbMock = mock
}
