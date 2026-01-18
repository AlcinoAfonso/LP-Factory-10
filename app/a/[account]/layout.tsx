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
    // Se o usuário estiver autenticado, evita loop com cookie de "última conta"
    // e manda para /a/home pedindo limpeza do cookie no middleware.
    let userEmail: string | null = null;
    try {
      userEmail = await getUserEmail();
    } catch {
      userEmail = null;
    }

    if (userEmail) {
      redirect("/a/home?clear_last=1");
    }

    redirect("/auth/confirm/info");
  }

  // ⚙️ Persistência da última conta (itens C6.3–C6.4)
  // Gravar cookie sempre que allow=true e houver subdomain canônico.
  // Obs: o gate (getAccessContext) já garante que ctx != null significa allow.
  try {
    const subdomain = ctx.account?.subdomain;

    if (subdomain) {
      const cookieStore = await cookies();
      const isProd = process.env.NODE_ENV === "production";

      cookieStore.set("last_account_subdomain", subdomain, {
        httpOnly: true,
        secure: isProd,
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
