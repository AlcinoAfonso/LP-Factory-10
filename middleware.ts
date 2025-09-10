// /middleware.ts (raiz) — Variante sem rota /onboarding/new
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname === "/a") {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const url = request.nextUrl.clone();

    if (!user) {
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    const { data: memberships } = await supabase
      .from("account_users")
      .select("account_id, status")
      .eq("user_id", user.id)
      .limit(50);

    const target =
      memberships?.find((m: any) => m.status === "active") || null;

    if (!target) {
      // Sem membership ativo → leva para a raiz (deixa UI decidir)
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    const { data: acc } = await supabase
      .from("accounts")
      .select("subdomain")
      .eq("id", target.account_id)
      .maybeSingle();

    url.pathname = acc?.subdomain ? `/a/${acc.subdomain}` : "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!auth/|api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
