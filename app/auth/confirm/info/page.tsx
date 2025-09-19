import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Acesso não disponível</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Não encontramos um vínculo válido para esta conta. Você pode fazer login novamente,
                trocar de conta ou solicitar acesso.
              </p>
            </CardContent>

            {/* Footer simples sem CardFooter/Button */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end p-6 pt-0">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-md border border-input bg-secondary px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:opacity-90"
              >
                Voltar ao login
              </Link>
              <Link
                href="/auth/login?mode=switch"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Trocar conta
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
              >
                Solicitar acesso
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
