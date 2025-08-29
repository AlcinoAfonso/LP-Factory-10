// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import {
  createServerClient as createSSRClient,
  type CookieOptions,
} from "@supabase/ssr";

/**
 * createServerClient
 *
 * - Usa cookies() síncrono (Next 14.2.18).
 * - Integra com @supabase/ssr para instância segura no server.
 * - Fail-fast: só aceita as envs oficiais (URL + PUBLISHABLE_KEY).
 */
export function createServerClient() {
  const cookieStore = cookies(); // síncrono

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase env: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createSSRClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          /* ignore in edge runtimes without mutable cookies */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        } catch {
          /* ignore */
        }
      },
    },
  });
}

export const getServerSupabase = createServerClient;
