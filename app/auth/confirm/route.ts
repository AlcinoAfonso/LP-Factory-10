import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

function parseParams(url: string) {
  const { searchParams, origin } = new URL(url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/'
  return { token_hash, type, next, origin, searchParams }
}

// ── GET: mostra botão se não houver gesto humano; se houver, verifica direto
export async function GET(request: NextRequest) {
  const { token_hash, type, next, origin } = parseParams(request.url)
  if (!token_hash || !type) {
    return Response.redirect(
      new URL('/auth/error?error=No%20token%20hash%20or%20type', origin)
    )
  }

  // Gestos humanos em navegação enviam Sec-Fetch-User: ?1
  const isUserGesture = request.headers.get('sec-fetch-user') === '?1'

  if (!isUserGesture) {
    // Intersticial simples que exige clique (POST). Evita consumo por scanners.
    const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Confirmar acesso</title></head>
<body style="display:flex;min-height:100dvh;align-items:center;justify-content:center;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <form method="POST" action="/auth/confirm">
    <input type="hidden" name="token_hash" value="${token_hash}"/>
    <input type="hidden" name="type" value="${type}"/>
    <input type="hidden" name="next" value="${next}"/>
    <button type="submit" style="padding:.75rem 1rem;border-radius:.5rem;border:1px solid #ccc;cursor:pointer">
      Continuar
    </button>
  </form>
</body></html>`
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // Gesto humano → verifica diretamente
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash })
  if (!error) {
    return Response.redirect(new URL(next, origin))
  }
  return Response.redirect(
    new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, origin)
  )
}

// ── POST: só é disparado por clique humano no botão acima
export async function POST(request: NextRequest) {
  const form = await request.formData()
  const token_hash = String(form.get('token_hash') || '')
  const type = String(form.get('type') || '') as EmailOtpType
  const next = String(form.get('next') || '/')
  const { origin } = new URL(request.url)

  if (!token_hash || !type) {
    return Response.redirect(
      new URL('/auth/error?error=No%20token%20hash%20or%20type', origin)
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash })
  if (!error) {
    return Response.redirect(new URL(next, origin))
  }
  return Response.redirect(
    new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, origin)
  )
}
