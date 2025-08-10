import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protege rotas dos dashboards exigindo sessão (cookie Supabase).
 * Controlado por ACCESS_CONTEXT_ENFORCED para rollout seguro.
 */
export function middleware(req: NextRequest) {
  const enforce = process.env.ACCESS_CONTEXT_ENFORCED === 'true';
  if (!enforce) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const protectedPrefixes = ['/dashboard', '/a'];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSession =
    req.cookies.has('sb-access-token') || req.cookies.has('sb:token');

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/a/:path*'],
};
