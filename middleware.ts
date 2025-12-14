// /middleware.ts — sessão + persistência da última conta (SEM redirects pesados)
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ /a e /a/home também precisam passar pelo updateSession (senão InPrivate “vira público”)
  // (removido o bypass que fazia NextResponse.next())

  // 🔹 Para /a/{sub} (exceto 'home'): atualiza sessão e grava cookie de última conta
  if (request.method === "GET" && pathname.startsWith("/a/")) {
    const segs = pathname.split("/");
    const sub = segs[2] || "";

    if (sub && sub !== "home") {
      const res = await updateSession(request);
      const isProd = process.env.NODE_ENV === "production";

      res.cookies.set("last_account_subdomain", sub, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        secure: isProd,
      });

      return res;
    }
  }

  // 🔹 Demais rotas: garante sessão/cookies
  return await updateSession(request);
}

export const config = {
  matcher: [
    // apenas exclui estáticos
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
