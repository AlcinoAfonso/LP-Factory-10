// /middleware.ts — só sessão + persistência da última conta (sem redirects)
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const res = await updateSession(request);

  // Persistir preferência APENAS quando o usuário visita /a/{sub} (≠ home)
  if (
    request.method === "GET" &&
    pathname.startsWith("/a/") &&
    pathname !== "/a/home" &&
    pathname !== "/a/home/"
  ) {
    const sub = pathname.split("/")[2] ?? "";
    if (sub && sub !== "home") {
      const isProd = process.env.NODE_ENV === "production";
      res.cookies.set("last_account_subdomain", sub, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        secure: isProd,
      });
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
