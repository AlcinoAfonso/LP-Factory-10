import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Acesso não disponível</CardTitle>
              <CardDescription>
                Não encontramos um vínculo válido para esta conta.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Se você acredita que deveria ter acesso, solicite o vínculo
                  informando o e-mail usado no login e a conta/subdomínio
                  desejado.
                </p>

                <div className="flex flex-col gap-2">
                  <a
                    href="mailto:suporte@lpfactory.com.br?subject=LP%20Factory%20-%20Solicita%C3%A7%C3%A3o%20de%20Acesso"
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
                  >
                    Solicitar acesso
                  </a>

                  <Link
                    href="/auth/login"
                    className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
                  >
                    Voltar para login
                  </Link>

                  <Link
                    href="/a/home"
                    className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
                  >
                    Ir para /a/home
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
