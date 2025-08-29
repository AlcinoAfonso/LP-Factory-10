// app/auth/confirm/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PPS 4.1.5 — whitelist de destinos internos
const ALLOW = ["/a", "/a/", "/auth/error", "/onboarding"] as const;
function sanitizeNext(raw: string | null | undefined): string {
  if (!raw) return "/a";
  try {
    const url = new URL(raw, "http://x");
    const path = url.pathname + (url.search || "");
    return ALLOW.some((p) => path === p || path.startsWith(p)) ? path : "/a";
  } catch {
    return "/a";
  }
}

// Mapeia erro do Supabase p/ reason canônica (PPS 6.1)
function mapReason(msg: string | undefined): "expired" | "used" | "invalid" {
  const m = (msg || "").toLowerCase();
  if (m.includes("expire")) return "expired";
  if (m.includes("used")) return "used";
  return "invalid";
}

// Telemetria mínima (PPS 4.3) — sem PII
function log(payload: {
  event: "confirm_handler";
  status: "success" | "error";
  type?: "recovery" | "email" | "signup";
  reason?: "expired" | "used" | "invalid" | "missing";
  route: "/auth/confirm";
  timestamp: number;
  event_id: string;
}) {
  try {
    // eslint-disable-next-line no-console
    console.log(payload);
  } catch {}
}

export async function GET(req: Request) {
  const now = Date.now();
  const url = new URL(req.url);
  const origin = url.origin;

  const token_hash = url.searchParams.get("token_hash") || undefined;
  const type = (url.searchParams.get("type") as "recovery" | "email" | "signup" | null) || null;
  const next = sanitizeNext(url.searchParams.get("next"));

  if (!token_hash || !type) {
    log({
      event: "confirm_handler",
      status: "error",
      reason: "missing",
      route: "/auth/confirm",
      timestamp: now,
      event_id: crypto.randomUUID(),
    });
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
  }

  const supabase = createServerClient();

  // `verifyOtp` no server centraliza todos os tipos (PPS 4.1)
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    const reason = mapReason(error.message);
    log({
      event: "confirm_handler",
      status: "error",
      type,
      reason,
      route: "/auth/confirm",
      timestamp: now,
      event_id: crypto.randomUUID(),
    });

    // recovery com erro → /auth/error?reason=...
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/error?reason=${reason}`);
    }
    // email/signup com erro → reason=invalid (genérico, sem vazar detalhes)
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
  }

  // Sucesso
  log({
    event: "confirm_handler",
    status: "success",
    type,
    route: "/auth/confirm",
    timestamp: now,
    event_id: crypto.randomUUID(),
  });

  // Regras de destino (PPS 4.1.1–4.1.4 + 7)
  if (type === "recovery") {
    // sucesso de recovery → /auth/reset?state=valid
    return NextResponse.redirect(`${origin}/auth/reset?state=valid`);
  }

  // email|signup (success) → destino multi-tenant whitelisted
  return NextResponse.redirect(`${origin}${next}`);
}
