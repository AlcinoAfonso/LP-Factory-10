// /middleware.ts (raiz) — leve, sem queries
import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Mantém cookies/sessão (não tocar Fluxos 1–2)
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclui /auth/**, /api/** e estáticos; o resto passa pelo middleware
    "/((?!auth/|api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
