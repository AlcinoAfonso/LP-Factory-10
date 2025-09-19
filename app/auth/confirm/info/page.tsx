import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button asChild variant="secondary">
                <Link href="/auth/login">Voltar ao login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/login?mode=switch">Trocar conta</Link>
              </Button>
              <Button asChild>
                <Link href="/support">Solicitar acesso</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
