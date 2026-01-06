// middleware.ts — sessão + persistência da última conta (SEM redirects)
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Clear last_account_subdomain cookie and update session when requested
  if (
    (pathname === "/a/home" || pathname === "/a/home/") &&
    request.nextUrl.searchParams.get("clear_last") === "1"
  ) {
    const res = await updateSession(request);
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("last_account_subdomain", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: isProd,
    });
    return res;
  }

  // * Deixe /a e /a/home seguirem para o App Router (SSR decide/público)
  if (
    pathname === "/a" ||
    pathname === "/a/" ||
    pathname === "/a/home" ||
    pathname === "/a/home/"
  ) {
    return NextResponse.next();
  }

  // * Para /a/{sub} (exceto 'home'): atualiza sessão
  if (request.method === "GET" && pathname.startsWith("/a/")) {
    const segs = pathname.split("/");
    const sub = segs[2] || "";
    if (sub && sub !== "home") {
      const res = await updateSession(request);
      return res;
    }
  }

  // * Demais rotas: só garantir a sessão
  return updateSession(request);
}

export const config = {
  matcher: [
    // apenas exclui estáticos; /a e /a/home passam e não são alterados aqui
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
