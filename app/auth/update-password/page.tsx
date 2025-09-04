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
  const password = String(formData.get('password') || '')
  const confirm = String(formData.get('confirm') || '')
  const validationError = validatePassword(password, confirm)
  if (validationError) {
    redirect(`/auth/update-password?e=${encodeURIComponent(validationError)}`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/error?error=${encodeURIComponent('Auth session missing! Solicite um novo e-mail de reset.')}`)
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    const msg = error.message === 'Auth session missing!'
      ? 'Sessão ausente. Solicite um novo e-mail de reset.'
      : error.message
    redirect(`/auth/update-password?e=${encodeURIComponent(msg)}`)
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

  // ⚡ Novo: se não há sessão mas veio token_hash=...&type=recovery, valida aqui
  if (!user && searchParams?.token_hash && searchParams?.type === 'recovery') {
    const { data, error } = await supabase.auth.verifyOtp({
      type: 'recovery',
      token_hash: searchParams.token_hash,
    })
    if (error) {
      return (
        <main className="max-w-md mx-auto p-6">
          <h1 className="text-2xl font-semibold mb-2">Redefinir senha</h1>
          <p className="text-sm text-red-600">Erro ao validar link: {error.message}</p>
        </main>
      )
    }
    // Após verifyOtp, cookies de sessão são aplicados via adapter do @supabase/ssr
    const refreshed = await supabase.auth.getUser()
    user = refreshed.data.user
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Redefinir senha</h1>
        <p className="text-sm text-gray-600">
          Sua sessão não foi encontrada. Por favor, volte à página de{' '}
          <a href="/auth/forgot-password" className="underline">esqueci minha senha</a> e solicite um novo e-mail.
        </p>
      </main>
    )
  }

  const errorMsg = searchParams?.e

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
        <label className="grid gap-1">
          <span className="text-sm font-medium">Nova senha</span>
          <input name="password" type="password" required className="w-full rounded-md border px-3 py-2" autoComplete="new-password" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Confirmar nova senha</span>
          <input name="confirm" type="password" required className="w-full rounded-md border px-3 py-2" autoComplete="new-password" />
        </label>

        <button type="submit" className="mt-2 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium">
          Salvar nova senha
        </button>
      </form>
    </main>
  )
}
