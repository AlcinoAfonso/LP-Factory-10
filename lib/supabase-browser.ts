"use client";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,                 // v8.3
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,     // v8.3 (não usar ANON_KEY)
  { auth: { persistSession: true, flowType: "pkce" } }
);
