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

function logAuth(event: string, payload: Record<string, unknown>) {
  // SUPA-05/VERCE-10: logs estruturados, sem PII
  // Não logar email, token_hash, code.
  try {
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        ts: new Date().toISOString(),
        event,
        ...payload,
      })
    );
  } catch {
    // eslint-disable-next-line no-console
    console.info(event);
  }
}

function interstitialHTML(params: {
  token_hash: string;
  code: string;
  type: string;
  next: string;
  rid: string;
}) {
  const th = escAttr(params.token_hash);
  const cd = escAttr(params.code);
  const ty = escAttr(params.type);
  const nx = escAttr(params.next);
  const rid = escAttr(params.rid);

  return `<!doctype html><html><head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta name="referrer" content="no-referrer"/>
    <title>Confirmando...</title>
  </head>
  <body style="display:flex;min-height:100dvh;align-items:center;justify-content:center;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b0b0b;color:#fff">
    <div style="width:min(420px,92vw);padding:20px;border:1px solid rgba(255,255,255,.15);border-radius:14px;background:rgba(255,255,255,.06)">
      <div style="font-size:18px;font-weight:600;margin-bottom:8px">Confirmando…</div>
      <div style="font-size:14px;opacity:.85;margin-bottom:14px">Aguarde. Estamos validando seu link.</div>

      <form id="f" method="POST" action="/auth/confirm" style="display:flex;gap:8px;flex-direction:column;align-items:stretch">
        <input type="hidden" name="token_hash" value="${th}"/>
        <input type="hidden" name="code" value="${cd}"/>
        <input type="hidden" name="type" value="${ty}"/>
        <input type="hidden" name="next" value="${nx}"/>
        <input type="hidden" name="rid" value="${rid}"/>

        <noscript>
          <div style="font-size:13px;opacity:.9;margin:10px 0">
            Seu navegador bloqueou scripts. Clique para continuar.
          </div>
          <button type="submit" style="padding:.75rem 1rem;border-radius:.75rem;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer">
            Continuar
          </button>
        </noscript>
      </form>

      <script>
        (function () {
          try {
            var f = document.getElementById('f');
            if (!f) return;
            // Auto-avança sem clique (mantém consumo do token SOMENTE no POST)
            requestAnimationFrame(function () { f.submit(); });
          } catch (e) {}
        })();
      </script>
    </div>
  </body></html>`;
}

function isValidEmailOtpType(v: string): v is EmailOtpType {
  return (
    v === "signup" ||
    v === "invite" ||
    v === "magiclink" ||
    v === "recovery" ||
    v === "email_change" ||
    // IMPORTANTE: usado em links de confirmação (token_hash=pkce_...&type=email)
    v === "email"
  );
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
  const type = isValidEmailOtpType(typeRaw) ? typeRaw : null;

  const rid = url.searchParams.get("rid") ?? "";

  const rawNext = url.searchParams.get("next");
  const next = isSafeInternal(rawNext)
    ? rawNext!
    : type === "recovery"
      ? "/auth/update-password"
      : "/a/home";

  logAuth("auth_confirm_get", {
    rid,
    has_token_hash: !!token_hash,
    has_code: !!code,
    type: typeRaw,
    type_valid: !!type,
    next,
  });

  if ((!token_hash && !code) || !type) {
    return NextResponse.redirect(
      new URL("/auth/error?error=No%20token%20hash/code%20or%20type", url)
    );
  }

  // Mitigação anti-scanner: token é consumido SOMENTE no POST.
  // UX: sem clique manual (auto-avança) com fallback (noscript).
  return new Response(interstitialHTML({ token_hash, code, type, next, rid }), {
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
  const code = String(form.get("code") || "");
  const typeRaw = String(form.get("type") || "");
  const type = isValidEmailOtpType(typeRaw) ? (typeRaw as EmailOtpType) : null;

  const rid = String(form.get("rid") || "");

  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");

  const rawNext = String(form.get("next") || "");
  const next = isSafeInternal(rawNext)
    ? rawNext
    : type === "recovery"
      ? "/a"
      : "/a/home";

  logAuth("auth_confirm_post_start", {
    rid,
    has_token_hash: !!token_hash,
    has_code: !!code,
    type: typeRaw,
    type_valid: !!type,
    next,
    has_password_fields: !!password || !!confirm,
  });

  if ((!token_hash && !code) || !type) {
    logAuth("auth_confirm_post_error", {
      rid,
      reason: "missing_token_or_type",
    });

    return NextResponse.redirect(
      new URL("/auth/error?error=No%20token%20hash/code%20or%20type", url)
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logAuth("auth_confirm_post_error", {
      rid,
      reason: "missing_supabase_config",
    });

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
      logAuth("auth_confirm_post_error", {
        rid,
        reason: "password_validation_failed",
      });

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
      logAuth("auth_confirm_post_error", {
        rid,
        reason: "exchange_code_for_session_failed",
      });

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
      logAuth("auth_confirm_post_error", {
        rid,
        reason: "verify_otp_failed",
      });

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
      logAuth("auth_confirm_post_error", {
        rid,
        reason: "update_user_password_failed",
      });

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

    logAuth("auth_confirm_post_ok", {
      rid,
      type: typeRaw,
      next,
      recovery_password_set: true,
    });

    return redirectRes;
  }

  // 4) Outros tipos (signup/magiclink/invite/email_change) mantêm comportamento atual
  logAuth("auth_confirm_post_ok", {
    rid,
    type: typeRaw,
    next,
  });

  return redirectRes;
}
