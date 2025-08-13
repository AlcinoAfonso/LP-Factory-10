// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Rotas públicas (não passam pelos guards enquanto o Auth/Context não está pronto) */
const PUBLIC_PATHS = new Set<string>([
  "/",             // landing
  "/login",        // placeholder/login
  "/select-account",
]);
function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/auth") ||         // callback do Supabase
    pathname.startsWith("/_next") ||        // assets Next
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico"
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Libera rotas públicas
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 2) Habilita/Desabilita enforcement via ENV (Preview pode ficar OFF)
  const ENFORCED = process.env.ACCESS_CONTEXT_ENFORCED === "true";
  if (!ENFORCED) {
    return NextResponse.next();
  }

  // 3) (Futuro) Aqui entra a checagem real de sessão/tenant/guards
  // Por ora, apenas deixa passar.
  return NextResponse.next();
}

/** Aplica o middleware em todas as rotas de app/ (exceto api/static/image/favicon) */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
