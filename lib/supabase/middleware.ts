// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Atualiza / sincroniza cookies do Supabase na borda.
 *
 * ⚠ Importante:
 * - NÃO faz mais await em chamadas ao Supabase (para não estourar timeout do middleware).
 * - Toda a lógica de "tem usuário / não tem usuário" fica nas páginas (SSR),
 *   via readAccessContext / guards específicos.
 */
export function updateSession(request: NextRequest) {
  // Response base reaproveitado
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Dispara o refresh da sessão em background, sem bloquear o middleware.
  // Se der erro / timeout dentro do client, só loga e segue a vida.
  void supabase.auth.getUser().catch((err) => {
    try {
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          event: "middleware_supabase_get_user_failed",
          error: err instanceof Error ? err.message : String(err),
          ts: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }
  });

  return response;
}
