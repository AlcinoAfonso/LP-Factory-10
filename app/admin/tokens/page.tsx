// app/admin/tokens/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { tokens, checkSuperAdmin } from "@/lib/admin/adapters/adminAdapter";
// fallback direto na VIEW (server-only)
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** ==== Guards (SSR) ==== */
async function requireSuper() {
  const { isSuper } = await checkSuperAdmin();
  if (!isSuper) redirect("/auth/confirm/info");
}

/** ==== Server Actions ==== */
async function generateAction(formData: FormData) {
  "use server";
  try {
    await requireSuper();
    const rawEmail = String(formData.get("email") || "");
    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      console.error(JSON.stringify({
        event: "token_generate_error",
        scope: "admin",
        error: "invalid_email",
        email,
        timestamp: new Date().toISOString(),
      }));
      redirect("/admin/tokens");
    }

    const contractRefRaw = String(formData.get("contractRef") || "").trim();
    const contractRef = contractRefRaw || undefined;

    const token = await tokens.generate(email, contractRef);
    console.error(JSON.stringify({
      event: "token_generated",
      scope: "admin",
      email,
      contract_ref: contractRef ?? null,
      token_id: token?.id ?? null,
      timestamp: new Date().toISOString(),
    }));
  } catch (e) {
    console.error(JSON.stringify({
      event: "token_generate_error",
      scope: "admin",
      error: (e as Error)?.message ?? String(e),
      timestamp: new Date().toISOString(),
    }));
  } finally {
    revalidatePath("/admin/tokens");
    redirect("/admin/tokens");
  }
}

async function revokeAction(formData: FormData) {
  "use server";
  try {
    await requireSuper();
    const tokenId = String(formData.get("tokenId") || "").trim();
    if (!tokenId) {
      console.error(JSON.stringify({
        event: "token_revoke_failed",
        scope: "admin",
        error: "missing_token_id",
        timestamp: new Date().toISOString(),
      }));
      redirect("/admin/tokens");
    }
    const ok = await tokens.revoke(tokenId);
    console.error(JSON.stringify({
      event: ok ? "token_revoked" : "token_revoke_failed",
      scope: "admin",
      token_id: tokenId,
      timestamp: new Date().toISOString(),
    }));
  } catch (e) {
    console.error(JSON.stringify({
      event: "token_revoke_failed",
      scope: "admin",
      error: (e as Error)?.message ?? String(e),
      timestamp: new Date().toISOString(),
    }));
  } finally {
    revalidatePath("/admin/tokens");
    redirect("/admin/tokens");
  }
}

/** ==== Tipos locais do fallback ==== */
type FallbackRow = {
  token_id: string;
  email: string;
  expires_at: string | null;
  is_used: boolean;
  is_valid: boolean;
  account_slug: string | null;
  created_at: string;
};

/** ==== Page (SSR) ==== */
type SearchParams = { used?: "true" | "false"; expired?: "true" | "false" };

