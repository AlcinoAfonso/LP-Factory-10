// app/auth/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function interstitial(html: string) {
  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

const page = (title: string, body: string, hidden: string) => `<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title></head><body style="font-family:system-ui;display:flex;min-height:100dvh;align-items:center;justify-content:center">
<form method="POST" action="/auth/confirm" style="border:1px solid #e5e7eb;padding:16px;border-radius:12px">
<h1 style="margin:0 0 8px">${title}</h1><p>${body}</p>${hidden}<button type="submit">Continuar</button></form></body></html>`

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token_hash = url.searchParams.get('token_hash') || ''
  const type = url.searchParams.get('type') || 'recovery'
  const hidden = `
    <input type="hidden" name="token_hash" value="${token_hash}"/>
    <input type="hidden" name="type" value="${type}"/>`
  return interstitial(page('Confirmar acesso', 'Clique em Continuar para confirmar sua solicitação.', hidden))
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const token_hash = String(form.get('token_hash') || '')
  const type = (String(form.get('type') || 'recovery') as 'recovery')

  // Resposta mutável para o client gravar cookies
  const res = new NextResponse()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // chave pública (anon/publishable)
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set(name, value, options),
        remove: (name, options) => res.cookies.set(name, '', { ...options, maxAge: 0 }),
      },
    }
  )

  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
  if (error || !data?.user) {
    const html = page(
      'Link inválido ou expirado',
      'Este link já foi usado ou expirou. Peça um novo em <a href="/auth/forgot-password">Esqueci minha senha</a>.',
      ''
    )
    return interstitial(html)
  }

  // Sessão criada via cookies no `res` → segue para update-password LIMPO
  res.headers.set('location', '/auth/update-password')
  res.status = 302
  return res
}
