"use client"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useRegisterModal } from "./register-modal-context"
import { ServiceTransactionDialog } from "./service-transaction-dialog"
import type { Service, Professional } from "@/lib/types/database"

export function RegisterHeaderButton() {
  const { setOpen } = useRegisterModal()
  return (
    <Button size="sm" className="hidden md:inline-flex" onClick={() => setOpen(true)}>
      <PlusCircle className="h-4 w-4 mr-2" />
      Registrar Atendimento
    </Button>
  )
}

export function RegisterMobileButton() {
  const { setOpen } = useRegisterModal()
  return (
    <Button
      className="md:hidden w-full min-h-12 h-12"
      onClick={() => setOpen(true)}
    >
      Registrar Atendimento
    </Button>
  )
}

export function RegisterDialogMount(props: {
  services: Service[]
  professionals: Professional[]
  programType: "Pontuacao" | "Carimbo"
  valuePerPoint: number | null
}) {
  const { isOpen, setOpen } = useRegisterModal()
  return (
    <ServiceTransactionDialog
      isOpen={isOpen}
      onOpenChange={setOpen}
      services={props.services}
      professionals={props.professionals}
      programType={props.programType}
      valuePerPoint={props.valuePerPoint}
    />
  )
}
