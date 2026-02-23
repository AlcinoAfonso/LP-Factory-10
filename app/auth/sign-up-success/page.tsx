'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Cadastro iniciado</CardTitle>
              <CardDescription>Confirme seu e-mail para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de confirmação para o seu e-mail. Abra sua caixa de entrada (e spam)
                  e clique no link para ativar sua conta.
                </p>
                <p className="text-sm text-muted-foreground">
                  Ao clicar no link, você será redirecionado automaticamente para concluir a ativação da
                  conta.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
