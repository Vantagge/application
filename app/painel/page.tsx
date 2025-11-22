import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCustomers } from "@/lib/actions/customer"
import { getEstablishmentWithConfig } from "@/lib/actions/establishment"
import HomeCustomerList, { type SimpleCustomer } from "@/components/painel/home-customer-list"
import { PlusCircle } from "lucide-react"

export default async function PainelHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const customers = await getCustomers()
  const establishmentData = await getEstablishmentWithConfig()

  const simple: SimpleCustomer[] = customers.map((r: any) => ({
    id: r.customer_id,
    name: r.customers?.name || "",
    whatsapp: r.customers?.whatsapp || null,
  }))

  return (
    <div className="space-y-6">
      {/* Header: centered logo */}
      <div className="flex justify-center">
        <div className="flex items-center justify-center h-10">
          {establishmentData?.establishment?.logo_url ? (
            <Image src={establishmentData.establishment.logo_url} alt={establishmentData.establishment.name} width={160} height={40} className="h-10 w-auto object-contain" priority />
          ) : (
            <Image src="/placeholder-logo.svg" alt="Vantagge" width={140} height={40} priority />
          )}
        </div>
      </div>

      {/* Primary action card button */}
      <Link
        href="/painel/clientes/novo"
        className="block rounded-xl bg-yellow-400 dark:bg-yellow-500 text-yellow-950 dark:text-black px-4 py-4 h-14 w-full shadow hover:brightness-95 active:brightness-90 transition text-center"
      >
        <span className="inline-flex items-center justify-center gap-2 font-semibold text-lg">
          <PlusCircle className="h-5 w-5" />
          Novo Cliente
        </span>
      </Link>

      {/* Search + List */}
      <HomeCustomerList customers={simple} />
    </div>
  )
}
