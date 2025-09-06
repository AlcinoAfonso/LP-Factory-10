// app/auth/update-password/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emitPasswordResetCompleted } from '../../../src/lib/auth/tab-sync'

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

  const validationError = validatePassword(password, confirm)
  if (validationError) {
    redirect(
      `/auth/update-password?e=${encodeURIComponent(validationError)}${
        token_hash ? `&token_hash=${encodeURIComponent(token_hash)}&type=${type}` : ''
      }`
    )
  }

  const supabase = await createClient()

  // 1) Cria sessão usando o token (consome UMA ÚNICA vez) se ainda não houver
  let { data: { user } } = await supabase.auth.getUser()
  if (!user && token_hash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (error) {
      // Link inválido/expirado/ já usado
      redirect(`/auth/update-password?e=${encodeURIComponent('Link inválido ou expirado. Solicite um novo e-mail.')}`)
    }
    const refreshed = await supabase.auth.getUser()
    user = refreshed.data.user
  }

  // 2) Sem sessão => fluxo inválido
  if (!user) {
    redirect(`/auth/error?error=${encodeURIComponent('Auth session missing! Solicite um novo e-mail de reset.')}`)
  }

  // 3) Atualiza a senha
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

  // 4) Sucesso - Emitir evento para atualizar aba forgot-password
  // Só emite se veio do fluxo de email (tem token_hash)
  if (token_hash) {
    // Emite evento para a outra aba
    // Note: Este código roda no servidor, então precisamos fazer isso no cliente
    // Vamos adicionar um script inline que executa no cliente após o redirect
    const scriptContent = `
      <script>
        if (typeof window !== 'undefined') {
          try {
            // Tenta BroadcastChannel primeiro
            if ('BroadcastChannel' in window) {
              const channel = new BroadcastChannel('lp-factory-auth');
              channel.postMessage({ type: 'password-reset-completed', timestamp: Date.now() });
              channel.close();
            } else {
              // Fallback para localStorage
              localStorage.setItem('lp-factory-auth-message', JSON.stringify({ 
                type: 'password-reset-completed', 
                timestamp: Date.now() 
              }));
              setTimeout(() => localStorage.removeItem('lp-factory-auth-message'), 1000);
            }
          } catch (e) {
            console.error('Failed to emit reset completion:', e);
          }
          // Redireciona após emitir
          setTimeout(() => {
            window.location.href = '/a/home';
          }, 100);
        }
      </script>
    `
    // Como estamos em Server Component, vamos usar uma abordagem diferente
    // Vamos redirecionar para uma página intermediária que emite o evento
    redirect(`/auth/update-password?success=true&token=${encodeURIComponent(token_hash)}`)
  }

  // Redirect normal se não veio de email
  redirect('/a/home')
}

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams?: { e?: string; token_hash?: string; type?: string; success?: string; token?: string }
}) {
  // Se success=true, mostra mensagem de sucesso e emite evento
  if (searchParams?.success === 'true' && searchParams?.token) {
    return (
      <main className="max-w-md mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2 text-green-600">✓ Senha Atualizada</h1>
          <p className="text-sm text-gray-600 mb-4">Redirecionando...</p>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Emite evento para a aba forgot-password
              try {
                if ('BroadcastChannel' in window) {
                  const channel = new BroadcastChannel('lp-factory-auth');
                  channel.postMessage({ type: 'password-reset-completed', timestamp: Date.now() });
                  channel.close();
                } else {
                  localStorage.setItem('lp-factory-auth-message', JSON.stringify({ 
                    type: 'password-reset-completed', 
                    timestamp: Date.now() 
                  }));
                  setTimeout(() => localStorage.removeItem('lp-factory-auth-message'), 1000);
                }
              } catch (e) {
                console.error('Failed to emit:', e);
              }
              // Redireciona após emitir
              setTimeout(() => {
                window.location.href = '/a/home';
              }, 500);
            `
          }}
        />
      </main>
    )
  }
  
  // ⚠️ Não chamamos verifyOtp no GET para não consumir o token antes do submit
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
        {/* Passa o token para a Server Action garantir a sessão no submit */}
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
