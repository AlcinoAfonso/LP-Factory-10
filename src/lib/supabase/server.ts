// src/lib/supabase/server.ts
import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cliente do Supabase para uso no servidor (Route Handlers, Server Actions, etc.) */
export function createServerClient() {
  const cookieStore = cookies();

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        /** Supabase SSR pede setAll; ignore erros quando cookies não puderem ser setados (p.ex. durante build). */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // @ts-expect-error next types aceitam options parciais
              cookieStore.set(name, value, options);
            });
          } catch {
            // no-op em contextos onde cookies() é somente leitura
          }
        },
      },
    }
  );
}
