// /middleware.ts — sessão + persistência da última conta (SEM redirects)
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔹 Deixe /a e /a/home seguirem para o App Router (SSR decide/público)
  if (pathname === "/a" || pathname === "/a/" || pathname === "/a/home" || pathname === "/a/home/") {
    return NextResponse.next();
  }

  // Para /a/{sub} (exceto 'home'): atualiza sessãoa
  if (request.method === "GET" && pathname.startsWith("/a/")) {
    const segs = pathname.split("/");
    const sub = segs[2] || "";
    if (sub && sub !== "home") {
      const res = await updateSession(request);
         return res;
    }
  }

  // 🔹 Demais rotas: só garante a sessão
  return updateSession(request);
}

export const config = {
  matcher: [
    // apenas exclui estáticos; /a e /a/home passam e não são alterados aqui
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
