import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return NextResponse.next();
  }

  const { pathname, search } = req.nextUrl;
  const normalized = pathname.endsWith("/") && pathname !== "/" 
    ? pathname.slice(0, -1) 
    : pathname;
  
  if (normalized === "/a/preview") {
    const url = new URL("/a", req.url);
    url.search = search;
    return NextResponse.redirect(url, 307);
  }
  
  if (normalized === "/a") {
    const url = new URL("/a/preview", req.url);
    url.search = search;
    return NextResponse.rewrite(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/a", "/a/:path*"],
};
