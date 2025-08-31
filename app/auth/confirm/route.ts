// app/auth/confirm/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolvePostConfirmDestination } from "@/lib/access/resolvePostConfirmDestination";

// Map reason
function mapReason(msg: string | undefined): "expired" | "used" | "invalid" {
  const m = (msg || "").toLowerCase();
  if (m.includes("expire")) return "expired";
  if (m.includes("used")) return "used";
  return "invalid";
}

// Telemetria mínima
function log(payload: {
  event: "confirm_handler" | "confirm_handler_debug";
  status: "success" | "error";
  type?: "recovery" | "email" | "signup";
  reason?: "expired" | "used" | "invalid" | "missing";
  reason_raw?: string;
  route: "/auth/confirm";
  timestamp: number;
  event_id?: string;
}) {
  try { console.log(payload); } catch {}
}

export async function GET(req: Request) {
  const now = Date.now();
  const url = new URL(req.url);
  const origin = url.origin;

  // 1) Captura params
  const raw_token_hash = url.searchParams.get("token_hash") || undefined;
  const type = (url.searchParams.get("type") as "recovery" | "email" | "signup" | null) || null;
  const nextRaw = url.searchParams.get("next");

  if (!raw_token_hash || !type) {
    log({ event: "confirm_handler", status: "error", reason: "missing", route: "/auth/confirm", timestamp: now });
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`, 303);
  }

  // 2) Anti-scanner do Supabase: remover prefixo "pkce_"
  const token_hash = raw_token_hash.startsWith("pkce_")
    ? raw_token_hash.slice(5)
    : raw_token_hash;

  const supabase = createServerClient();

  // 3) Verificação no server
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    const reason = mapReason(error.message);
    log({
      event: "confirm_handler_debug",
      status: "error",
      type,
      reason,
      reason_raw: error.message,
      route: "/auth/confirm",
      timestamp: now,
    });

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/error?reason=${reason}`, 303);
    }
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`, 303);
  }

  // 4) Sucesso
  log({ event: "confirm_handler", status: "success", type, route: "/auth/confirm", timestamp: now });

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/reset?state=valid`, 303);
  }

  const dest = await resolvePostConfirmDestination(supabase, nextRaw);
  return NextResponse.redirect(`${origin}${dest}`, 303);
}
