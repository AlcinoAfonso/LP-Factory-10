import { NextResponse } from "next/server";

// Doc 10 + Sistema de Acesso 10.1 + Supabase docs (publishable/secret)
export function GET() {
  const okUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const okPub = !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const okSecret = !!process.env.SUPABASE_SECRET_KEY;

  return NextResponse.json({
    env: process.env.VERCEL_ENV || "local",
    NEXT_PUBLIC_SUPABASE_URL: okUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: okPub,
    SUPABASE_SECRET_KEY: okSecret
  });
}
