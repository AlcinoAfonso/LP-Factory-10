// /middleware.ts — sessão + persistência/redirect da última conta
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Redirect para última conta quando o usuário acessa /a ou /a/home
  if (
    pathname === "/a" ||
    pathname === "/a/" ||
    pathname === "/a/home" ||
    pathname === "/a/home/"
  ) {
    const last = request.cookies.get("last_account_subdomain")?.value?.trim();
    if (last) {
      const url = request.nextUrl.clone();
      url.pathname = `/a/${last}`;
      return NextResponse.redirect(url);
    }
    // Sem cookie → segue para o App Router/SSR decidir (pode cair no /a/home)
    return NextResponse.next();
  }

  // 2) Em /a/{subdomain} (exceto 'home'), gravar cookie e manter fluxo normal
  if (pathname.startsWith("/a/")) {
    const sub = pathname.split("/")[2] ?? "";
    if (sub && sub !== "home") {
      // Mantém a atualização de sessão padrão…
      const res = await updateSession(request);
      // …e acrescenta a persistência da preferência no mesmo response
      const isProd = process.env.NODE_ENV === "production";
      res.cookies.set("last_account_subdomain", sub, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        secure: isProd,
      });
      return res;
    }
  }

  // 3) Demais rotas → pipeline padrão de sessão Supabase
  return updateSession(request);
}

export const config = {
  matcher: [
    // só exclui estáticos; /a e /a/home passam e são tratadas acima
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
