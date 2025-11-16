"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreVertical, Power, Clock } from "lucide-react"
import Link from "next/link"
import { toggleServiceStatus } from "@/lib/actions/service"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import type { Service } from "@/lib/types/database"

export function ServiceCard({ service }: { service: Service }) {
  const router = useRouter()

  const handleToggleStatus = async () => {
    try {
      await toggleServiceStatus(service.id)
      toast({
        title: service.is_active ? "Serviço desativado" : "Serviço ativado",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao alterar status",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="relative hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={service.is_active ? "default" : "secondary"}>
            {service.is_active ? "Ativo" : "Inativo"}
          </Badge>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              aria-label="Editar serviço"
            >
              <Link href={`/painel/servicos/${service.id}/editar`}>
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="sm:hidden" aria-label="Abrir ações do serviço">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/painel/servicos/${service.id}/editar`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus}>
                  <Power className="w-4 h-4 mr-2" />
                  {service.is_active ? "Desativar" : "Ativar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-foreground line-clamp-2">
            {service.name}
          </h3>

          {service.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <p className="text-2xl font-bold text-primary">
                R$ {Number(service.price).toFixed(2)}
              </p>
            </div>

            {service.duration_minutes && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{service.duration_minutes} min</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
