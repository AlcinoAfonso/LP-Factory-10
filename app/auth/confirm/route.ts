// app/auth/confirm/route.ts
import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

function isSafeInternal(path?: string | null) {
  return (
    !!path &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("://")
  );
}

function escAttr(v: string) {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function interstitialHTML(params: {
  token_hash: string;
  code: string;
  type: string;
  next: string;
}) {
  const th = escAttr(params.token_hash);
  const cd = escAttr(params.code);
  const ty = escAttr(params.type);
  const nx = escAttr(params.next);

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="display:flex;min-height:100dvh;align-items:center;justify-content:center;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <form method="POST" action="/auth/confirm" style="display:flex;gap:8px;flex-direction:column;align-items:center">
      <input type="hidden" name="token_hash" value="${th}"/>
      <input type="hidden" name="code" value="${cd}"/>
      <input type="hidden" name="type" value="${ty}"/>
      <input type="hidden" name="next" value="${nx}"/>
      <button type="submit" style="padding:.75rem 1rem;border-radius:.5rem;border:1px solid #ccc;cursor:pointer">Continuar</button>
    </form>
  </body></html>`;
}

function isValidEmailOtpType(v: string): v is EmailOtpType {
  return (
    v === "signup" ||
    v === "invite" ||
    v === "magiclink" ||
    v === "recovery" ||
    v === "email_change"
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const token_hash = url.searchParams.get("token_hash") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const typeRaw = url.searchParams.get("type") ?? "";
  const type = isValidEmailOtpType(typeRaw) ? typeRaw : null;

  const rawNext = url.searchParams.get("next");
  const next = isSafeInternal(rawNext)
    ? rawNext!
    : type === "recovery"
      ? "/auth/update-password"
      : "/";

  if ((!token_hash && !code) || !type) {
    return NextResponse.redirect(
      new URL("/auth/error?error=No%20token%20hash/code%20or%20type", url)
    );
  }

  // Mitigação anti-scanner: exige gesto do usuário (POST).
  return new Response(interstitialHTML({ token_hash, code, type, next }), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const form = await req.formData();

  const token_hash = String(form.get("token_hash") || "");
  const code = String(form.get("code") || ""
