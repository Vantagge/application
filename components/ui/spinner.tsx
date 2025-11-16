import { Spinner as RadixSpinner } from '@radix-ui/themes'
import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: any) {
  return <RadixSpinner className={cn(className)} {...props} />
}

export { Spinner }
