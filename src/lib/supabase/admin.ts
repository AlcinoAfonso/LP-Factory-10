// src/lib/supabase/admin.ts
// server-only
import "server-only";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

// Fail-fast: não permitir rodar sem envs corretas
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error(
    "Missing Supabase env: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY."
  );
}

/**
 * Admin client — uso exclusivo em server-side.
 * - Usa Secret Key (server-only).
 * - Não mantém sessão persistida nem autoRefresh (não faz sentido p/ admin tasks).
 */
export const admin = () =>
  createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
