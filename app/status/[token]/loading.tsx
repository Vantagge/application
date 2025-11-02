import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#25D366]/10 via-neutral-50 to-neutral-100">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <Skeleton className="inline-block w-16 h-16 rounded-full" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>

        <Card>
          <div className="bg-gradient-to-br from-[#25D366] to-[#20BD5A] p-6">
            <Skeleton className="h-4 w-24 mb-2 bg-white/20" />
            <Skeleton className="h-12 w-32 bg-white/20" />
          </div>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
