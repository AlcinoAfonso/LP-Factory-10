// app/a/[account]/page.tsx
export const revalidate = 0;

import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/src/lib/access/getAccessContext"; // <-- ajustado
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = { params: { account: string } };

export default async function AccountHome({ params }: Props) {
  const slug = params.account;

  let ctx: Awaited<ReturnType<typeof getAccessContext>>;
  try {
    // contrato atual: params.account
    ctx = await getAccessContext({ params: { account: slug } } satisfies {
      params: { account: string };
    });
  } catch {
    return redirect("/login");
  }

  if (!ctx?.session) {
    return redirect("/login");
  }

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
