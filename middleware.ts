// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware mínimo para o escopo do Dashboard.
 * - Aplica-se apenas a rotas que começam com /a/
 * - Redireciona /a/preview -> /a (pré-acesso canônico)
 * - Mantém a flag ACCESS_CONTEXT_ENFORCED para ativar lógica futura
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Redirect canônico: /a/preview -> /a (somente GET/HEAD)
  if (req.method === "GET" || req.method === "HEAD") {
    const normalized = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    if (normalized === "/a/preview") {
      const url = new URL("/a", req.url);
      url.search = search; // preserva querystring, se houver
      return NextResponse.redirect(url, 307);
    }
  }

  // Toggle global (deixa passar quando enforcement está OFF)
  const ENFORCED = process.env.ACCESS_CONTEXT_ENFORCED === "true";
  if (!ENFORCED) {
    return NextResponse.next();
  }

  // Aqui entra a checagem real de sessão/tenant/guards (futuro)
  return NextResponse.next();
}

/** Aplica SOMENTE em /a/*  (auth/callback e estáticos ficam fora) */
export const config = {
  matcher: ["/a/:path*"],
};
