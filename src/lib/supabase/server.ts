import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export function getServerSupabase(): SupabaseClient {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => store.get(name)?.value,
        getAll: () => store.getAll().map(c => ({ name: c.name, value: c.value })),
        set: (_name: string, _value: string, _opts: CookieOptions) => {},    // no-op na Fase 1
        remove: (_name: string, _opts: CookieOptions) => {},                 // no-op na Fase 1
      },
    }
  );
}
