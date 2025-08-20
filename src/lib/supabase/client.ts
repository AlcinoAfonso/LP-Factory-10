// src/lib/supabase/client.ts
// Bússola 4.2 — client de browser com chave publicável (NUNCA service_role)

import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Named export esperado pelos imports do app
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// (opcional) default export para compatibilidade futura
export default supabase;
