"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { translations } from "@/lib/translations/pt-br"
import { Home, Users, Scissors, Briefcase, Settings, X, Menu } from "lucide-react"

interface NavLink {
  href: string
  label: string
  icon?: React.ReactNode
}

const defaultLinks: NavLink[] = [
  { href: "/painel", label: "Início", icon: <Home className="h-4 w-4" /> },
  { href: "/painel/clientes", label: "Clientes", icon: <Users className="h-4 w-4" /> },
  { href: "/painel/servicos", label: "Serviços", icon: <Scissors className="h-4 w-4" /> },
  { href: "/painel/profissionais", label: "Profissionais", icon: <Briefcase className="h-4 w-4" /> },
  { href: "/painel/configuracoes", label: "Configurações", icon: <Settings className="h-4 w-4" /> },
]

export function MobileNav({ links = defaultLinks }: { links?: NavLink[] }) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={translations.nav?.openMenu || "Abrir menu"} className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-full max-w-none" showCloseButton={false}>
        <div className="flex h-svh flex-col">
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <SheetHeader className="flex-1">
              <SheetTitle>{translations.nav?.menu || "Menu"}</SheetTitle>
            </SheetHeader>
            <Button variant="ghost" size="icon" aria-label={translations.nav?.close || "Fechar"} onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </header>
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted aria-[current=page]:bg-muted"
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.icon}
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>
          <div className="border-t p-3">
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
