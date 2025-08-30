// app/auth/confirm/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolvePostConfirmDestination } from "@/lib/access/resolvePostConfirmDestination";

// Mapeia erro do Supabase p/ reason canônica (PPS 6.1)
function mapReason(msg: string | undefined): "expired" | "used" | "invalid" {
  const m = (msg || "").toLowerCase();
  if (m.includes("expire")) return "expired";
  if (m.includes("used") || m.includes("already been used")) return "used";
  return "invalid";
}

// Telemetria mínima (PPS 4.3) — sem PII
function log(payload: {
  event: "confirm_handler" | "confirm_handler_debug";
  status: "success" | "error";
  type?: "recovery" | "email_change" | "signup";
  reason?: "expired" | "used" | "invalid" | "missing";
  route: "/auth/confirm";
  timestamp: number;
  event_id?: string;
  reason_raw?: string;
  token_prefix?: string;
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

  // normaliza "email" -> "email_change" (Supabase)
  const rawType = url.searchParams.get("type");
  const normalized =
    rawType === "email" ? "email_change" : rawType;

  const type =
    (normalized as "recovery" | "email_change" | "signup" | null) || null;

  const nextRaw = url.searchParams.get("next");

  if (!token_hash || !type) {
    log({
      event: "confirm_handler",
      status: "error",
      reason: "missing",
      route: "/auth/confirm",
      timestamp: now,
      event_id: crypto.randomUUID(),
    });
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`, 303);
  }

  const supabase = createServerClient();

  // verifyOtp centralizado (PPS 4.1)
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    // log de diagnóstico detalhado (sem PII)
    log({
      event: "confirm_handler_debug",
      status: "error",
      type,
      route: "/auth/confirm",
      timestamp: now,
      reason_raw: error.message,
      token_prefix: String(token_hash).slice(0, 12),
    });

    const reason = mapReason(error.message);

    // log canônico
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
      return NextResponse.redirect(`${origin}/auth/error?reason=${reason}`, 303);
    }

    // email_change | signup com erro → genérico
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`, 303);
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

  if (type === "recovery") {
    // sucesso de recovery → /auth/reset?state=valid
    return NextResponse.redirect(`${origin}/auth/reset?state=valid`, 303);
  }

  // email_change | signup → destino multi-tenant
  const dest = await resolvePostConfirmDestination(supabase, nextRaw);
  return NextResponse.redirect(`${origin}${dest}`, 303);
}
