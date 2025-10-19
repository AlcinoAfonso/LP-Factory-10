// src/lib/auth/authAdapter.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Retorna email do usuário autenticado (server-only)
 * Usado apenas para passar ao Header via prop
 */
export async function getUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user.email ?? null;
}
