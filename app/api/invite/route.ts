export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { admin } from "@/src/lib/supabase/admin";
import { getAccessContext } from "@/src/lib/access/getAccessContext";
import { AccessError } from "@/src/lib/access/types";

type Body = { email: string; role: "admin" | "editor" | "viewer" };

export async function POST(req: Request) {
  try {
    // 1) usuário autenticado
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

    // 2) resolver conta (slug) e validar papel
    const url = new URL(req.url);
    const slug = url.searchParams.get("account") || "";

    let ctx: Awaited<ReturnType<typeof getAccessContext>> | null = null;
    try {
      ctx = await getAccessContext({ params: { account: slug } });
    } catch (err) {
      if (err instanceof AccessError) {
        return NextResponse.json({ ok: false, error: err.code }, { status: 403 });
      }
      throw err;
    }

    if (!ctx || (ctx.role !== "owner" && ctx.role !== "admin")) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    // 3) payload
    const { email, role } = (await req.json()) as Body;
    if (!email || !role) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    // 4) convite + vínculo pending (server-only secret)
    const svc = admin();

    const invited = await svc.auth.admin.inviteUserByEmail(email);
    if (invited.error) throw invited.error;

    const invitedId = invited.data.user?.id;
    if (!invitedId) {
      return NextResponse.json({ ok: false, error: "invite_failed" }, { status: 500 });
    }

    const up = await svc.from("account_users").upsert({
      account_id: ctx.account_id,
      user_id: invitedId,
      role,
      status: "pending",
    });
    if (up.error) throw up.error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
