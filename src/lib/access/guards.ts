// src/lib/access/guards.ts
import { checkSuperAdmin, checkPlatformAdmin } from '@/lib/admin';

/**
 * Guard: verifica super_admin via adapter
 * Diferencia usuário não autenticado de não autorizado
 */
export async function requireSuperAdmin(): Promise<{
  allowed: boolean;
  redirect?: '/auth/login' | '/auth/confirm/info';
}> {
  const check = await checkSuperAdmin();
  
  // Usuário não autenticado → login
  if (!check.userId) {
    return { allowed: false, redirect: '/auth/login' };
  }
  
  // Usuário autenticado mas não super → info neutra
  if (!check.isSuper) {
    return { allowed: false, redirect: '/auth/confirm/info' };
  }
  
  return { allowed: true };
}

/**
 * Guard: verifica platform_admin (inclui super_admin) via adapter
 * Diferencia usuário não autenticado de não autorizado
 */
export async function requirePlatformAdmin(): Promise<{
  allowed: boolean;
  redirect?: '/auth/login' | '/auth/confirm/info';
}> {
  const check = await checkPlatformAdmin();
  
  // Usuário não autenticado → login
  if (!check.userId) {
    return { allowed: false, redirect: '/auth/login' };
  }
  
  // Usuário autenticado mas não platform/super → info neutra
  if (!check.isPlatform) {
    return { allowed: false, redirect: '/auth/confirm/info' };
  }
  
  return { allowed: true };
}
