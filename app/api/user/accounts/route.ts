// app/api/user/accounts/route.ts
import { NextResponse } from "next/server";
import { listUserAccounts } from "@/lib/access/adapters/accountAdapter";
import { createClient } from "@/lib/supabase/server";

// Evita cache e garante execução no servidor Node.js
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    // 1) Checa sessão antes de acessar dados (401 se ausente)
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // 2) Lê a view via adapter (RLS aplicada ao usuário autenticado)
    const items = await listUserAccounts();

    // 3) Resposta padronizada para o AccountSwitcher
    return new NextResponse(
      JSON.stringify(
        items.map((i) => ({
          accountId: i.accountId,
          accountName: i.accountName,
          accountSubdomain: i.accountSubdomain,
          accountStatus: i.accountStatus,
          memberRole: i.memberRole,
          memberStatus: i.memberStatus,
        }))
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    // Log mínimo e resposta genérica (sem PII)
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: "api_user_accounts_error",
        scope: "api",
        message: err?.message ?? String(err),
        timestamp: new Date().toISOString(),
      })
    );
    return new NextResponse(JSON.stringify({ error: "failed_to_list_accounts" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
