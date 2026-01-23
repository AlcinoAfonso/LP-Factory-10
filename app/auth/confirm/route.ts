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

// Normaliza variações vindas do template/link.
// Hoje o seu e-mail chega com `type=email`.
// Para o Supabase verifyOtp, isso precisa virar um EmailOtpType válido.
function normalizeEmailOtpType(v: string): EmailOtpType | null {
  if (v === "email") return "signup";
  return isValidEmailOtpType(v) ? v : null;
}

function validatePassword(pw: string, confirm: string): string | null {
  if (!pw || !confirm) return "Preencha os dois campos.";
  if (pw !== confirm) return "As senhas não coincidem.";
  if (pw.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  const hasNumber = /\d/.test(pw);
  const hasLetter = /[A-Za-z]/.test(pw);
  if (!hasNumber || !hasLetter) return "Use letras e números na senha.";
  return null;
}

function buildUpdatePasswordRedirect(
  baseUrl: URL,
  params: { token_hash?: string; code?: string; type?: string; e: string }
) {
  const u = new URL("/auth/update-password", baseUrl);
  if (params.token_hash) u.searchParams.set("token_hash", params.token_hash);
  if (params.code) u.searchParams.set("code", params.code);
  if (params.type) u.searchParams.set("type", params.type);
  u.searchParams.set("e", params.e);
  return u;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const token_hash = url.searchParams.get("token_hash") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const typeRaw = url.searchParams.get("type") ?? "";
  const type = normalizeEmailOtpType(typeRaw);

  const rawNext = url.searchParams.get("next");
  const next = isSafeInternal(rawNext)
    ? rawNext!
    : type === "recovery"
      ? "/auth/update-password"
      : "/a/home";

  if ((!token_hash && !code) || !type) {
    return NextResponse.redirect(
      new URL("/auth/error?error=No%20token%20hash/code%20or%20type", url)
    );
  }

  // Mitigação anti-scanner: sempre exige gesto do usuário (POST) quando o link chega aqui.
  // (No fluxo novo, o e-mail NÃO aponta para /auth/confirm, mas mantemos compatibilidade.)
  return new Response(interstitialHTML({ token_hash, code, type, next }), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const form = await req.formData();

  const token_hash = String(form.get("token_hash") || "");
  const code = String(form.get("code") || "");
  const typeRaw = String(form.get("type") || "");
  const type = normalizeEmailOtpType(typeRaw);

  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");

  const rawNext = String(form.get("next") || "");
  const next = isSafeInternal(rawNext)
    ? rawNext
    : type === "recovery"
      ? "/a"
      : "/a/home";

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

  // Caso novo: recovery + senha no POST (fluxo sem “Continuar”)
  const isRecoveryWithPassword = type === "recovery" && (!!password || !!confirm);

  // 1) Validar senha antes de consumir token
  if (isRecoveryWithPassword) {
    const validationError = validatePassword(password, confirm);
    if (validationError) {
      const back = buildUpdatePasswordRedirect(url, {
        token_hash,
        code,
        type: "recovery",
        e: encodeURIComponent(validationError),
      });
      return NextResponse.redirect(back, 303);
    }
  }

  // Importante: o mesmo NextResponse que receberá os cookies
  const redirectRes = NextResponse.redirect(new URL(next, url), 303);
  redirectRes.headers.set("Cache-Control", "no-store, max-age=0");
  redirectRes.headers.set("Pragma", "no-cache");

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

  // 2) Consumir token somente no POST (verify/exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      if (type === "recovery") {
        const back = buildUpdatePasswordRedirect(url, {
          token_hash,
          code,
          type: "recovery",
          e: encodeURIComponent("Link inválido/expirado. Solicite um novo e-mail."),
        });
        return NextResponse.redirect(back, 303);
      }
      return NextResponse.redirect(
        new URL(
          "/auth/error?error=" +
            encodeURIComponent("Link inválido/expirado. Solicite um novo e-mail."),
          url
        )
      );
    }
  } else {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) {
      if (type === "recovery") {
        const back = buildUpdatePasswordRedirect(url, {
          token_hash,
          type: "recovery",
          e: encodeURIComponent("Link inválido/expirado. Solicite um novo e-mail."),
        });
        return NextResponse.redirect(back, 303);
      }
      return NextResponse.redirect(
        new URL(
          "/auth/error?error=" +
            encodeURIComponent("Link inválido/expirado. Solicite um novo e-mail."),
          url
        )
      );
    }

    // Persistência defensiva: se o verifyOtp trouxe session, força setSession
    if (data?.session?.access_token && data?.session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }
  }

  // 3) Se for recovery com senha, atualiza aqui e finaliza em /a/home
  if (isRecoveryWithPassword) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      const msg =
        error.message === "Auth session missing!"
          ? "Sessão ausente. Solicite um novo link de recuperação."
          : error.message;

      const back = buildUpdatePasswordRedirect(url, {
        token_hash,
        code,
        type: "recovery",
        e: encodeURIComponent(msg),
      });
      return NextResponse.redirect(back, 303);
    }

    return redirectRes;
  }

  // 4) Outros tipos (signup/magiclink/invite/email_change) mantêm comportamento atual
  return redirectRes;
}
