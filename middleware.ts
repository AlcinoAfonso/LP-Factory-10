import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Matcher seguro: não intercepta /auth/**, /api/** e estáticos.
// Mantemos updateSession nas demais rotas (incluindo /a e /a/[account]).
export const config = {
  matcher: [
    '/((?!auth/|api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
