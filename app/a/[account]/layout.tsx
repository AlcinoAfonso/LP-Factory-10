// app/a/[account]/layout.tsx
export const revalidate = 0;

// use caminho com alias "@/..." se seu tsconfig estiver configurado.
// Caso não, use: "../../../src/lib/access/getAccessContext"
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

    // Guard: permitir apenas membro active|trial (Bússola)
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

    if (!isValid) {
      return notFound();
    }

    return <AccessProvider value={ctx}>{children}</AccessProvider>;
  } catch (e) {
    // Mapeamento de erros tipados para UX padrão (sem redirects legados)
    if (e instanceof AccessError) {
      if (e.code === "UNRESOLVED_TENANT") return notFound();
      if (e.code === "INACTIVE_MEMBER" || e.code === "FORBIDDEN_ACCOUNT") {
        return notFound();
      }
    }
    return notFound();
  }
}
