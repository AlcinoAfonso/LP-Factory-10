import { NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // sucesso: sessão criada via cookies -> manda para seleção de conta
  return NextResponse.redirect(`${origin}/select-account`);
}
