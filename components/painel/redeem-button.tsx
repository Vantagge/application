"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gift } from "lucide-react"
import { translations } from "@/lib/translations/pt-br"
import { redeemReward } from "@/lib/actions/transaction"
import { useToast } from "@/hooks/use-toast"

interface RedeemButtonProps {
  customerId: string
  canRedeem: boolean
  balance: number
  programType: string
  stampsNeeded: number
}

export function RedeemButton({ customerId, canRedeem, balance, programType, stampsNeeded }: RedeemButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [description, setDescription] = useState("")

  const handleRedeem = async () => {
    setIsLoading(true)

    try {
      const result = await redeemReward({
        customerId,
        description: description || undefined,
      })

      toast({
        title: translations.success.redeemed,
        description: `${result.pointsRedeemed} ${programType === "Carimbo" ? "carimbos" : "pontos"} resgatados!`,
      })

      setIsOpen(false)
      setDescription("")
      router.refresh()
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : translations.errors.generic,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant={canRedeem ? "default" : "secondary"} disabled={!canRedeem}>
          <Gift className="h-4 w-4 mr-2" />
          {translations.transaction.redeem}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resgatar Recompensa</DialogTitle>
          <DialogDescription>
            {programType === "Carimbo"
              ? `Cliente possui ${balance} carimbos. Serão resgatados ${stampsNeeded} carimbos.`
              : `Cliente possui ${balance} pontos. Todos os pontos serão resgatados.`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reward-description">Descrição da Recompensa (opcional)</Label>
            <Input
              id="reward-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Corte grátis"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            {translations.common.cancel}
          </Button>
          <Button onClick={handleRedeem} disabled={isLoading} className="bg-[#25D366] hover:bg-[#20BD5A]">
            {isLoading ? "Resgatando..." : translations.common.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
