// /middleware.ts — sessão + persistência da última conta + público pós-logout
/**
 * O que muda:
 * 1) Sempre chamamos updateSession para propagar/limpar cookies (inclui /a e /a/home).
 * 2) Em GET /a/{sub} (≠ 'home'):
 *    - se a sessão NÃO existir após updateSession → redirect para /a/home (página pública).
 *    - se a sessão existir → mantém fluxo e grava last_account_subdomain no response.
 * 3) Em /a e /a/home não fazemos redirect por cookie — SSR decide (cookie/fallback).
 */
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isGet = request.method === "GET";

  // 1) Atualiza/propaga a sessão para TODAS as rotas
  const res = await updateSession(request);

  // Helper: sessão válida após updateSession? (olhar cookies que o próprio res define)
  const responseCookies = res.cookies.getAll();
  const hasAccess = responseCookies.some(
    (c) => c.name.startsWith("sb-") && c.value && c.name.includes("access")
  );
  const hasRefresh = responseCookies.some(
    (c) => c.name.startsWith("sb-") && c.value && c.name.includes("refresh")
  );
  const isLoggedIn = hasAccess || hasRefresh;

  // 2) Em /a/{sub} (≠ 'home'): decidir público vs persistir preferência
  if (
    isGet &&
    pathname.startsWith("/a/") &&
    pathname !== "/a/home" &&
    pathname !== "/a/home/"
  ) {
    const sub = pathname.split("/")[2] ?? "";

    // 2.1 Sem sessão -> página pública (/a/home)
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/a/home";
      const redirect = NextResponse.redirect(url);
      // propaga cookies de updateSession na resposta de redirect
      responseCookies.forEach((c) => redirect.cookies.set(c));
      return redirect;
    }

    // 2.2 Com sessão -> manter fluxo e persistir preferência
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
  if (
    pathname === "/a" ||
    pathname === "/a/" ||
    pathname === "/a/home" ||
    pathname === "/a/home/"
  ) {
    return res;
  }

  // 4) Outras rotas → resposta já contém cookies atualizados
  return res;
}

export const config = {
  matcher: [
    // exclui estáticos
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
