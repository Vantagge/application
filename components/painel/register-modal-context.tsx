"use client"
import { createContext, useContext, useState, ReactNode } from "react"

type PreselectedCustomer = { id: string; name?: string } | null

type RegisterModalContextType = {
  isOpen: boolean
  setOpen: (open: boolean) => void
  preselectedCustomer: PreselectedCustomer
  setPreselectedCustomer: (c: PreselectedCustomer) => void
}

const RegisterModalContext = createContext<RegisterModalContextType | undefined>(undefined)

export function RegisterModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [preselectedCustomer, setPreselectedCustomer] = useState<PreselectedCustomer>(null)

  return (
    <RegisterModalContext.Provider
      value={{ isOpen, setOpen: setIsOpen, preselectedCustomer, setPreselectedCustomer }}
    >
      {children}
    </RegisterModalContext.Provider>
  )
}

export function useRegisterModal() {
  const ctx = useContext(RegisterModalContext)
  if (!ctx) throw new Error("useRegisterModal must be used within RegisterModalProvider")
  return ctx
}
