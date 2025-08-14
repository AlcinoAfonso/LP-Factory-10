// app/a/[account]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/src/lib/access/getAccessContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = { params: { account: string } };

export default async function AccountHome({ params }: Props) {
  const subdomain = params.account;

  // getAccessContext é a FONTE ÚNICA (ele usa os adapters internamente)
  // Assinatura atual espera params.account (não 'subdomain')
  const ctx = await getAccessContext({ params: { account: subdomain } });

  // Sem sessão → reforça redirecionamento (middleware já ajuda)
  if (!ctx?.session) {
    redirect("/login");
  }

  // Vínculo válido apenas para membros active|trial
  const status = ctx?.member?.status;
  const isValid =
    !!ctx?.account &&
    !!ctx?.member &&
    (status === "active" || status === "trial");

  if (!isValid) {
    notFound();
  }

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
            Dashboard em construção.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
