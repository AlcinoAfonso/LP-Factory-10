// src/app/admin/tokens/page.tsx
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { tokens, checkSuperAdmin } from "@/lib/admin/adapters/adminAdapter";

// Impede cache agressivo para lista sempre atualizada
export const dynamic = "force-dynamic";

// ---- Server Actions (devem ficar no server) ----
async function requireSuper() {
  const { isSuper } = await checkSuperAdmin();
  if (!isSuper) {
    // Redireciona para o gate padrão (ajuste se seu app usar outra rota)
    redirect("/auth/confirm/info");
  }
}

export async function generateAction(formData: FormData) {
  "use server";
  await requireSuper();

  const email = String(formData.get("email") || "").trim();
  const contractRef = String(formData.get("contractRef") || "").trim() || undefined;

  if (!email || !email.includes("@")) {
    // Em SSR simples, podemos apenas abortar silenciosamente; logs vêm dos adapters no Passo 5
    return;
  }

  await tokens.generate(email, contractRef);
  revalidatePath("/admin/tokens");
}

export async function revokeAction(formData: FormData) {
  "use server";
  await requireSuper();

  const tokenId = String(formData.get("tokenId") || "");
  if (!tokenId) return;

  await tokens.revoke(tokenId);
  revalidatePath("/admin/tokens");
}

// ---- Página SSR ----
export default async function AdminTokensPage() {
  await requireSuper(); // Gate de autorização SSR

  const list = await tokens.list(); // Lê via service client dentro do adapter (server-only)

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Admin • Tokens</h1>
        <p className="text-sm text-gray-600">
          Gere, liste e revogue tokens de pós-venda. (Fluxo QA: C1–C5)
        </p>
      </header>

      {/* Formulário: Gerar Token (C1) */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Gerar novo token</h2>
        <form action={generateAction} className="flex flex-wrap gap-2 items-center">
          <input
            name="email"
            type="email"
            placeholder="E-mail do cliente"
            required
            className="border rounded px-3 py-2 w-72"
          />
          <input
            name="contractRef"
            type="text"
            placeholder="Referência do contrato (opcional)"
            className="border rounded px-3 py-2 w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            Gerar Token
          </button>
        </form>
      </section>

      {/* Lista de Tokens */}
      <section className="space-y-3">
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
                      <form action={revokeAction} className="inline-block">
                        <input type="hidden" name="tokenId" value={t.token_id} />
                        <button
                          type="submit"
                          className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40"
                          disabled={t.is_used}
                          title={t.is_used ? "Token já utilizado" : "Revogar token"}
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

