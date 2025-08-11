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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // @ts-expect-error next types permitem opções parciais
              cookieStore.set(name, value, options);
            });
          } catch {
            // no-op em contextos somente leitura (ex.: build)
          }
        },
      },
    }
  );
}

/** Alias p/ compatibilidade com código existente */
export const getServerSupabase = createServerClient;
