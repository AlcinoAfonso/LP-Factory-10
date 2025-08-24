import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_ACCOUNT_SLUG = "demo";

export function middleware(req: NextRequest) {
  if (req.method !== "GET" && req.method !== "HEAD") return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (pathname === "/a" || pathname === "/a/") {
    const url = new URL(`/a/${CANONICAL_ACCOUNT_SLUG}`, req.url);
    url.search = search;
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/a"] };
