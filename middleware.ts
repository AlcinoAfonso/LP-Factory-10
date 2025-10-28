// /middleware.ts — sessão + redirect para última conta usada
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔹 Redireciona /a e /a/home para a última conta (se houver cookie)
  if (
    pathname === "/a" ||
    pathname === "/a/" ||
    pathname === "/a/home" ||
    pathname === "/a/home/"
  ) {
    const cookie = request.cookies.get("last_account_subdomain")?.value?.trim();
    if (cookie) {
      const url = request.nextUrl.clone();
      url.pathname = `/a/${cookie}`;
      return NextResponse.redirect(url);
    }
    // Sem cookie → segue fluxo atual (SSR decide em /a/home)
    return NextResponse.next();
  }

  // 🔹 Demais rotas continuam com a atualização de sessão padrão
  return updateSession(request);
}

export const config = {
  matcher: [
    // só exclui estáticos; /a e /a/home passam e são tratadas acima
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
