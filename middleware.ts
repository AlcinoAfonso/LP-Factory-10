// /middleware.ts — sessão apenas, com bypass para /a e /a/home
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔹 Deixe /a e /a/home seguirem para o App Router (SSR faz o redirect/gate)
  if (pathname === "/a" || pathname === "/a/home") {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // só exclui estáticos; /a e /a/home passam, mas são bypassados na função
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
