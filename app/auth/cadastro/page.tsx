"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { translations } from "@/lib/translations/pt-br"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(translations.auth.passwordsDontMatch)
      setIsLoading(false)
      return
    }

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/painel`,
          data: {
            name,
            role: "lojista",
          },
        },
      })

      if (signUpError) throw signUpError

      // Ensure a corresponding row exists in public.users as well
      try {
        if (signUpData?.user) {
          await fetch("/api/ensure-user-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: signUpData.user.id,
              email: signUpData.user.email,
              name,
              role: "lojista",
            }),
          })
        }
      } catch (e) {
        // Non-fatal: the DB has a trigger to create users; API is a safety net
        console.warn("ensure-user-profile failed", e)
      }

      router.push("/auth/sucesso")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : translations.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Vantagge</h1>
            <p className="text-sm text-neutral-600">Plataforma de Fidelização</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{translations.auth.signUpTitle}</CardTitle>
              <CardDescription>{translations.auth.signUpDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">{translations.customer.name}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{translations.auth.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{translations.auth.password}</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">{translations.auth.repeatPassword}</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                  <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#20BD5A]" disabled={isLoading}>
                    {isLoading ? translations.auth.signingUp : translations.auth.signUp}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-neutral-600">
                  {translations.auth.alreadyHaveAccount}{" "}
                  <Link href="/auth/login" className="font-medium text-[#25D366] hover:underline">
                    {translations.auth.login}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
