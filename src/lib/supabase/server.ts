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
          // Em runtime funciona; durante o build pode ser somente leitura.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, (options as any) ?? {});
            });
          } catch {
            // no-op em contextos onde não é possível setar cookies (ex.: build)
          }
        },
      },
    }
  );
}

/** Alias para compatibilidade com código existente */
export const getServerSupabase = createServerClient;
