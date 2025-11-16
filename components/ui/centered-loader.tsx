import { Spinner } from "./spinner"

export function CenteredLoader() {
  return (
    <div className="flex items-center justify-center py-12 min-h-[40vh]">
      <Spinner size="3" />
    </div>
  )
}
