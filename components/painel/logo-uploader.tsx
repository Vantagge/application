"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"

export function LogoUploader({ initialUrl, establishmentName, onUploaded }: {
  initialUrl?: string | null
  establishmentName?: string
  onUploaded?: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()
  const [preview, setPreview] = useState<string | null>(initialUrl || null)
  const [uploading, setUploading] = useState(false)

  const openPicker = () => fileRef.current?.click()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validations
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use PNG ou JPEG", variant: "destructive" })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Tamanho máximo 2MB", variant: "destructive" })
      return
    }

    // Local preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/establishment/logo", { method: "POST", body: form })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || "Falha no upload")
      }
      const url = json.url as string
      setPreview(url)
      onUploaded?.(url)
      toast({ title: "Logo atualizado" })
    } catch (err: any) {
      toast({ title: "Erro ao enviar logo", description: err?.message || "Tente novamente", variant: "destructive" })
      // revert preview to previous on error
      setPreview(initialUrl || null)
    } finally {
      setUploading(false)
      // Release blob URL
      setTimeout(() => {
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview)
      }, 0)
    }
  }

  const initials = (establishmentName || "").trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || "").join("") || "VG"

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
        {preview ? (
          preview.startsWith("blob:") ? (
            <img src={preview} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <Image src={preview} alt="Logo" fill className="object-contain" sizes="128px" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-semibold bg-neutral-100 text-neutral-600">
            {initials}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Spinner className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={openPicker} disabled={uploading}>
          {uploading ? "Enviando..." : "Alterar Logo"}
        </Button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleChange} />
        <p className="text-xs text-muted-foreground">PNG ou JPEG até 2MB. Clique no botão para selecionar.</p>
      </div>
    </div>
  )
}
