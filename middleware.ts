import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// Rodar só em /a e /a/ (não interfere em /auth/*)
export const config = { matcher: ["/a", "/a/"] };
