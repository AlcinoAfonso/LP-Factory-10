import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Login pendente</CardTitle>
          <CardDescription>
            A tela de autenticação ainda será implementada (Supabase Auth).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild variant="secondary">
            <Link href="/">Voltar ao início</Link>
          </Button>
          <Button asChild>
            <Link href="/select-account">Ir para seleção de conta</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
