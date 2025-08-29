// app/auth/error/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams?: { reason?: "expired" | "used" | "invalid" | string };
};

export default function AuthErrorPage({ searchParams }: Props) {
  const r = searchParams?.reason;
  const title = "Não foi possível concluir o acesso";
  const message =
    r === "expired"
      ? "Este link expirou. Solicite um novo e-mail para continuar."
      : r === "used"
      ? "Este link já foi usado. Solicite um novo e-mail para continuar."
      : "Link inválido. Solicite um novo e-mail para continuar.";

  return (
    <div className="max-w-md mx-auto mt-20 text-center space-y-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex items-center justify-center gap-2">
        <Button asChild>
          <Link href="/a">Ir para /a</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Voltar ao login</Link>
        </Button>
      </div>
    </div>
  );
}
