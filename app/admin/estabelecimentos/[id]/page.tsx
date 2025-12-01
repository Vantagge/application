import { getEstablishment } from "@/lib/actions/admin"
import { listEstablishmentUsers, addUserToEstablishmentByEmail, toggleEstablishmentUserActive, sendPasswordResetEmail } from "@/lib/actions/admin-establishment-users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Suspense } from "react"
import Link from "next/link"
import { EstablishmentTransactions } from "@/components/admin/establishment-transactions"
import { EstablishmentLogs } from "@/components/admin/establishment-logs"

async function UsersTab({ establishmentId }: { establishmentId: string }) {
  const users = await listEstablishmentUsers(establishmentId)

  async function addUser(formData: FormData) {
    "use server"
    const email = String(formData.get("email") || "").trim()
    if (!email) throw new Error("E-mail é obrigatório")
    await addUserToEstablishmentByEmail(establishmentId, email)
  }

  async function toggle(formData: FormData) {
    "use server"
    const userId = String(formData.get("userId"))
    await toggleEstablishmentUserActive(establishmentId, userId)
  }

  async function reset(formData: FormData) {
    "use server"
    const email = String(formData.get("email"))
    await sendPasswordResetEmail(email)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar usuário por e-mail</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addUser} className="flex flex-col sm:flex-row gap-2">
            <Input name="email" type="email" placeholder="email@exemplo.com" required className="flex-1" />
            <Button type="submit">Adicionar / Convidar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários com acesso</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Nenhum usuário vinculado ainda.</div>
          ) : (
            <div className="divide-y">
              {users.map((u: any) => (
                <div key={u.user_id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.users?.name || "(sem nome)"}</p>
                    <p className="text-sm text-muted-foreground truncate">{u.users?.email}</p>
                    <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${u.is_active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"}`}>{u.is_active ? "Ativo" : "Inativo"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={reset}>
                      <input type="hidden" name="email" value={u.users?.email || ""} />
                      <Button type="submit" variant="outline" size="sm">Resetar senha</Button>
                    </form>
                    <form action={toggle}>
                      <input type="hidden" name="userId" value={u.user_id} />
                      <Button type="submit" variant="ghost" size="sm">{u.is_active ? "Inativar" : "Ativar"}</Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default async function AdminEstablishmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const establishment = await getEstablishment(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{establishment.name}</h1>
          <p className="text-sm text-muted-foreground">{establishment.category} • {establishment.responsible_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline"><Link href="/admin/estabelecimentos">Voltar</Link></Button>
          <Button asChild>
            <Link href={`/admin/tenants/${id}/features`}>Gerenciar Features</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="mb-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <div className="text-sm">{establishment.name}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <div className="text-sm">{establishment.category}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Responsável</Label>
                <div className="text-sm">{establishment.responsible_name}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="text-sm capitalize">{establishment.status}</div>
              </div>
              {establishment.establishment_configs && (
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Programa de Fidelidade</Label>
                  <div className="text-sm">
                    {establishment.establishment_configs.program_type}
                    {establishment.establishment_configs.program_type === "Pontuacao" && establishment.establishment_configs.value_per_point ? (
                      <span> • R$ {Number(establishment.establishment_configs.value_per_point).toFixed(2)} por ponto</span>
                    ) : null}
                    {establishment.establishment_configs.program_type === "Carimbo" && establishment.establishment_configs.stamps_for_reward ? (
                      <span> • {establishment.establishment_configs.stamps_for_reward} carimbos por prêmio</span>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Suspense>
            {/* Server-rendered users tab */}
            <UsersTab establishmentId={id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="transacoes">
          <EstablishmentTransactions establishmentId={id} />
        </TabsContent>

        <TabsContent value="logs">
          <EstablishmentLogs establishmentId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
