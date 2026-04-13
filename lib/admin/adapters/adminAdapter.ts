// src/lib/admin/adapters/adminAdapter.ts
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Adapter mínimo de privilégios Admin
 * - Verificação de sessão/claims via SERVER CLIENT (contexto do usuário)
 */

/**
 * Verifica se usuário autenticado é super_admin
 * Fail-closed: qualquer erro retorna false
 * Usa SERVER CLIENT para preservar contexto do usuário (auth.uid()).
 */
export async function checkSuperAdmin(): Promise<{
  isSuper: boolean;
  userId?: string;
  email?: string;
}> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isSuper: false };
    }

    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc(
      "is_super_admin"
    );

    if (rpcError) {
      // eslint-disable-next-line no-console
      console.error("[adminAdapter] RPC is_super_admin failed:", rpcError);
      return { isSuper: false, userId: user.id, email: user.email ?? undefined };
    }

    return {
      isSuper: !!isSuperAdmin,
      userId: user.id,
      email: user.email ?? undefined,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[adminAdapter] Unexpected error:", err);
    return { isSuper: false };
  }
}

/**
 * Verifica se usuário autenticado é platform_admin ou super_admin
 * Fail-closed: qualquer erro retorna false
 * Usa SERVER CLIENT para preservar contexto do usuário (auth.uid()).
 */
export async function checkPlatformAdmin(): Promise<{
  isPlatform: boolean;
  userId?: string;
  email?: string;
}> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isPlatform: false };
    }

    const { data: isPlatformAdmin, error: rpcError } = await supabase.rpc(
      "is_platform_admin"
    );

    if (rpcError) {
      // eslint-disable-next-line no-console
      console.error("[adminAdapter] RPC is_platform_admin failed:", rpcError);
      return { isPlatform: false, userId: user.id, email: user.email ?? undefined };
    }

    return {
      isPlatform: !!isPlatformAdmin,
      userId: user.id,
      email: user.email ?? undefined,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[adminAdapter] Unexpected error:", err);
    return { isPlatform: false };
  }
}
