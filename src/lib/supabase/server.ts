import { cookies, headers } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase server-side (RLS ON via sessão do usuário).
 * Sem Service Role. Sem cookies manuais.
 */
export function getServerSupabase(): SupabaseClient {
  const cookieStore = cookies();

  const cookieAdapter = {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(_name: string, _value: string, _options: CookieOptions) {
      // Fase 1: no-op (login/logout fazem isso nas rotas de auth)
    },
    remove(_name: string, _options: CookieOptions) {
      // Fase 1: no-op
    },
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieAdapter,
    headers: {
      'x-forwarded-host': headers().get('host') ?? undefined,
    },
  });
}
