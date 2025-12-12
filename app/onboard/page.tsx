// app/onboard/page.tsx
import React from "react";
import { headers } from "next/headers";
import * as postSaleTokenAdapter from "@/lib/admin/adapters/postSaleTokenAdapter";
import { OnboardForm } from "@/components/onboard/OnboardForm";

function TokenStatus({ reason }: { reason: string }) {
  const messages = {
    not_found: {
      emoji: "❌",
      title: "Link Inválido",
      description: "Este link não é válido. Entre em contato com o suporte.",
      cta: "Falar com Suporte",
      ctaHref: "mailto:suporte@lpfactory.com.br",
    },
    expired: {
      emoji: "⏰",
      title: "Link Expirado",
      description: "Seu link não é mais válido. Solicite um novo ao suporte.",
      cta: "Falar com Suporte",
      ctaHref: "mailto:suporte@lpfactory.com.br",
    },
    already_used: {
      emoji: "🔐",
      title: "Link Já Utilizado",
      description:
        "Este link já foi usado para criar uma conta. Faça login com seu email.",
      cta: "Fazer Login",
      ctaHref: "/auth/login",
    },
  };

  const msg = messages[reason as keyof typeof messages] || messages.not_found;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">{msg.emoji}</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{msg.title}</h1>
          <p className="text-gray-600">{msg.description}</p>
        </div>
        <a
          href={msg.ctaHref}
          className="inline-block px-6 py-3 rounded bg-black text-white hover:bg-gray-800"
        >
          {msg.cta}
        </a>
      </div>
    </div>
  );
}

// Helpers
function now() {
  return typeof globalThis.performance?.now === "function"
    ? globalThis.performance.now()
    : Date.now();
}

function latencyMs(t0?: number) {
  if (typeof t0 !== "number") return undefined;
  const t1 =
    typeof globalThis.performance?.now === "function"
      ? globalThis.performance.now()
      : Date.now();
  return Math.round(t1 - t0);
}

function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

async function getIP() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

type SearchParams = { token?: string };

// Helper: buscar dados do token via adapter
async function fetchTokenData(
  tokenId: string,
  ctx: { t0?: number; ip?: string }
) {
  const tokenData = await postSaleTokenAdapter.getTokenData(tokenId);

  if (!tokenData) {
    console.error(
      JSON.stringify({
        event: "onboard_token_fetch_error",
        scope: "onboard",
        token_id: tokenId,
        error: "not_found",
        ip: ctx.ip,
        latency_ms: latencyMs(ctx.t0),
        timestamp: new Date().toISOString(),
      })
    );
    return null;
  }

  return tokenData;
}

// Metadata
export const metadata = {
  title: "Ativar Conta | LP Factory",
  description: "Complete seu cadastro e acesse o dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Page Component
export default async function OnboardPage(props: any) {
  const t0 = now();
  const ip = await getIP();

  const rawSearchParams = props?.searchParams;
  const searchParams: SearchParams =
    rawSearchParams && typeof rawSearchParams.then === "function"
      ? await rawSearchParams
      : rawSearchParams ?? {};

  const tokenId = searchParams?.token;

  // 1. Token ausente
  if (!tokenId || typeof tokenId !== "string") {
    console.error(
      JSON.stringify({
        event: "onboard_missing_token",
        scope: "onboard",
        ip,
        latency_ms: latencyMs(t0),
        timestamp: new Date().toISOString(),
      })
    );
    return <TokenStatus reason="not_found" />;
  }

  // 2. Validar formato UUID
  if (!isValidUUID(tokenId)) {
    console.error(
      JSON.stringify({
        event: "onboard_invalid_uuid",
        scope: "onboard",
        token_id: tokenId,
        ip,
        latency_ms: latencyMs(t0),
        timestamp: new Date().toISOString(),
      })
    );
    return <TokenStatus reason="not_found" />;
  }

  // 3. Log de tentativa (rate limit futuro)
  console.error(
    JSON.stringify({
      event: "onboard_attempt",
      scope: "onboard",
      token_id: tokenId,
      ip,
      timestamp: new Date().toISOString(),
    })
  );

  // 4. Validar token
  const validation = await postSaleTokenAdapter.validate(tokenId);

  if (!validation.valid) {
    console.error(
      JSON.stringify({
        event: "onboard_invalid_token",
        scope: "onboard",
        token_id: tokenId,
        reason: validation.reason,
        ip,
        latency_ms: latencyMs(t0),
        timestamp: new Date().toISOString(),
      })
    );
    return <TokenStatus reason={validation.reason ?? "not_found"} />;
  }

  // 5. Buscar dados do token
  const tokenData = await fetchTokenData(tokenId, { t0, ip });

  if (!tokenData) {
    return <TokenStatus reason="not_found" />;
  }

  // 6. Log acesso válido
  console.error(
    JSON.stringify({
      event: "onboard_page_loaded",
      scope: "onboard",
      token_id: tokenId,
      email: tokenData.email,
      ip,
      latency_ms: latencyMs(t0),
      timestamp: new Date().toISOString(),
    })
  );

  // 7. Renderizar formulário
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="text-4xl">🚀</div>
            <h1 className="text-2xl font-semibold">Bem-vindo ao LP Factory</h1>
            <p className="text-gray-600">
              Defina sua senha para acessar o dashboard.
            </p>
          </div>

          <OnboardForm
            tokenId={tokenId}
            email={tokenData.email}
            accountName={tokenData.contract_ref}
          />

          <div className="text-center text-sm text-gray-500">
            Sua conta: <strong>{tokenData.contract_ref}</strong>
            <br />
            <span className="text-xs">(você pode alterar no dashboard)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
