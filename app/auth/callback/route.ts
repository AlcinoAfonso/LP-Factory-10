// app/auth/callback/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PPS 4.1.5 — whitelist de destinos pós-auth
const ALLOW = ["/a", "/a/", "/auth/error", "/onboarding"] as const;
function sanitizeNext(raw: string | null | undefined): string {
  if (!raw) return "/a";
  try {
    // Aceita apenas path interno (sem protocolo/host) e prefixos whitelisted
    const url = new URL(raw, "http://x"); // base dummy só p/ parse
    const path = url.pathname + (url.search || "");
    return ALLOW.some((p) => path === p || path.startsWith(p)) ? path : "/a";
  } catch {
    return "/a";
  }
}

export async function GET(req: Request) {
  const now = Date.now();
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const next = sanitizeNext(url.searchParams.get("next"));

  // Telemetria mínima (sem PII)
  const log = (payload: {
    event: "oauth_callback";
    status: "success" | "error";
    reason?: "missing_code" | "exchange_failed";
    route: "/auth/callback";
    timestamp: number;
    event_id: string;
  }) => {
    try {
      // Pode plugar Sentry aqui; por ora console neutro
      // eslint-disable-next-line no-console
      console.log(payload);
    } catch {}
  };

  if (!code) {
    log({
      event: "oauth_callback",
      status: "error",
      reason: "missing_code",
      route: "/auth/callback",
      timestamp: now,
      event_id: crypto.randomUUID(),
    });
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    log({
      event: "oauth_callback",
      status: "error",
      reason: "exchange_failed",
      route: "/auth/callback",
      timestamp: now,
      event_id: crypto.randomUUID(),
    });
    // Não expor mensagem de erro; usar página canônica
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
  }

  log({
    event: "oauth_callback",
    status: "success",
    route: "/auth/callback",
    timestamp: now,
    event_id: crypto.randomUUID(),
  });

  // Sucesso → sessão criada via cookies; redirecionar para destino canônico
  return NextResponse.redirect(`${origin}${next}`);
}
