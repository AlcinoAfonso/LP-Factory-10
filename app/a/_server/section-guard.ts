import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { getUserEmail } from "@/lib/auth/authAdapter";

export async function getClientAccountSectionContext(slug: string) {
  const cleanSlug = (slug || "").trim().toLowerCase();

  const t0 = Date.now();
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;
  const route = `/a/${cleanSlug}`;

  const ctx = await getAccessContext({
    params: { account: cleanSlug },
    route,
    requestId,
  });

  const latency_ms = Date.now() - t0;

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      scope: "access_ctx",
      event: "access_context_ssr",
      route,
      account_id: ctx?.account?.id ?? null,
      request_id: requestId,
      outcome: !ctx ? "deny" : ctx.blocked ? "deny" : "allow",
      blocked: ctx?.blocked ?? null,
      member_status: ctx?.member?.status ?? null,
      account_status: ctx?.account?.status ?? null,
      latency_ms,
      ts: new Date().toISOString(),
    })
  );

  if (!ctx) {
    let userEmail: string | null = null;
    try {
      userEmail = await getUserEmail();
    } catch {
      userEmail = null;
    }

    if (userEmail) {
      redirect("/a/home?clear_last=1");
    }

    redirect("/auth/confirm/info");
  }

  if (ctx.blocked) {
    try {
      const cookieStore = await cookies();
      cookieStore.delete("last_account_subdomain");
    } catch {
      // best-effort
    }

    const ms = ctx.member?.status;
    if (ms === "pending") redirect("/auth/confirm/pending");
    if (ms === "inactive") redirect("/auth/confirm/inactive");
    if (ms === "revoked") redirect("/auth/confirm/revoked");

    if (ctx.error_code === "FORBIDDEN_ACCOUNT") {
      const as = ctx.account?.status;
      if (as === "inactive") redirect("/auth/confirm/account/inactive");
      if (as === "suspended") redirect("/auth/confirm/account/suspended");
      redirect("/auth/confirm/account");
    }

    redirect("/auth/confirm/account");
  }

  try {
    const subdomain = ctx.account?.subdomain;

    if (subdomain) {
      const cookieStore = await cookies();
      const isProd = process.env.NODE_ENV === "production";

      cookieStore.set("last_account_subdomain", subdomain, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });

      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          scope: "access_ctx",
          event: "last_account_cookie_set",
          route,
          account_subdomain: subdomain,
          request_id: requestId,
          ts: new Date().toISOString(),
        })
      );
    }
  } catch {
    // best-effort
  }

  return ctx;
}
