import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { admin } from "@/src/lib/supabase/admin";

export default function NewAccountPage() {
  return (
    <form action={createAccountAction} className="p-6 space-y-3 max-w-md">
      <h1 className="text-xl font-semibold">Criar conta</h1>
      <input name="name" placeholder="Nome da conta" className="border p-2 w-full" required />
      <input name="subdomain" placeholder="Slug (ex: acme)" className="border p-2 w-full" required />
      <button className="border px-4 py-2 rounded">Criar</button>
    </form>
  );
}

async function createAccountAction(formData: FormData) {
  "use server";

  // sessão atual (Magic Link)
  const cookieStore = cookies();
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get: (k) => cookieStore.get(k)?.value,
        set() {},
        remove() {},
      },
    }
  );
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/select-account");

  const name = String(formData.get("name") || "").trim();
  const subdomain = String(formData.get("subdomain") || "").trim().toLowerCase();

  const svc = admin();

  // 1) pega um plano existente (ajuste depois para UI de planos)
  const { data: plan } = await svc.from("plans").select("id").limit(1).single();

  // 2) cria conta
  const { data: acc, error: accErr } = await svc
    .from("accounts")
    .insert({
      name,
      subdomain,
      domain: null,
      owner_user_id: user.id,
      plan_id: plan?.id ?? null,
      status: "active",
    })
    .select("id, subdomain")
    .single();
  if (accErr) throw accErr;

  // 3) garante vínculo de owner ativo (RLS)
  await svc.from("account_users").upsert({
    account_id: acc.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  });

  redirect(`/a/${acc.subdomain}`);
}
