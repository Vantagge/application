import { getServices } from "@/lib/actions/service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { translations } from "@/lib/translations/pt-br"
import { ServiceCard } from "@/components/painel/service-card"

export default async function ServicosPage() {
  const services = await getServices()

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {translations.service.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
            Gerencie os serviços oferecidos pelo seu estabelecimento
          </p>
        </div>
        {/* Desktop: Button | Mobile: Hidden (will show FAB) */}
        <Button asChild className="hidden md:flex">
          <Link href="/painel/servicos/novo">
            <span className="mr-2">＋</span>
            {translations.service.addService}
          </Link>
        </Button>
      </div>

      {/* Lista de Serviços */}
      {services.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <span className="text-3xl">＋</span>
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">
                Nenhum serviço cadastrado
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Comece adicionando o primeiro serviço do seu estabelecimento
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/painel/servicos/novo">
                <span className="mr-2">＋</span>
                Adicionar Primeiro Serviço
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <Button
        asChild
        size="lg"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Adicionar novo serviço"
      >
        <Link href="/painel/servicos/novo">
          <span className="text-2xl leading-none">＋</span>
        </Link>
      </Button>
    </div>
  )
}
