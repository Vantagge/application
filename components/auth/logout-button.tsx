"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"
import { LogOut } from "lucide-react"
import { translations } from "@/lib/translations/pt-br"

export function LogoutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2">
      <LogOut className="h-4 w-4" />
      {translations.auth.logout}
    </Button>
  )
}
