// app/api/user/accounts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "unauthorized" }, {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      });
    }

    // ✅ Lê a view segura com RLS/allow=true (derivada do Access Context v2)
    const { data, error } = await supabase
      .from("v_user_accounts_list")
      .select("account_id,account_name,account_subdomain,account_status,member_role,member_status,created_at")
      .order("account_status", { ascending: false })
      .order("created_at", { ascending: false })
      .order("account_name", { ascending: true });

    if (error) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ event: "api_user_accounts_select_error", scope: "api", error: error.message }));
      return NextResponse.json({ error: "failed_to_list_accounts" }, {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      });
    }

    // 🔁 Normaliza nomes para o AccountSwitcher (camelCase + preserva 'trial')
    const rows = (data ?? []).map((i) => ({
      accountId: i.account_id,
      accountName: i.account_name ?? null,
      accountSubdomain: i.account_subdomain,
      accountStatus: String(i.account_status),
      memberRole: i.member_role,
      memberStatus: i.member_status,
      createdAt: i.created_at,
    }));

    return NextResponse.json(rows, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ event: "api_user_accounts_unhandled", scope: "api", msg: err?.message ?? String(err) }));
    return NextResponse.json({ error: "failed_to_list_accounts" }, {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
