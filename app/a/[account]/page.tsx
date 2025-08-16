// app/a/[account]/page.tsx
export const revalidate = 0;

import { notFound } from "next/navigation";
import { getAccessContext } from "@/src/lib/access/getAccessContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

type Props = { params: { account: string } };

export default async function AccountHome({ params }: Props) {
  const slug = params.account;

  const ctx = await getAccessContext({ params }); // pode ser null (visitante)
  const isAnon = !ctx;

  // Se logado, validamos de novo (defesa em profundidade)
  if (!isAnon) {
    const status = (ctx as any)?.member?.status as
      | "active"
      | "inactive"
      | "pending"
      | "revoked"
      | undefined;
    const hasAccount = Boolean((ctx as any)?.account);
    const hasMember = Boolean((ctx as any)?.member);
    const isValid = hasAccount && hasMember && status === "active";
    if (!isValid) notFound();
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isAnon ? "Bem-vindo" : (ctx as any)?.account?.name ?? "Conta"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Subdomínio: <span className="font-mono">{slug}</span>
          </p>

          {isAnon ? (
            <>
              <p className="text-sm">
                Para continuar, entre ou crie sua conta com Magic Link.
              </p>
              {/* Próxima etapa: trocar por popup (modal) de Magic Link */}
              <Link
                href="/auth/callback" // placeholder: depois troca por ação de envio do link
                className="inline-flex rounded-xl border px-4 py-2 text-sm"
              >
                Entrar / Criar conta
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm">
                Seu papel:{" "}
                <span className="font-medium">{(ctx as any)?.member?.role}</span>
              </p>
              <div className="pt-2 text-sm text-muted-foreground">
                Dashboard em construção.
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
