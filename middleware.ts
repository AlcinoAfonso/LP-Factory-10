// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware mínimo para o escopo do Dashboard.
 * - Aplica-se apenas a rotas que começam com /a/
 * - Sem referências a rotas legadas (/login, /select-account)
 * - Mantém a flag ACCESS_CONTEXT_ENFORCED para ativar lógica futura
 */
export function middleware(_req: NextRequest) {
  // Toggle global (pode deixar OFF em Preview enquanto o guard real não estiver pronto)
  const ENFORCED = process.env.ACCESS_CONTEXT_ENFORCED === "true";

  if (!ENFORCED) {
    // Sem enforcement: deixa passar
    return NextResponse.next();
  }

  // Aqui entra a checagem real de sessão/tenant/guards (futuro)
  // Por ora, apenas deixa passar.
  return NextResponse.next();
}

/** Aplica SOMENTE em /a/*  (auth/callback e estáticos ficam fora) */
export const config = {
  matcher: ["/a/:path*"],
};
