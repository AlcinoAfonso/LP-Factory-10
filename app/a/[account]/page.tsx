// app/a/[account]/page.tsx
export const revalidate = 0;

import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = { params: { account: string } };

export default async function AccountHome({ params }: Props) {
  const slug = params.account;

  let ctx: Awaited<ReturnType<typeof getAccessContext>>;
  try {
    // Contrato atual: use params.account (nada de 'subdomain')
    ctx = await getAccessContext({ params: { account: slug } } satisfies {
      params: { account: string };
    });
  } catch (_err) {
    // Se o contexto não pode ser resolvido (sem sessão, etc.), trate com redirect adequado
    // Mantemos a política mínima: primeiro tenta login; bloqueios específicos podem redirecionar a /blocked
    return redirect("/login");
  }

  // Sem sessão → reforça redirect (middleware já cobre, mas mantemos explícito)
  if (!ctx?.session) {
    return redirect("/login");
  }

  // Válido apenas p/ membros active|trial
  const status = ctx?.member?.status;
  const isValid =
    !!ctx?.account &&
    !!ctx?.member &&
    (status === "active" || status === "trial");

  if (!isValid) {
    return notFound();
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
            Subdomínio: <span className="font-mono">{slug}</span>
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
