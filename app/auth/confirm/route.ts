// app/auth/confirm/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolvePostConfirmDestination } from "@/lib/access/resolvePostConfirmDestination";

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
    console.log(payload);
  } catch {}
}

function esc(v: string) {
  return v.replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]!));
}

export async function GET(req: Request) {
  const now = Date.now();
  const url = new URL(req.url);
  const origin = url.origin;

  const token_hash = url.searchParams.get("token_hash") || undefined;
  const type = (url.searchParams.get("type") as "recovery" | "email" | "signup" | null) || null;
  const nextRaw = url.searchParams.get("next");
  const confirm = url.searchParams.get("confirm"); // anti-scanner

  if (!token_hash || !type) {
    log({ event: "confirm_handler", status: "error", reason: "missing", route: "/auth/confirm", timestamp: now, event_id: crypto.randomUUID() });
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
  }

  // ✅ Não consumimos o token em GET sem confirmação explícita
  if (confirm !== "1") {
    const nextHidden = nextRaw ? `<input type="hidden" name="next" value="${esc(nextRaw)}">` : "";
    const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="robots" content="noindex">
<title>Confirmar acesso — LP Factory</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head><body style="display:grid;place-items:center;height:100vh;font-family:system-ui,sans-serif">
  <form method="POST" action="/auth/confirm" style="display:flex;flex-direction:column;gap:.75rem;min-width:320px">
    <h1 style="font-size:1.25rem;margin:0">Confirme que é você</h1>
    <p style="margin:0;color:#444">Clique para continuar e concluir o acesso.</p>
    <input type="hidden" name="token_hash" value="${esc(token_hash)}">
    <input type="hidden" name="type" value="${esc(type)}">
    ${nextHidden}
    <button type="submit" style="padding:.75rem 1rem;border-radius:.75rem;border:0;background:#111;color:#fff;cursor:pointer">
      Continuar
    </button>
    <a href="/auth/error?reason=invalid" style="text-align:center;color:#666;font-size:.9rem">Cancelar</a>
  </form>
</body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // Se alguém tentar forçar confirm=1 via GET, recusamos
  return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
}

export async function POST(req: Request) {
  const now = Date.now();
  const url = new URL(req.url);
  const origin = url.origin;

  const form = await req.formData();
  const token_hash = (form.get("token_hash") as string) || undefined;
  const type = (form.get("type") as "recovery" | "email" | "signup" | null) || null;
  const nextRaw = (form.get("next") as string) || null;

  if (!token_hash || !type) {
    log({ event: "confirm_handler", status: "error", reason: "missing", route: "/auth/confirm", timestamp: now, event_id: crypto.randomUUID() });
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    const reason = mapReason(error.message);
    log({ event: "confirm_handler", status: "error", type, reason, route: "/auth/confirm", timestamp: now, event_id: crypto.randomUUID() });
    // recovery mantém reason específico; email/signup usa invalid genérico
    if (type === "recovery") return NextResponse.redirect(`${origin}/auth/error?reason=${reason}`);
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
  }

  log({ event: "confirm_handler", status: "success", type, route: "/auth/confirm", timestamp: now, event_id: crypto.randomUUID() });

  if (type === "recovery") {
    // sucesso → abrir UI de nova senha
    return NextResponse.redirect(`${origin}/auth/reset?state=valid`);
  }

  // signup/email change → destino multi-tenant
  const dest = await resolvePostConfirmDestination(supabase, nextRaw);
  return NextResponse.redirect(`${origin}${dest}`);
}
