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
  // valores suportados na prática pelo Supabase para Email OTP flows
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

  // Mitigação anti-scanner: sempre exige gesto do usuário (POST)
  return new Response(
    interstitialHTML({ token_hash, code, type, next }),
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const form = await req.formData();

  const token_hash = String(form.get("token_hash") || "");
  const code = String(form.get("code") || "");
  const typeRaw = String(form.get("type") || "");
  const type = isValidEmailOtpType(typeRaw) ? (typeRaw as EmailOtpType) : null;

  const rawNext = String(form.get("next") || "");
  const next = isSafeInternal(rawNext)
    ? rawNext
    : type === "recovery"
      ? "/auth/update-password"
      : "/";

  if ((!token_hash && !code) || !type) {
    return NextResponse.redirect(
      new URL("/auth/error?error=No%20token%20hash/code%20or%20type", url)
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(
      new URL(
        "/auth/error?error=" +
          encodeURIComponent("Config Supabase ausente (URL/KEY)."),
        url
      )
    );
  }

  // Importante: o mesmo NextResponse que receberá os cookies
  const redirectRes = NextResponse.redirect(new URL(next, url), 303);
  redirectRes.headers.set("Cache-Control", "no-store, max-age=0");
  redirectRes.headers.set("Pragma", "no-cache");

  // Cookie bridge preso ao redirectRes (garante Set-Cookie no POST)
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        for (const { name, value, options } of cookiesToSet) {
          redirectRes.cookies.set(name, value, options);
        }
      },
    },
  });

  // Fluxo:
  // - se vier "code" -> exchangeCodeForSession(code)
  // - se vier "token_hash" -> verifyOtp({ type, token_hash })
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          "/auth/error?error=" +
            encodeURIComponent(
              "Link inválido/expirado. Solicite um novo e-mail."
            ),
          url
        )
      );
    }

    return redirectRes;
  }

  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    return NextResponse.redirect(
      new URL(
        "/auth/error?error=" +
          encodeURIComponent("Link inválido/expirado. Solicite um novo e-mail."),
        url
      )
    );
  }

  // Persistência defensiva: se o verifyOtp trouxe session, força setSession
  // para disparar escrita de cookies no SSR bridge.
  if (data?.session?.access_token && data?.session?.refresh_token) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }

  return redirectRes;
}
