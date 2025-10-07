// app/admin/tokens/page.tsx
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

async function generateAction(formData: FormData) {
  "use server";
  try {
    await requireSuper();

    const email = String(formData.get("email") || "").trim();
    const contractRef = String(formData.get("contractRef") || "").trim() || undefined;

    if (!email || !email.includes("@")) {
      return;
    }

    await tokens.generate(email, contractRef);
    console.error("[admin/tokens] token_generated:", { email, contractRef }); // log server
    revalidatePath("/admin/tokens");
  } catch (e) {
    console.error("[admin/tokens] generateAction error:", e);
  }
}

async function revokeAction(formData: FormData) {
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
        <h2 class
