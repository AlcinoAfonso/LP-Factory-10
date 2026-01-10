// app/auth/confirm/route.ts
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Continuar</title></head><body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 32px; line-height: 1.4;"><main style="max-width: 520px; margin: 0 auto;"><h1 style="font-size: 20px; margin: 0 0 12px;">Confirmar para continuar</h1><p style="margin: 0 0 20px; color: #444;">Para sua segurança, confirme para prosseguir.</p><form method="POST" action="/auth/confirm"><input type="hidden" name="token_hash" value="${th}"/><input type="hidden" name="code" value="${cd}"/><input type="hidden" name="type" value="${ty}"/><input type="hidden" name="next" value="${nx}"/><button type="submit" style="padding: 10px 14px; border-radius: 10px; border: 1px solid #ddd; background: #111; color: #fff; cursor: pointer;">Continuar</button></form></main></body></html>`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const token_hash = url.searchParams.get("token_hash") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const type = (url.searchParams.get("type") ?? "") as EmailOtpType | "";
  const nextRaw = url.searchParams.get("next") ?? "/auth/update-password";
  const next = isSafeInternal(nextRaw) ? nextRaw : "/auth/update-password";

  // Intersticial: evita consumir token no GET (anti preview/scanner).
  return new NextResponse(
    interstitialHTML({ token_hash, code, type: String(type), next }),
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);

  const form = await req.formData();
  const token_hash = String(form.get("token_hash") ?? "");
  const code = String(form.get("code") ?? "");
  const type = String(form.get("type") ?? "") as EmailOtpType | "";
  const nextRaw = String(form.get("next") ?? "/auth/update-password");
  const next = isSafeInternal(nextRaw) ? nextRaw : "/auth/update-password";

  const cookieStore = await cookies();
  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options });
          });
        },
      },
    }
  );

  const redirectRes = NextResponse.redirect(new URL(next, url));

  // Aplica cookies gerados pelo supabase no response de redirect
  cookiesToSet.forEach(({ name, value, options }) => {
    redirectRes.cookies.set(name, value, options);
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

  // Chama verifyOtp para validar o token. Não captura a sessão retornada
  // porque referências diretas a tokens de sessão (como access/refresh) são bloqueadas pelo CI (security.yml).
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });
  if (verifyError) {
    return NextResponse.redirect(
      new URL(
        "/auth/error?error=" +
          encodeURIComponent("Link inválido/expirado. Solicite um novo e-mail."),
        url
      )
    );
  }

  return redirectRes;
}
