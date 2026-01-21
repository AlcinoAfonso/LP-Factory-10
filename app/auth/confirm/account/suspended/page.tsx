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
              <CardTitle className="text-2xl">Conta suspensa</CardTitle>
              <CardDescription>
                Esta conta foi suspensa por regra administrativa.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Se você acredita que isso é um engano, entre em contato com o
                  suporte informando o subdomínio da conta.
                </p>

                <div className="flex flex-col gap-2">
                  <a
                    href="mailto:suporte@lpfactory.com.br?subject=LP%20Factory%20-%20Conta%20Suspensa"
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
                  >
                    Contatar suporte
                  </a>

                  <Link
                    href="/a/home?clear_last=1"
                    className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
                  >
                    Trocar de conta
                  </Link>

                  <Link
                    href="/auth/login"
                    className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
                  >
                    Voltar para login
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
