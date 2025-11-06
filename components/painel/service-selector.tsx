"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Service } from "@/lib/types/database"
import { Input } from "@/components/ui/input"

export type ServiceItem = {
  serviceId: string
  name: string
  unitPrice: number
  quantity: number
}

export function ServiceSelector({
  services,
  selectedServices,
  onServiceToggle,
  onQuantityChange,
}: {
  services: Service[]
  selectedServices: ServiceItem[]
  onServiceToggle: (service: Service) => void
  onQuantityChange: (serviceId: string, quantity: number) => void
}) {
  const isSelected = (id: string) => selectedServices.some((s) => s.serviceId === id)
  const getQty = (id: string) => selectedServices.find((s) => s.serviceId === id)?.quantity || 0

  return (
    <ScrollArea className="h-[300px] rounded border">
      {services.map((service) => (
        <div key={service.id} className="flex items-center gap-3 p-3 border-b last:border-b-0">
          <Checkbox checked={isSelected(service.id)} onCheckedChange={() => onServiceToggle(service)} />
          <div className="flex-1">
            <p className="font-medium">{service.name}</p>
            <p className="text-sm text-neutral-500">R$ {Number(service.price).toFixed(2)}</p>
          </div>
          {isSelected(service.id) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Qtd.</span>
              <Input
                type="number"
                min={1}
                step={1}
                value={getQty(service.id)}
                onChange={(e) => onQuantityChange(service.id, Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="w-20"
              />
            </div>
          )}
        </div>
      ))}
    </ScrollArea>
  )
}
