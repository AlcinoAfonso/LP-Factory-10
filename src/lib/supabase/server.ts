// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import {
  createServerClient as createSSRClient,
  type CookieOptions,
} from "@supabase/ssr";

export function createServerClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY or PUBLISHABLE_KEY."
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
