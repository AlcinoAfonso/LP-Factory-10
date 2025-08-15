export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { admin } from "@/src/lib/supabase/admin";
import { getAccessContext } from "@/src/lib/access/getAccessContext";

type Body = { email: string; role: "admin" | "editor" | "viewer" };

export async function POST(req: Request) {
  try {
    // usuário autenticado
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
    if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

    // resolve conta (slug vem da query)
    const url = new URL(req.url);
    const slug = url.searchParams.get("account") || "";
    const ctx = await getAccessContext({ params: { account: slug } });
    if (ctx.role !== "owner" && ctx.role !== "admin")
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    const { email, role } = (await req.json()) as Body;

    const svc = admin();

    // 1) cria/manda convite (retorna user com id)
    const invited = await svc.auth.admin.inviteUserByEmail(email);
    if (invited.error) throw invited.error;
    const invitedId = invited.data.user?.id;
    if (!invitedId) throw new Error("invite returned no user id");

    // 2) cria/atualiza vínculo como "pending" já com user_id
    const up = await svc.from("account_users").upsert({
      account_id: ctx.account_id,
      user_id: invitedId,
      role,
      status: "pending",
    });
    if (up.error) throw up.error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "error" }, { status: 500 });
  }
}
