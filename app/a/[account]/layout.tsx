// app/a/[account]/layout.tsx
import { redirect } from "next/navigation";
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

  // Gate SSR: usa orquestrador (que chama o adapter -> v_access_context)
  const ctx = await getAccessContext({
    params: { account: slug },
    route: `/a/${slug}`,
  });

  // Fallback seguro (MVP): negar acesso redireciona para /auth/confirm
  if (!ctx) {
    redirect("/auth/confirm");
  }

  // Contexto válido injeta no provider
  return <AccessProvider value={ctx}>{children}</AccessProvider>;
}
