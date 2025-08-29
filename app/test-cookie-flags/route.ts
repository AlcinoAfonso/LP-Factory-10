import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const c = cookies();

  // Detecta ambiente atual
  const ENV = process.env.VERCEL_ENV || "local"; // "development" | "preview" | "production"

  // Variáveis de controle (Doc 10 + Sistema de Acesso 10.1)
  const COOKIE_DOMAIN =
    ENV === "production" ? process.env.COOKIE_DOMAIN : undefined;
  const OAUTH_MODE = process.env.OAUTH_COOKIE_SAMESITE || "lax"; // "lax" | "none"

  // Regras padrão
  const sameSite =
    OAUTH_MODE.toLowerCase() === "none" ? ("none" as const) : ("lax" as const);

  // Define cookie de teste
  c.set("lp10_test", "ok", {
    httpOnly: true,
    secure: ENV !== "local", // true em preview/prod
    sameSite,
    path: "/",
    domain: COOKIE_DOMAIN || undefined, // somente em prod
    maxAge: 60 * 10 // 10 minutos
  });

  return NextResponse.json({
    set: true,
    env: ENV,
    cookie: {
      httpOnly: true,
      secure: ENV !== "local",
      sameSite,
      domain: COOKIE_DOMAIN || null,
      path: "/",
      maxAge: 600
    },
    hint: "Confira em DevTools → Application → Cookies (flag Secure/HttpOnly/SameSite/Domain)."
  });
}
