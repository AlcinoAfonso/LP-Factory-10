// app/auth/update-password/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function validatePassword(pw: string, confirm: string): string | null {
  if (!pw || !confirm) return 'Preencha os dois campos.'
  if (pw !== confirm) return 'As senhas não coincidem.'
  if (pw.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
  const hasNumber = /\d/.test(pw)
  const hasLetter = /[A-Za-z]/.test(pw)
  if (!hasNumber || !hasLetter) return 'Use letras e números na senha.'
  return null
}

async function updatePasswordAction(formData: FormData) {
  'use server'

  const password   = String(formData.get('password')   || '')
  const confirm    = String(formData.get('confirm')    || '')
  const token_hash = String(formData.get('token_hash') || '') // repassado só para manter a URL de retorno amigável
  const type       = (String(formData.get('type') || 'recovery') as 'recovery')

  const validationError = validatePassword(password, confirm)
  if (validationError) {
    redirect(
      `/auth/update-password?e=${encodeURIComponent(validationError)}${
        token_hash ? `&token_hash=${encodeURIComponent(token_hash)}&type=${type}` : ''
      }`
    )
  }

  const supabase = await createClient()

  // 👉 NUNCA revalida o token aqui. Se não há sessão, o link já expirou/foi usado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/error?error=${encodeURIComponent('Auth session missing! Solicite um novo e-mail de reset.')}`)
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    const msg = error.message === 'Auth session missing!'
      ? 'Sessão ausente. Solicite um novo e-mail de reset.'
      : error.message
    redirect(
      `/auth/update-password?e=${encodeURIComponent(msg)}${
        token_hash ? `&token_hash=${encodeURIComponent(token_hash)}&type=${type}` : ''
      }`
    )
  }

  redirect('/a/home')
}

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams?: { e?: string; token_hash?: string; type?: string }
}) {
  const supabase = await createClient()
  let { data: { user } } = await supabase.auth.getUser()
  const errorMsg = searchParams?.e

  // 1) Primeiro uso: se veio token_hash&type=recovery, valida aqui (consome o token UMA vez)
  if (!user && searchParams?.token_hash && searchParams?.type === 'recovery') {
    const { data, error } = await supabase.auth.verifyOtp({
      type: 'recovery',
      token_hash: searchParams.token_hash,
    })

    // 2) Expirado/já usado: mensagem imediata
    if (error || !data?.user) {
      return (
        <main className="max-w-md mx-auto p-6">
          <h1 className="text-2xl font-semibold mb-2">Redefinir senha</h1>
          <p className="text-sm text-gray-700">
            Este link de redefinição <strong>já expirou ou já foi usado</strong>.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Volte à página de{' '}
            <a href="/auth/forgot-password" className="underline">esqueci minha senha</a>{' '}
            e solicite um novo e-mail.
          </p>
        </main>
      )
    }

    // Sessão criada → atualiza o user para render do formulário
    const refreshed = await supabase.auth.getUser()
    user = refreshed.data.user
  }

  // 3) Render do formulário (com ou sem sessão; o submit exige sessão)
  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-1">Defina sua nova senha</h1>
      <p className="text-sm text-gray-600 mb-4">
        A senha deve ter pelo menos 8 caracteres e conter letras e números.
      </p>

      {errorMsg ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {decodeURIComponent(errorMsg)}
        </div>
      ) : null}

      <form action={updatePasswordAction} className="grid gap-3">
        {/* Mantemos o token no submit apenas para preservar a navegação/retorno amigável */}
        {searchParams?.token_hash ? (
          <>
            <input type="hidden" name="token_hash" value={searchParams.token_hash} />
            <input type="hidden" name="type" value={searchParams.type ?? 'recovery'} />
          </>
        ) : null}

        <label className="grid gap-1">
          <span className="text-sm font-medium">Nova senha</span>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-md border px-3 py-2"
            autoComplete="new-password"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Confirmar nova senha</span>
          <input
            name="confirm"
            type="password"
            required
            className="w-full rounded-md border px-3 py-2"
            autoComplete="new-password"
          />
        </label>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
        >
          Salvar nova senha
        </button>
      </form>
    </main>
  )
}
