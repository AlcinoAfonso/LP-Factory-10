// app/admin/tokens/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { adminTokens, checkSuperAdmin, checkPlatformAdmin } from "@/lib/admin";
import { requirePlatformAdmin } from "@/lib/access/guards";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";

export const dynamic = "force-dynamic";

/** ==== Helpers (inline) ==== */
async function getActorContext() {
  const h = headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let actor_role: "super_admin" | "platform_admin" | "user" = "user";
  const superInfo = await checkSuperAdmin();
  if (superInfo.isSuper) {
    actor_role = "super_admin";
  } else {
    const platInfo = await checkPlatformAdmin();
    if (platInfo.isPlatform) actor_role = "platform_admin";
  }

  return { actor_id: user?.id ?? null, actor_role, ip };
}

function now() {
  return typeof globalThis.performance?.now === "function"
    ? globalThis.performance.now()
    : Date.now();
}

/** ==== Guards (SSR) ==== */
async function requirePlatform() {
  const { allowed, redirect: redirectTo } = await requirePlatformAdmin();
  if (!allowed) redirect(redirectTo ?? "/auth/confirm/info");
}

/** ==== Server Actions ==== */
async function generateAction(formData: FormData) {
  "use server";
  const t0 = now();
  try {
    await requirePlatform();
    const { actor_id, actor_role, ip } = await getActorContext();

    const rawEmail = String(formData.get("email") || "");
    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      console.error(
        JSON.stringify({
          event: "token_generate_error",
          scope: "admin",
          error: "invalid_email",
          email,
          actor_id,
          actor_role,
          ip,
          latency_ms: Math.round(now() - t0),
          timestamp: new Date().toISOString(),
        })
      );
      redirect("/admin/tokens");
    }

    const contractRefRaw = String(formData.get("contractRef") || "").trim();
    if (!contractRefRaw) {
      console.error(
        JSON.stringify({
          event: "token_generate_error",
          scope: "admin",
          error: "missing_contract_ref",
          email,
          actor_id,
          actor_role,
          ip,
          latency_ms: Math.round(now() - t0),
          timestamp: new Date().toISOString(),
        })
      );
      redirect("/admin/tokens");
    }

    // Adapter já emite log token_generated ou token_generate_error
    await adminTokens.generate(
      email,
      contractRefRaw,
      undefined,
      { actor_id, actor_role, ip, t0 }
    );
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "token_generate_error",
        scope: "admin",
        error: (e as Error)?.message ?? String(e),
        latency_ms: Math.round(now() - t0),
        timestamp: new Date().toISOString(),
      })
    );
  } finally {
    revalidatePath("/admin/tokens");
    redirect("/admin/tokens");
  }
}

async function revokeAction(formData: FormData) {
  "use server";
  const t0 = now();
  try {
    await requirePlatform();
    const { actor_id, actor_role, ip } = await getActorContext();

    const token_id = String(formData.get("tokenId") || "").trim();
    if (!token_id) {
      console.error(
        JSON.stringify({
          event: "token_revoke_failed",
          scope: "admin",
          error: "missing_token_id",
          actor_id,
          actor_role,
          ip,
          latency_ms: Math.round(now() - t0),
          timestamp: new Date().toISOString(),
        })
      );
      redirect("/admin/tokens");
    }

    const ok = await adminTokens.revoke(token_id);

    console.error(
      JSON.stringify({
        event: ok ? "token_revoked" : "token_revoke_failed",
        scope: "admin",
        token_id,
        actor_id,
        actor_role,
        ip,
        latency_ms: Math.round(now() - t0),
        timestamp: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "token_revoke_failed",
        scope: "admin",
        error: (e as Error)?.message ?? String(e),
        latency_ms: Math.round(now() - t0),
        timestamp: new Date().toISOString(),
      })
    );
  } finally {
    revalidatePath("/admin/tokens");
    redirect("/admin/tokens");
  }
}

/** ==== Page (SSR) ==== */
type SearchParams = { used?: "true" | "false"; expired?: "true" | "false" };

