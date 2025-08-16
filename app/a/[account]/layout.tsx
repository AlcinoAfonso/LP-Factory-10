// app/a/[account]/layout.tsx
export const revalidate = 0;

import { getAccessContext } from "@/src/lib/access/getAccessContext";
import { AccessProvider } from "@/src/providers/AccessProvider";
import { AccessError } from "@/src/lib/access/types";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { account: string };
}) {
  try {
    const ctx = await getAccessContext({ params });

    // Sem sessão/ctx → visitante: deixa renderizar (popup de login virá na page)
    if (!ctx) {
      return <AccessProvider value={null}>{children}</AccessProvider>;
    }

    // Com sessão: só permite member active
    const status = (ctx as any)?.member?.status as
      | "active"
      | "inactive"
      | "pending"
      | "revoked"
      | undefined;

    const hasAccount = Boolean((ctx as any)?.account);
    const hasMember = Boolean((ctx as any)?.member);
    const isValid = hasAccount && hasMember && status === "active";

    if (!isValid) return notFound();

    return <AccessProvider value={ctx}>{children}</AccessProvider>;
  } catch (e) {
    if (e instanceof AccessError) {
      // Qualquer erro tipado vira 404 (sem redirects legados)
      return notFound();
    }
    return notFound();
  }
}
