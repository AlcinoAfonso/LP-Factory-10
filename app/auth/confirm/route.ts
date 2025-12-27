// app/auth/confirm/route.ts
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

function interstitialHTML(token_hash: string, type: string, next: string) {
  const th = escAttr(token_hash);
  const ty = escAttr(type);
  const nx = escAttr(next);

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="display:flex;min-height:100dvh;align-items:center;justify-content:center;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <form method="POST" action="/auth/confirm" style="display:flex;gap:8px;flex-direction:column;align-items:center">
      <input type="hidden" name="token_hash" value="${th}"/>
      <input type="hidden" name="type" value="${ty}"/>
      <input type="hidden" name="next" value="${nx}"/>
      <button type="submit" style="padding:.75rem 1rem;border-radius:.5rem;border:1px solid #ccc;cursor:pointer">Continuar</button>
    </form>
  </body></html>`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const rawNext = url.searchParams.get("next");
  const next = isSafeInternal(rawNext)
    ? rawNext!
    : type === "recovery"
      ? "/auth/update-password"
      : "/";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL("/auth/error?error=No%20token%20hash%20or%20type", url)
    );
  }

  // Mitigação anti-scanner: sempre exige gesto do usuário (POST)
  return new Response(interstitialHTML(token_hash, type, next), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const form = await req.formData();

  const token_hash = String(form.get("token_hash") || "");
  const type = String(form.get("type") || "") as EmailOtpType;
  const rawNext = String(form.get("next") || "");
  const next = isSafeInternal(rawNext)
    ? rawNext
    : type === "recovery"
      ? "/auth/update-password"
      : "/";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL("/auth/error?error=No%20token%20hash%20or%20type", url)
    );
  }

  const supabase = await createClient();

  // ✅ verifyOtp APENAS no handler server (corrige no-implicit-flow)
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    return NextResponse.redirect(
      new URL(
        "/auth/error?error=" +
          encodeURIComponent("Link inválido/expirado. Solicite um novo e-mail."),
        url
      )
    );
  }

  return NextResponse.redirect(new URL(next, url));
}