export default async function AdminTokensPage({
  searchParams,
}: { searchParams?: SearchParams }) {
  await requireSuper();

  const used = typeof searchParams?.used === "string"
    ? searchParams!.used === "true" : undefined;

  const expired = typeof searchParams?.expired === "string"
    ? searchParams!.expired === "true" : undefined;

  // 1) Tenta via adapter
  const [listViaAdapter, statsViaAdapter] = await Promise.all([
    tokens.list({ used, expired }),
    tokens.getStats(),
  ]);

  let list = listViaAdapter;
  let stats = statsViaAdapter;

  // 2) Fallback: se o adapter devolver vazio, consulta direto a VIEW com service client
  if (!listViaAdapter || listViaAdapter.length === 0) {
    try {
      const svc = await createServiceClient();
      let q = svc
        .from("v_admin_tokens_with_usage")
        .select("*")
        .order("created_at", { ascending: false });

      if (used !== undefined) q = q.eq("is_used", used);
      if (expired !== undefined) q = q.eq("is_valid", !expired);

      const { data: rows, error } = await q;
      if (error) {
        console.error(JSON.stringify({
          event: "adapter_error",
          scope: "admin.tokens.fallback_list",
          error: error.message,
          timestamp: new Date().toISOString(),
        }));
      } else {
        const data = (rows ?? []) as FallbackRow[];
        list = data.map((r) => ({
          token_id: r.token_id,
          email: r.email,
          expires_at: r.expires_at ?? undefined,
          used_at: undefined,
          used_by: undefined,
          account_id: undefined,
          account_slug: r.account_slug ?? undefined,
          acc_status: undefined,
          is_used: r.is_used,
          is_valid: r.is_valid,
          created_at: r.created_at,
        }));
        // stats coerentes com a mesma fonte
        const total = data.length;
        const usedCt = data.filter((r) => r.is_used).length;
        const validCt = data.filter((r) => !r.is_used && r.is_valid).length;
        const expiredCt = total - usedCt - validCt;
        stats = { total, used: usedCt, valid: validCt, expired: expiredCt };
      }
    } catch (e) {
      console.error(JSON.stringify({
        event: "adapter_error",
        scope: "admin.tokens.fallback_exec",
        error: (e as Error)?.message ?? String(e),
        timestamp: new Date().toISOString(),
      }));
    }
  }

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
        <div className="rounded-xl border p-3"><div className="text-xs text-gray-500">Total</div><div className="text-xl font-semibold">{stats.total}</div></div>
        <div className="rounded-xl border p-3"><div className="text-xs text-gray-500">Válidos</div><div className="text-xl font-semibold">{stats.valid}</div></div>
        <div className="rounded-xl border p-3"><div className="text-xs text-gray-500">Expirados</div><div className="text-xl font-semibold">{stats.expired}</div></div>
        <div className="rounded-xl border p-3"><div className="text-xs text-gray-500">Usados</div><div className="text-xl font-semibold">{stats.used}</div></div>
      </section>

      {/* Gerar */}
      <section className="space-y-3" aria-label="Gerar token">
        <h2 className="text-lg font-medium">Gerar novo token</h2>
        <form action={generateAction} method="post" className="flex flex-wrap gap-2 items-center">
          <input name="email" type="email" placeholder="E-mail do cliente" required className="border rounded px-3 py-2 w-72" aria-label="E-mail do cliente" />
          <input name="contractRef" type="text" placeholder="Referência do contrato (opcional)" className="border rounded px-3 py-2 w-64" aria-label="Referência do contrato" />
          <button type="submit" className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" aria-label="Gerar token">Gerar Token</button>
        </form>
      </section>

      {/* Filtros */}
      <section className="space-y-3" aria-label="Filtros">
        <h2 className="text-lg font-medium">Filtros</h2>
        <form method="get" className="flex flex-wrap gap-2 items-center">
          <label className="text-sm">Usado:
            <select name="used" defaultValue={used === undefined ? "" : used ? "true" : "false"} className="ml-2 border rounded px-2 py-1" aria-label="Filtrar por usado">
              <option value="">—</option><option value="true">Sim</option><option value="false">Não</option>
            </select>
          </label>
          <label className="text-sm">Expirado:
            <select name="expired" defaultValue={expired === undefined ? "" : expired ? "true" : "false"} className="ml-2 border rounded px-2 py-1" aria-label="Filtrar por expirado">
              <option value="">—</option><option value="true">Sim</option><option value="false">Não</option>
            </select>
          </label>
          <button type="submit" className="px-3 py-1 rounded border hover:bg-gray-50" aria-label="Aplicar filtros">Aplicar</button>
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
                return (
                  <tr key={t.token_id} className="border-b">
                    <td className="p-2">{t.email}</td>
                    <td className="p-2">{status}</td>
                    <td className="p-2">{t.expires_at ?? "—"}</td>
                    <td className="p-2">{t.account_slug ?? "—"}</td>
                    <td className="p-2 text-right">
                      <form action={revokeAction} method="post" className="inline-block">
                        <input type="hidden" name="tokenId" value={t.token_id} />
                        <button type="submit" className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40" disabled={t.is_used} title={t.is_used ? "Token já utilizado" : "Revogar token"} aria-label={`Revogar token ${t.token_id}`}>
                          Revogar
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={5}>Nenhum token encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
