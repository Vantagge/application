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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
          console.log(signInError, data);
          throw signInError
      }

      // Get user role to redirect appropriately
      if (data.user) {
        console.log(data);

        // const { data: userData, error: userError } = await supabase
        //   .from("users")
        //   .select("role")
        //   .eq("id", data.user.id)
        //   .single()

        // if (userError) {
        //     console.log(userError);
        //     console.log(userData);
        //     throw userError
        // }

        // Redirect based on role
        // if (userData.role === "admin") {
          router.push("/admin")
        // } else {
        //   router.push("/painel")
        // }
      }
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
              <CardTitle className="text-2xl">{translations.auth.loginTitle}</CardTitle>
              <CardDescription>{translations.auth.loginDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
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
                  {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                  <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#20BD5A]" disabled={isLoading}>
                    {isLoading ? translations.auth.loggingIn : translations.auth.login}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-neutral-600">
                  {translations.auth.dontHaveAccount}{" "}
                  <Link href="/auth/cadastro" className="font-medium text-[#25D366] hover:underline">
                    {translations.auth.signUp}
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
