// app/a/[account]/page.tsx
export const revalidate = 0;

import { notFound } from "next/navigation";
import { getAccessContext } from "@/src/lib/access/getAccessContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = {
  params: { account: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function AccountHome({ params, searchParams }: Props) {
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

  const role = (ctx as any)?.member?.role as
    | "owner"
    | "admin"
    | "editor"
    | "viewer"
    | undefined;

  const hasAccount = Boolean((ctx as any)?.account);
  const hasMember = Boolean((ctx as any)?.member);

  const isValid =
    hasAccount && hasMember && (status === "active" || status === "trial");

  if (!isValid) {
    // ausência de login já deve ser tratada no middleware;
    // vínculo inválido → 404 (guard rail)
    notFound();
  }

  // Deep link do convite (?invite=new) — só abre para quem pode convidar
  const wantsInvite =
    (searchParams?.invite === "new" ||
      (Array.isArray(searchParams?.invite) &&
        searchParams?.invite?.[0] === "new")) ?? false;

  const canInvite = role === "owner" || role === "admin" || role === "editor";
  const openInviteModal = Boolean(wantsInvite && canInvite);

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

          {/* Placeholder simples enquanto a UI definitiva do modal não chega */}
          <InviteModal initialOpen={openInviteModal} accountSlug={slug} />

          {/* Fase 2: quando ligar Plan/Limits, exibir ctx.plan/ctx.limits aqui */}
          <div className="pt-4 text-sm text-muted-foreground">
            Dashboard em construção.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Componente cliente de modal leve, sem dependências extras.
 * Abre quando initialOpen = true e fecha limpando o query param ?invite.
 */
function ModalStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      .__overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4);z-index:50}
      .__dialog{width:100%;max-width:520px;background:white;border-radius:1rem;box-shadow:0 10px 30px rgba(0,0,0,.15)}
      .__hd{padding:1rem 1.25rem;border-bottom:1px solid rgba(0,0,0,.06);font-weight:600}
      .__bd{padding:1rem 1.25rem}
      .__ft{padding:1rem 1.25rem;border-top:1px solid rgba(0,0,0,.06);display:flex;justify-content:flex-end;gap:.5rem}
      `,
      }}
    />
  );
}

function noop() {}

/* ------------------------------------------- */
/*                CLIENT COMPONENT             */
/* ------------------------------------------- */
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function InviteModal({
  initialOpen,
  accountSlug,
}: {
  initialOpen: boolean;
  accountSlug: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [open, setOpen] = useState<boolean>(initialOpen);

  // remove ?invite=new ao fechar
  const close = useMemo(
    () => () => {
      const params = new URLSearchParams(search?.toString() ?? "");
      params.delete("invite");
      const qs = params.toString();
      router.replace(qs ? `/a/${accountSlug}?${qs}` : `/a/${accountSlug}`);
      setOpen(false);
    },
    [router, search, accountSlug]
  );

  // Se o usuário navegar manualmente mudando a query, refletir abertura
  useEffect(() => {
    const v = search?.get("invite");
    if (v === "new") setOpen(true);
  }, [search]);

  if (!open) return null;

  return (
    <div className="__overlay" onClick={close}>
      <ModalStyles />
      <div className="__dialog" onClick={(e) => e.stopPropagation()}>
        <div className="__hd">Novo convite</div>
        <div className="__bd text-sm">
          {/* Placeholder de conteúdo — substitua pela UI real (shadcn/ui) */}
          <p className="mb-2">
            Este é um modal preliminar apenas para validar o fluxo{" "}
            <code>?invite=new</code>.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account: <code>{accountSlug}</code></li>
            <li>Envio/aceite será validado no Preview.</li>
          </ul>
        </div>
        <div className="__ft">
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-3 py-1.5 border text-sm"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={noop}
            className="rounded-lg px-3 py-1.5 bg-black text-white text-sm"
          >
            Enviar convite (stub)
          </button>
        </div>
      </div>
    </div>
  );
}