export default async function AdminTokensPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  await requirePlatform();

  const used =
    typeof searchParams?.used === "string"
      ? searchParams!.used === "true"
      : undefined;

  const expired =
    typeof searchParams?.expired === "string"
      ? searchParams!.expired === "true"
      : undefined;

  const [list, stats] = await Promise.all([
    adminTokens.list({ used, expired }),
    adminTokens.getStats(),
  ]);

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin • Tokens</h1>
        <p className="text-sm text-gray-600">
          Gere, liste e revogue tokens de pós-venda (Fluxo QA: C1–C5).
        </p>
      </header>

      {/* Resumo / Métricas */}
      <section aria-label="Resumo" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border p-3">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="text-xs text-gray-500">Válidos</div>
          <div className="text-xl font-semibold">{stats.valid}</div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="text-xs text-gray-500">Expirados</div>
          <div className="text-xl font-semibold">{stats.expired}</div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="text-xs text-gray-500">Usados</div>
          <div className="text-xl font-semibold">{stats.used}</div>
        </div>
      </section>

      {/* Gerar */}
      <section className="space-y-3" aria-label="Gerar token">
        <h2 className="text-lg font-medium">Gerar novo token</h2>
        <form action={generateAction} method="post" className="flex flex-wrap gap-2 items-center">
          <input
            name="email"
            type="email"
            placeholder="E-mail do cliente"
            required
            className="border rounded px-3 py-2 w-72"
            aria-label="E-mail do cliente"
          />
          <input
            name="contractRef"
            type="text"
            placeholder="Referência do contrato"
            required
            className="border rounded px-3 py-2 w-64"
            aria-label="Referência do contrato"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            aria-label="Gerar token"
          >
            Gerar Token
          </button>
        </form>
      </section>

      {/* Filtros */}
      <section className="space-y-3" aria-label="Filtros">
        <h2 className="text-lg font-medium">Filtros</h2>
        <form method="get" className="flex flex-wrap gap-2 items-center">
          <label className="text-sm">
            Usado:
            <select
              name="used"
              defaultValue={used === undefined ? "" : used ? "true" : "false"}
              className="ml-2 border rounded px-2 py-1"
              aria-label="Filtrar por usado"
            >
              <option value="">—</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </label>
          <label className="text-sm">
            Expirado:
            <select
              name="expired"
              defaultValue={expired === undefined ? "" : expired ? "true" : "false"}
              className="ml-2 border rounded px-2 py-1"
              aria-label="Filtrar por expirado"
            >
              <option value="">—</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </label>
          <button type="submit" className="px-3 py-1 rounded border hover:bg-gray-50" aria-label="Aplicar filtros">
            Aplicar
          </button>
        </form>
      </section>

      {/* Lista */}
      <section className="space-y-3" aria-label="Tokens gerados">
        <h2 className="text-lg font-medium">Tokens gerados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 border-b">Email</th>
                <th className="text-left p-2 border-b">Status</th>
                <th className="text-left p-2 border-b">Expira</th>
                <th className="text-left p-2 border-b">Conta</th>
                <th className="text-right p-2 border-b">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const status = t.is_used ? "Usado" : t.is_valid ? "Ativo" : "Expirado";
                const isActive = t.is_valid && !t.is_used;
                return (
                  <tr key={t.token_id} className="border-b">
                    <td className="p-2">{t.email}</td>
                    <td className="p-2">{status}</td>
                    <td className="p-2">{t.expires_at ?? "—"}</td>
                    <td className="p-2">{t.account_slug ?? "—"}</td>
                    <td className="p-2 text-right space-x-2">
                      <CopyLinkButton tokenId={t.token_id} isActive={isActive} />
                      <form action={revokeAction} method="post" className="inline-block">
                        <input type="hidden" name="tokenId" value={t.token_id} />
                        <button
                          type="submit"
                          className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40"
                          disabled={t.is_used}
                          title={t.is_used ? "Token já utilizado" : "Revogar token"}
                          aria-label={`Revogar token ${t.token_id}`}
                        >
                          Revogar
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={5}>
                    Nenhum token encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
