import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getEstablishmentWithConfig } from "@/lib/actions/establishment"
import { LogoUploader } from "@/components/painel/logo-uploader"
import ConfiguracoesForm from "@/components/painel/configuracoes-form"
import FeatureGuard from "@/components/feature/FeatureGuard"
import UpgradePlanBanner from "@/components/feature/UpgradePlanBanner"

export default async function ConfiguracoesPage() {
  const data = await getEstablishmentWithConfig()

  if (!data) {
    return <div>Carregando...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Estabelecimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <FeatureGuard feature="custom_branding" fallback={<UpgradePlanBanner message="Para enviar seu logo e personalizar sua marca, faça upgrade do seu plano." /> }>
              <LogoUploader
                initialUrl={data.establishment.logo_url}
                establishmentName={data.establishment.name}
              />
            </FeatureGuard>
            <div className="flex-1 space-y-4">
              <div>
                <Label className="text-neutral-500">Nome</Label>
                <p className="text-lg font-medium flex items-center gap-2">
                  {data.establishment.name}
                  {data.establishment.registration && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                      #{data.establishment.registration}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-neutral-500">Categoria</Label>
                <p className="text-lg font-medium">{data.establishment.category}</p>
              </div>
              <div>
                <Label className="text-neutral-500">Responsável</Label>
                <p className="text-lg font-medium">{data.establishment.responsible_name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programa de Fidelidade</CardTitle>
          <CardDescription>Configure as regras do seu programa de fidelidade</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfiguracoesForm
            initialProgramType={data.config?.program_type || "Pontuacao"}
            initialValuePerPoint={data.config?.value_per_point ?? 10}
            initialStampsForReward={data.config?.stamps_for_reward ?? 10}
          />
        </CardContent>
      </Card>
    </div>
  )
}
