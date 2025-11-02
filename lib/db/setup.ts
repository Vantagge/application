// Database setup utility to verify schema
import { createClient } from "@/lib/supabase/server"

export async function checkDatabaseSetup() {
  const supabase = await createClient()

  // Check if tables exist
  const tables = ["users", "establishments", "establishment_configs", "customers", "customer_loyalty", "transactions"]

  const results = await Promise.all(
    tables.map(async (table) => {
      const { error } = await supabase.from(table).select("id").limit(1)
      return { table, exists: !error }
    }),
  )

  return results
}
