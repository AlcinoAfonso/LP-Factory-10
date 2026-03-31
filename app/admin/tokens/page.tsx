import React from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { adminTokens, checkSuperAdmin, checkPlatformAdmin } from "@/lib/admin";
import { requireAdminSectionAccess } from "../_server/section-guard";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

/** ==== Helpers (inline) ==== */
async function getActorContext() {
  const h = await headers();
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
  await requireAdminSectionAccess();
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
    await adminTokens.generate(email, contractRefRaw, undefined, {
      actor_id,
      actor_role,
      ip,
      t0,
    });
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

export default async function AdminTokensPage(props: any) {
  const searchParams = props.searchParams as SearchParams | undefined;

  await requirePlatform();

  const used =
    typeof searchParams?.used === "string"
      ? searchParams.used === "true"
      : undefined;

  const expired =
    typeof searchParams?.expired === "string"
      ? searchParams.expired === "true"
      : undefined;

  const [list, stats] = await Promise.all([
    adminTokens.list({ used, expired }),
    adminTokens.getStats(),
  ]);

  return (
    <div className="space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin • Tokens</h1>
        <p className="text-sm text-muted-foreground">
          Gere, liste e revogue tokens de pós-venda (Fluxo QA: C1–C5).
        </p>
      </header>

      {/* Resumo / Métricas */}
      <section aria-label="Resumo" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-white p-3 shadow-card">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-border bg-white p-3 shadow-card">
          <div className="text-xs text-muted-foreground">Válidos</div>
          <div className="text-xl font-semibold">{stats.valid}</div>
        </div>
        <div className="rounded-xl border border-border bg-white p-3 shadow-card">
          <div className="text-xs text-muted-foreground">Expirados</div>
          <div className="text-xl font-semibold">{stats.expired}</div>
        </div>
        <div className="rounded-xl border border-border bg-white p-3 shadow-card">
          <div className="text-xs text-muted-foreground">Usados</div>
          <div className="text-xl font-semibold">{stats.used}</div>
        </div>
      </section>

      {/* Gerar */}
      <section className="space-y-3" aria-label="Gerar token">
        <h2 className="text-lg font-medium">Gerar novo token</h2>
        <form action={generateAction} method="post" className="flex flex-wrap gap-2 items-end">
          <div className="w-72 space-y-1">
            <Label htmlFor="email">E-mail do cliente</Label>
            <Input id="email" name="email" type="email" placeholder="E-mail do cliente" required aria-label="E-mail do cliente" />
          </div>
          <div className="w-64 space-y-1">
            <Label htmlFor="contractRef">Referência do contrato</Label>
            <Input id="contractRef" name="contractRef" type="text" placeholder="Referência do contrato" required aria-label="Referência do contrato" />
          </div>
          <Button type="submit" aria-label="Gerar token">Gerar Token</Button>
        </form>
      </section>

      {/* Filtros */}
      <section className="space-y-3" aria-label="Filtros">
        <h2 className="text-lg font-medium">Filtros</h2>
        <form method="get" className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor="used">Usado</Label>
            <Select
              id="used"
              name="used"
              defaultValue={used === undefined ? "" : used ? "true" : "false"}
              aria-label="Filtrar por usado"
            >
              <option value="">—</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="expired">Expirado</Label>
            <Select
              id="expired"
              name="expired"
              defaultValue={expired === undefined ? "" : expired ? "true" : "false"}
              aria-label="Filtrar por expirado"
            >
              <option value="">—</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </div>
          <Button type="submit" className="border border-border bg-background text-foreground hover:bg-accent" aria-label="Aplicar filtros">
            Aplicar
          </Button>
        </form>
      </section>

      {/* Lista */}
      <section className="space-y-3" aria-label="Tokens gerados">
        <h2 className="text-lg font-medium">Tokens gerados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full overflow-hidden rounded-xl border border-border bg-white text-sm">
            <thead>
              <tr className="bg-accent/40">
                <th className="border-b border-border p-2 text-left">Email</th>
                <th className="border-b border-border p-2 text-left">Status</th>
                <th className="border-b border-border p-2 text-left">Expira</th>
                <th className="border-b border-border p-2 text-left">Conta</th>
                <th className="border-b border-border p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const status = t.is_used ? "Usado" : t.is_valid ? "Ativo" : "Expirado";
                const isActive = t.is_valid && !t.is_used;
                return (
                  <tr key={t.token_id} className="border-b border-border">
                    <td className="p-2">{t.email}</td>
                    <td className="p-2">{status}</td>
                    <td className="p-2">{t.expires_at ?? "—"}</td>
                    <td className="p-2">{t.account_slug ?? "—"}</td>
                    <td className="p-2 text-right space-x-2">
                      <CopyLinkButton tokenId={t.token_id} isActive={isActive} />
                      <form action={revokeAction} method="post" className="inline-block">
                        <input type="hidden" name="tokenId" value={t.token_id} />
                        <Button
                          type="submit"
                          className="h-auto border border-border bg-background px-3 py-1 text-foreground hover:bg-accent disabled:opacity-40"
                          disabled={t.is_used}
                          title={t.is_used ? "Token já utilizado" : "Revogar token"}
                          aria-label={`Revogar token ${t.token_id}`}
                        >
                          Revogar
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={5}>
                    <EmptyState
                      title="Nenhum token encontrado"
                      description="Ajuste os filtros ou gere um novo token para começar."
                    />
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
