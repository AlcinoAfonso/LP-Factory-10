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
  const token_hash = String(formData.get('token_hash') || '')
  const type       = (String(formData.get('type') || 'recovery') as 'recovery')

  // 1) Validação local
  const validationError = validatePassword(password, confirm)
  if (validationError) {
    redirect(
      `/auth/update-password?e=${encodeURIComponent(validationError)}${
        token_hash ? `&token_hash=${encodeURIComponent(token_hash)}&type=${type}` : ''
      }`
    )
  }

  const supabase = await createClient()

  // 2) Garantir sessão apenas no SUBMIT (consome o token UMA vez aqui)
  let { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (token_hash && type === 'recovery') {
      const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
      if (error || !data?.user) {
        redirect(
          `/auth/update-password?e=${encodeURIComponent('Este link expirou ou já foi usado. Solicite um novo e-mail.')}`
        )
      }
      // Sessão estabelecida pelo verifyOtp
      const refreshed = await supabase.auth.getUser()
      user = refreshed.data.user
    }
  }

  if (!user) {
    redirect(
      `/auth/update-password?e=${encodeURIComponent('Sessão ausente. Solicite um novo e-mail de redefinição.')}`
    )
  }

  // 3) Atualizar senha
  const { error: updErr } = await supabase.auth.updateUser({ password })
  if (updErr) {
    const msg = updErr.message === 'Auth session missing!'
      ? 'Sessão ausente. Solicite um novo e-mail de redefinição.'
      : 'Não foi possível salvar a nova senha. Tente novamente.'
    redirect(
      `/auth/update-password?e=${encodeURIComponent(msg)}`
    )
  }

  // 4) Sucesso → rota limpa
  redirect('/a/home')
}

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams?: { e?: string; token_hash?: string; type?: string }
}) {
  // 📌 IMPORTANTE:
  // Não chamamos verifyOtp aqui (GET). Apenas lemos mensagens e preservamos token na URL.
  const errorMsg = searchParams?.e
  const tokenHash = searchParams?.token_hash
  const type = searchParams?.type ?? 'recovery'

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
        {/* Mantemos os params apenas para o SUBMIT consumir o token (sem verificar no GET) */}
        {tokenHash ? (
          <>
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="type" value={type} />
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

      <p className="mt-4 text-xs text-gray-500">
        Se o link estiver inválido/expirado, solicite um novo em{' '}
        <a href="/auth/forgot-password" className="underline">Esqueci minha senha</a>.
      </p>
    </main>
  )
}
