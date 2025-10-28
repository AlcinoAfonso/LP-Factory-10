// /middleware.ts — sessão + persistência da última conta (sem redirect em /a)
/**
 * Ajustes:
 * 1) Sempre chamamos updateSession (inclui /a e /a/home) para propagar cookies da sessão.
 * 2) Removido redirect por cookie em /a e /a/home — delegamos ao SSR (/a/home) decidir.
 * 3) Persistimos o cookie apenas quando o usuário acessa /a/{subdomain} (≠ 'home').
 */
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Atualiza/propaga a sessão para TODAS as rotas (inclui /a e /a/home)
  const res = await updateSession(request);

  // 2) Em /a/{subdomain} (exceto 'home'), gravar cookie e manter fluxo normal
  if (
    request.method === "GET" &&
    pathname.startsWith("/a/") &&
    pathname !== "/a/home" &&
    pathname !== "/a/home/"
  ) {
    const sub = pathname.split("/")[2] ?? "";
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

  // 3) Em /a e /a/home não fazemos redirect por cookie — SSR decide (cookie/fallback)
  if (
    pathname === "/a" ||
    pathname === "/a/" ||
    pathname === "/a/home" ||
    pathname === "/a/home/"
  ) {
    return res;
  }

  // 4) Demais rotas → resposta já contém os cookies de sessão atualizados
  return res;
}

export const config = {
  matcher: [
    // só exclui estáticos; /a e /a/home passam e são decididas pelo SSR
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
