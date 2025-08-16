// server-only
import "server-only";
import { createClient } from "@supabase/supabase-js";

export const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,          // ex.: https://dpikmjgiteuafsbaubue.supabase.co
    process.env.SUPABASE_SECRET_KEY!,               // nova Secret (server-only)
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
