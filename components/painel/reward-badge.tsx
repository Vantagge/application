import { Gift } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function RewardBadge({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <Badge className="bg-purple-600 hover:bg-purple-700 text-white inline-flex items-center">
        <Gift className="w-3 h-3 mr-1" />
        Resgate
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-purple-100 text-purple-900 px-4 py-2 rounded-lg border-2 border-purple-600 animate-pulse w-fit">
      <Gift className="w-5 h-5" />
      <span className="font-semibold">Resgate Disponível!</span>
    </div>
  )
}
