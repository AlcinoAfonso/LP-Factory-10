// app/a/[account]/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AccessProvider } from "@/providers/AccessProvider";
import { getAccessContext } from "@/lib/access/getAccessContext";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { account: string };
}) {
  const slug = (params?.account || "").trim().toLowerCase();

  // Bypass canônico: /a/home é público (sem consulta de contexto)
  if (slug === "home") {
    return <AccessProvider value={null}>{children}</AccessProvider>;
  }

  // ── Observabilidade: timer SSR (fim-a-fim do gate) ─────────────────────────────
  const t0 = Date.now();
  const hdrs = headers();
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
      request_id: requestId,
      outcome: ctx ? "allow" : "deny",
      latency_ms,
      ts: new Date().toISOString(),
    })
  );

  if (!ctx) {
    redirect("/auth/confirm/info");
  }

  return <AccessProvider value={ctx}>{children}</AccessProvider>;
}
