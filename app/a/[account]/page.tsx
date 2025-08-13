// app/a/[account]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/src/lib/access/getAccessContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = { params: { account: string } };

export default async function AccountHome({ params }: Props) {
  const subdomain = params.account;

  // getAccessContext é a FONTE ÚNICA (usa adapters internamente)
  const ctx = await getAccessContext({ subdomain });

  // Se não houver sessão, manda pro login (middleware já ajuda, mas reforçamos)
  if (!ctx.session) {
    redirect("/login");
  }

  // Vínculo inexistente ou inválido → 404 (guard rail)
  const isValid =
    ctx.account &&
    ctx.member &&
    (ctx.member.status === "active" || ctx.member.status === "trial");

  if (!isValid) {
    notFound();
  }

  // Tudo certo: render de boas-vindas (placeholder do dashboard)
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {ctx.account?.name ?? "Conta"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Subdomínio: <span className="font-mono">{subdomain}</span>
          </p>
          <p className="text-sm">
            Seu papel: <span className="font-medium">{ctx.member?.role}</span>
          </p>
          {/* Fase 2: quando ligar Plan/Limits, exibir ctx.plan/ctx.limits aqui */}
          <div className="pt-4 text-sm text-muted-foreground">
            <span>Dashboard em construção.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
