// app/auth/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Evita open-redirects
function isSafeInternal(path?: string | null) {
  if (!path) return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.includes('://')) return false
  return true
}

function pageHTML(opts: {
  title: string
  body: string
  token_hash?: string | null
  type?: string | null
  next?: string | null
}) {
  const { title, body, token_hash, type, next } = opts
  return `<!doctype html><html lang="pt-br"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;display:flex;min-height:100dvh;align-items:center;justify-content:center;background:#fff;color:#111}
.card{max-width:560px;margin:24px;padding:24px;border:1px solid #e5e7eb;border-radius:12px}
h1{font-size:20px;margin:0 0 8px}p{margin:8px 0}button{padding:10px 16px;border-radius:10px;border:1px solid #111;background:#111;color:#fff;cursor:pointer}
a{color:#111}</style></head><body>
<div class="card">
  <h1>${title}</h1>
  <p>${body}</p>
  <form method="POST" action="/auth/confirm" style="margin-top:16px;display:flex;gap:8px;align-items:center">
    ${token_hash ? `<input type="hidden" name="token_hash" value="${token_hash}"/>` : ''}
    <input type="hidden" name="type" value="${type || 'recovery'}"/>
    ${next && isSafeInternal(next) ? `<input type="hidden" name="next" value="${next}"/>` : ''}
    <button type="submit">Continuar</button>
  </form>
</div>
</body></html>`
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') || 'recovery'
  const next = url.searchParams.get('next')

  // Intersticial: só POST verifica o token (evita scanners)
  return new NextResponse(
    pageHTML({
      title: 'Confirmar acesso',
      body:
        'Clique em Continuar para confirmar sua solicitação com segurança.',
      token_hash,
      type,
      next,
    }),
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  )
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const token_hash = String(form.get('token_hash') || '')
  const type = (String(form.get('type') || 'recovery') as 'recovery')
  const next = String(form.get('next') || '')

  const supabase = await createClient()

  // Verifica token UMA única vez aqui (consome o token e cria a sessão)
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error || !data?.user) {
    return new NextResponse(
      pageHTML({
        title: 'Link inválido ou expirado',
        body:
          'Este link de acesso já foi usado ou expirou. Solicite um novo em <a href="/auth/forgot-password">Esqueci minha senha</a>.',
      }),
      { headers: { 'content-type': 'text/html; charset=utf-8' } }
    )
  }

  // Sucesso → segue para update-password SEM token na URL
  const safeNext =
    isSafeInternal(next) && next !== '/auth/confirm' ? next : '/auth/update-password'
  return NextResponse.redirect(new URL(safeNext, req.url))
}
