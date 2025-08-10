import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Mensagem neutra (não expor motivo específico), conforme Bússola.
 */
export default function BlockedPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>Seu acesso a esta conta não está ativo no momento.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/select-account">Voltar para seleção de conta</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
