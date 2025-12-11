// app/a/[account]/layout.tsx
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { AccessProvider } from "@/providers/AccessProvider";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { getUserEmail } from "@/lib/auth/authAdapter";
import { Header } from "@/components/layout/Header";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ account: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const slug = (resolvedParams?.account || "").trim().toLowerCase();

  // Bypass canônico: /a/home é público (sem consulta de contexto)
  if (slug === "home") {
    return <AccessProvider value={null}>{children}</AccessProvider>;
  }

  // ── Observabilidade: timer SSR (fim-a-fim do gate) ─────────────────────────────
  const t0 = Date.now();
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;
  const route = `/a/${slug}`;

  const ctx = await getAccessContext({
    params: { account: slug },
    route,
    requestId,
  });

  const latency_ms = Date.now() - t0;

  // Log leve no SSR (o adapter já loga decisão detalhada por request)
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      scope: "access_ctx",
      event: "access_context_ssr",
      route,
      account_id: ctx?.account?.id ?? null,
      request_id: requestId,
      outcome: ctx ? "allow" : "deny",
      latency_ms,
      ts: new Date().toISOString(),
    })
  );

  if (!ctx) {
    redirect("/auth/confirm/info");
  }

  // ⚙️ Persistência da última conta (itens C6.3–C6.4)
  // Gravar cookie APENAS quando allow=true e membro ATIVO.
  // Tipos canônicos: status de conta -> 'active' | 'inactive' | 'suspended' | 'pending_setup'
  try {
    const accountStatus = ctx.account?.status;
    const memberStatus = ctx.member?.status;
    const subdomain = ctx.account?.subdomain;

    if (subdomain && accountStatus === "active" && memberStatus === "active") {
      const cookieStore = await cookies();

      cookieStore.set("last_account_subdomain", subdomain, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 90, // 90 dias
      });

      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          scope: "access_ctx",
          event: "last_account_cookie_set",
          route,
          account_subdomain: subdomain,
          request_id: requestId,
          ts: new Date().toISOString(),
        })
      );
    }
  } catch {
    // silencioso: cookie é best-effort
  }

  // Buscar email do usuário para o Header
  const userEmail = await getUserEmail();

  return (
    <AccessProvider value={ctx}>
      <Header userEmail={userEmail} />
      {children}
    </AccessProvider>
  );
}
