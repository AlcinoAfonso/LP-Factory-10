// app/onboard/actions.ts
"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import * as postSaleTokenAdapter from "@/lib/admin/adapters/postSaleTokenAdapter";
import * as accountAdapter from "@/lib/access/adapters/accountAdapter";

// Helpers
function now() {
  return typeof globalThis.performance?.now === "function"
    ? globalThis.performance.now()
    : Date.now();
}

function latencyMs(t0?: number) {
  if (typeof t0 !== "number") return undefined;
  const t1 = typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now();
  return Math.round(t1 - t0);
}

async function getIP() {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

// Tipos
type OnboardResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: Onboarding completo
 * 1. Revalida token
 * 2. Cria usuário (signUp)
 * 3. Autentica (signIn)
 * 4. Consome token (createFromToken - agora com auth.uid())
 * 5. Busca slug
 * 6. Redirect /a/{slug}
 */
export async function onboardAction(
  tokenId: string,
  email: string,
  password: string
): Promise<OnboardResult> {
  const t0 = now();
  const ip = await getIP();

  // Log início
  console.error(
    JSON.stringify({
      event: "onboard_started",
      scope: "onboard",
      token_id: tokenId,
      email,
      ip,
      timestamp: new Date().toISOString(),
    })
  );

  let accountSlug: string | undefined;

  try {
    // 1. Revalidar token (segurança - pode ter expirado durante preenchimento)
    const validation = await postSaleTokenAdapter.validate(tokenId);
    if (!validation.valid) {
      console.error(
        JSON.stringify({
          event: "onboard_failed",
          scope: "onboard",
          reason: "token_invalid",
          token_id: tokenId,
          validation_reason: validation.reason,
          ip,
          latency_ms: latencyMs(t0),
          timestamp: new Date().toISOString(),
        })
      );
      return { success: false, error: "Token inválido ou expirado. Solicite um novo link." };
    }

    const supabase = await createClient();

    // 2. Criar usuário (signUp)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Não enviar email de confirmação
      },
    });

    if (signUpError) {
      // Tratar email já existente
      if (signUpError.message?.toLowerCase().includes("already") || 
          signUpError.message?.toLowerCase().includes("duplicate")) {
        console.error(
          JSON.stringify({
            event: "onboard_failed",
            scope: "onboard",
            reason: "email_already_exists",
            token_id: tokenId,
            email,
            ip,
            latency_ms: latencyMs(t0),
            timestamp: new Date().toISOString(),
          })
        );
        return { success: false, error: "Este email já está cadastrado. Entre em contato com o suporte." };
      }

      // Erro genérico de signUp
      console.error(
        JSON.stringify({
          event: "onboard_failed",
          scope: "onboard",
          reason: "auth_signup_failed",
          token_id: tokenId,
          error: signUpError.message,
          ip,
          latency_ms: latencyMs(t0),
          timestamp: new Date().toISOString(),
        })
      );
      return { success: false, error: "Erro ao criar conta. Tente novamente." };
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      console.error(
        JSON.stringify({
          event: "onboard_failed",
          scope: "onboard",
          reason: "auth_signup_failed",
          token_id: tokenId,
          error: "user_id_missing",
          ip,
          latency_ms: latencyMs(t0),
          timestamp: new Date().toISOString(),
        })
      );
      return { success: false, error: "Erro ao criar conta. Tente novamente." };
    }

    // 3. Autenticar ANTES de criar conta (para ter auth.uid())
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error(
        JSON.stringify({
          event: "onboard_failed",
          scope: "onboard",
          reason: "auth_signin_failed",
          token_id: tokenId,
          error: signInError.message,
          user_id: userId,
          ip,
          latency_ms: latencyMs(t0),
          timestamp: new Date().toISOString(),
        })
      );
      return { success: false, error: "Erro ao autenticar. Tente novamente." };
    }

    // 4. Consumir token e criar conta (AGORA com auth.uid() válido)
    const accountId = await accountAdapter.createFromToken(tokenId, userId);

    if (!accountId) {
      console.error(
        JSON.stringify({
          event: "onboard_failed",
          scope: "onboard",
          reason: "account_creation_failed",
          token_id: tokenId,
          user_id: userId,
          ip,
          latency_ms: latencyMs(t0),
          timestamp: new Date().toISOString(),
        })
      );
      return { success: false, error: "Erro ao criar conta. Entre em contato com o suporte." };
    }

    // 5. Buscar slug da conta criada
    const account = await accountAdapter.getAccountById(accountId);
    if (!account) {
      console.error(
        JSON.stringify({
          event: "onboard_failed",
          scope: "onboard",
          reason: "account_not_found",
          token_id: tokenId,
          account_id: accountId,
          ip,
          latency_ms: latencyMs(t0),
          timestamp: new Date().toISOString(),
        })
      );
      return { success: false, error: "Conta criada, mas erro ao redirecionar. Faça login manualmente." };
    }

    accountSlug = account.subdomain;

    // Log sucesso
    console.error(
      JSON.stringify({
        event: "onboard_succeeded",
        scope: "onboard",
        token_id: tokenId,
        account_id: accountId,
        slug: accountSlug,
        user_id: userId,
        ip,
        latency_ms: latencyMs(t0),
        timestamp: new Date().toISOString(),
      })
    );

    // ✅ Sucesso — redirect será executado fora do try/catch
  } catch (error) {
    // ❌ NUNCA capturar NEXT_REDIRECT (Next.js usa exceção para controlar redirect)
    if (error && typeof error === 'object' && 'digest' in error && String(error.digest).startsWith('NEXT_REDIRECT')) {
      throw error; // Re-lançar para Next.js processar
    }

    // Log apenas erros reais (não NEXT_REDIRECT)
    console.error(
      JSON.stringify({
        event: "onboard_failed",
        scope: "onboard",
        reason: "unexpected_error",
        token_id: tokenId,
        error: (error as Error)?.message ?? String(error),
        ip,
        latency_ms: latencyMs(t0),
        timestamp: new Date().toISOString(),
      })
    );
    return { success: false, error: "Erro inesperado. Tente novamente." };
  }

  // 6. Redirect (fora do try/catch para não ser capturado como erro)
  if (accountSlug) {
    redirect(`/a/${accountSlug}`);
  }

  // Fallback (nunca deve chegar aqui se accountSlug foi setado)
  return { success: false, error: "Erro ao redirecionar. Faça login manualmente." };
}
