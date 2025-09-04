import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function isSafeInternal(path?: string | null) {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.includes('://')
}

function interstitialHTML(token_hash: string, type: string, next: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="display:flex;min-height:100dvh;align-items:center;justify-content:center;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <form method="POST" action="/auth/confirm" style="display:flex;gap:8px;flex-direction:column;align-items:center">
      <input type="hidden" name="token_hash" value="${token_hash}"/>
      <input type="hidden" name="type" value="${type}"/>
      <input type="hidden" name="next" value="${next}"/>
      <button type="submit" style="padding:.75rem 1rem;border-radius:.5rem;border:1px solid #ccc;cursor:pointer">Continuar</button>
    </form>
  </body></html>`
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const _next = url.searchParams.get('next')
  const next = isSafeInternal(_next) ? _next! : (type === 'recovery' ? '/auth/update-password' : '/')

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/auth/error?error=No%20token%20hash%20or%20type', url))
  }

  // Mitigação contra scanners
  const isUserGesture = req.headers.get('sec-fetch-user') === '?1'
  if (!isUserGesture) {
    return new Response(interstitialHTML(token_hash, type, next), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // Em vez de verificar aqui, redireciona com os parâmetros
  const dest = new URL(`${next}?token_hash=${encodeURIComponent(token_hash)}&type=${encodeURIComponent(type)}`, url)
  return NextResponse.redirect(dest)
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const token_hash = String(form.get('token_hash') || '')
  const type = String(form.get('type') || '') as EmailOtpType
  const rawNext = String(form.get('next') || '')
  const next = isSafeInternal(rawNext) ? rawNext : '/auth/update-password'
  const url = new URL(req.url)

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/auth/error?error=No%20token%20hash%20or%20type', url))
  }

  const dest = new URL(`${next}?token_hash=${encodeURIComponent(token_hash)}&type=${encodeURIComponent(type)}`, url)
  return NextResponse.redirect(dest)
}
