import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/auth/logout-button"
import Link from "next/link"
import Image from "next/image"
import { Home, Users, Settings, Scissors, Briefcase, History, Gauge, Calendar } from "lucide-react"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import RegisterProviderClient from "@/components/painel/register-provider-client"
import { RegisterHeaderButton, RegisterDialogMount } from "@/components/painel/register-triggers"
import { getEstablishmentWithConfig } from "@/lib/actions/establishment"
import { getServices } from "@/lib/actions/service"
import { getProfessionals } from "@/lib/actions/professional"

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("name, role").eq("id", user.id).single()

  if (userData?.role === "admin") {
    redirect("/admin")
  }

  const establishmentData = await getEstablishmentWithConfig()
  const [services, professionals] = await Promise.all([
    getServices(),
    getProfessionals(),
  ])

  return (
    <RegisterProviderClient>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-background">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger on the left */}
            <div className="md:hidden">
              <MobileNav />
            </div>
            <Link href="/painel" className="flex items-center gap-2">
              {establishmentData?.establishment?.logo_url ? (
                <div className="relative h-8 w-auto" style={{ minWidth: 80 }}>
                  <Image
                    src={establishmentData.establishment.logo_url}
                    alt={establishmentData.establishment.name}
                    width={120}
                    height={32}
                    className="h-8 w-auto object-contain"
                  />
                </div>
              ) : (
                <span className="text-xl font-bold text-foreground">
                  {establishmentData?.establishment?.name || "Vantagge"}
                </span>
              )}
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/painel"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                Início
              </Link>
              <Link
                href="/painel/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <Gauge className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/painel/agenda"
                className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Agenda
              </Link>
              <Link
                href="/painel/clientes"
                className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <Users className="h-4 w-4" />
                Clientes
              </Link>
              <Link
                href="/painel/servicos"
                className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <Scissors className="h-4 w-4" />
                Serviços
              </Link>
              <Link
                href="/painel/profissionais"
                className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <Briefcase className="h-4 w-4" />
                Profissionais
              </Link>
              <Link
                href="/painel/transacoes"
                className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <History className="h-4 w-4" />
                Transações
              </Link>
              <Link
                href="/painel/configuracoes"
                className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block"><ThemeToggle /></div>
            <RegisterHeaderButton />
            <span className="hidden sm:inline text-sm text-neutral-600">{userData?.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
      <RegisterDialogMount
        services={services}
        professionals={professionals}
        programType={establishmentData?.config?.program_type || "Pontuacao"}
        valuePerPoint={establishmentData?.config?.value_per_point ?? null}
      />
    </div>
    </RegisterProviderClient>
  )
}
