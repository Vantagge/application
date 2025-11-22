"use client"
import { RegisterModalProvider } from "./register-modal-context"

export default function RegisterProviderClient({ children }: { children: React.ReactNode }) {
  return <RegisterModalProvider>{children}</RegisterModalProvider>
}
