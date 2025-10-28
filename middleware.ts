// /middleware.ts — sessão + persistência da última conta + público pós-logout
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Atualiza/propaga a sessão para TODAS as rotas
  const res = await updateSession(request);

  const isGet = request.method === "GET";
  const hasSupabaseSession = request.cookies.getAll().some(c => c.name.startsWith("sb-"));

  // 2) Em /a/{sub} (≠ 'home'):
  if (isGet && pathname.startsWith("/a/") && pathname !== "/a/home" && pathname !== "/a/home/") {
    const sub = pathname.split("/")[2] ?? "";

    // 2.1 Sem sessão → vai para página pública (/a/home)
    if (!hasSupabaseSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/a/home";
      const redirect = NextResponse.redirect(url);
      // propaga cookies de updateSession (ex.: limpeza dos sb-*)
      res.cookies.getAll().forEach(c => redirect.cookies.set(c));
      return redirect;
    }

    // 2.2 Com sessão → mantém fluxo e persiste preferência
    if (sub && sub !== "home") {
      const isProd = process.env.NODE_ENV === "production";
      res.cookies.set("last_account_subdomain", sub, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        secure: isProd,
      });
    }
    return res;
  }

  // 3) /a e /a/home → SSR decide (cookie/fallback público)
  if (pathname === "/a" || pathname === "/a/" || pathname === "/a/home" || pathname === "/a/home/") {
    return res;
  }

  // 4) Outras rotas → resposta já contém cookies atualizados
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
