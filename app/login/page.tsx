// app/login/page.tsx
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPlaceholder() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login pendente</CardTitle>
          <CardDescription>
            A tela de autenticação ainda será implementada (Supabase Auth).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="secondary" className="w-full">
            <Link href="/">Voltar ao início</Link>
          </Button>
          <Button asChild className="w-full">
            <Link href="/select-account">Ir para seleção de conta</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
