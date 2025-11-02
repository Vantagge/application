import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { translations } from "@/lib/translations/pt-br"
import { CheckCircle2 } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">{translations.auth.signUpSuccess}</CardTitle>
              <CardDescription>{translations.auth.checkEmail}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 text-center">
                Enviamos um e-mail de confirmação para você. Por favor, verifique sua caixa de entrada e clique no link
                para ativar sua conta.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
