// app/a/[account]/page.tsx
export const revalidate = 0;

import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/src/lib/access/getAccessContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = { params: { account: string } };

export default async function AccountHome({ params }: Props) {
  const slug = params.account;

  // getAccessContext: contrato atual usa params.account
  const ctx = await getAccessContext({ params: { account: slug } } satisfies {
    params: { account: string };
  });

  // Regras de acesso (Bússola): permitir apenas membro active|trial
  const status = (ctx as any)?.member?.status as
    | "active"
    | "trial"
    | "invited"
    | "inactive"
    | undefined;

  const hasAccount = Boolean((ctx as any)?.account);
  const hasMember = Boolean((ctx as any)?.member);

  const isValid =
    hasAccount && hasMember && (status === "active" || status === "trial");

  // Se não houver vínculo válido, 404
  if (!isValid) {
    // Se preferir separar bloqueio de vínculo de ausência de login:
    // - ausência de login já deve ser tratada no middleware
    // - vínculo inválido → 404 (guard rail)
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {(ctx as any)?.account?.name ?? "Conta"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Subdomínio: <span className="font-mono">{slug}</span>
          </p>
          <p className="text-sm">
            Seu papel:{" "}
            <span className="font-medium">{(ctx as any)?.member?.role}</span>
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
