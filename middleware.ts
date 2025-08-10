import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware placeholder (resolução de tenant entrará aqui depois).
 * Mantém pass-through para não quebrar o build.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// Se quiser restringir rotas no futuro, adicione "matcher" aqui.
// export const config = { matcher: ['/dashboard/:path*'] };
