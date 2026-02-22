'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

function newRid() {
  try {
    // browsers modernos
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

function buildEmailRedirectTo(rid: string) {
  const u = new URL('/auth/confirm', window.location.origin)
  u.searchParams.set('next', '/a/home')
  if (rid) u.searchParams.set('rid', rid)
  return u.toString()
}

function logAuth(event: string, payload: Record<string, unknown>) {
  // SUPA-05: logs estruturados, sem PII (não logar email/senha)
  try {
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        ts: new Date().toISOString(),
        event,
        ...payload,
      })
    )
  } catch {
    // eslint-disable-next-line no-console
    console.info(event)
  }
}

function normalizeErrMessage(err: unknown): string {
  if (!err) return 'An error occurred'
  if (err instanceof Error) return err.message || 'An error occurred'
  try {
    // @ts-expect-error - tentativa defensiva
    if (typeof err?.message === 'string') return err.message
  } catch {}
  return 'An error occurred'
}

function isRateLimitMessage(msg: string) {
  const m = msg.toLowerCase()
  return m.includes('rate limit') || m.includes('too many') || m.includes('exceeded')
}

function isAlreadyRegisteredMessage(msg: string) {
  const m = msg.toLowerCase()
  // mensagens típicas do Supabase
  return (
    m.includes('already registered') ||
    m.includes('already exists') ||
    m.includes('user already') ||
    m.includes('already been registered')
  )
}

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // CTA de resend aparece apenas quando faz sentido (erro "já cadastrado")
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendFeedback, setResendFeedback] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])
  const resendEnabled = useMemo(
    () => canResend && normalizedEmail.length > 0,
    [canResend, normalizedEmail]
  )

  const handleResend = async () => {
    if (!resendEnabled) return
    const supabase = createClient()

    setIsResending(true)
    setResendFeedback(null)
    setError(null)

    const rid = newRid()
    const emailRedirectTo = buildEmailRedirectTo(rid)

    logAuth('auth_signup_resend_submit', {
      rid,
      emailRedirectTo_path: '/auth/confirm',
      next: '/a/home',
    })

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { emailRedirectTo },
      })

      logAuth('auth_signup_resend_result', {
        rid,
        ok: !error,
        error_message: error ? String(error.message || 'error') : null,
      })

      if (error) throw error

      setResendFeedback('Enviamos um novo e-mail de confirmação. Verifique sua caixa de entrada e spam.')
    } catch (err) {
      const msg = normalizeErrMessage(err)
      if (isRateLimitMessage(msg)) {
        setResendFeedback('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else {
        setResendFeedback(msg)
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    setIsLoading(true)
    setError(null)
    setResendFeedback(null)
    setCanResend(false)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    const rid = newRid()
    const emailRedirectTo = buildEmailRedirectTo(rid)

    logAuth('auth_signup_submit', {
      rid,
      emailRedirectTo_path: '/auth/confirm',
      next: '/a/home',
    })

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo,
        },
      })

      logAuth('auth_signup_result', {
        rid,
        ok: !error,
        has_user: !!data?.user,
        has_session: !!data?.session,
        error_message: error ? String(error.message || 'error') : null,
      })

      if (error) throw error

      // Guardar apenas para UX (sem PII nos logs)
      try {
        sessionStorage.setItem('lp10_signup_email', normalizedEmail)
        sessionStorage.setItem('lp10_signup_rid', rid)
      } catch {}

      router.push('/auth/sign-up-success')
    } catch (err: unknown) {
      const msg = normalizeErrMessage(err)

      // Rate limit: instrução clara
      if (isRateLimitMessage(msg)) {
        setError('Muitas tentativas de envio de e-mail. Aguarde alguns minutos e tente novamente.')
        return
      }

      // Já cadastrado: orientar a confirmar e oferecer "resend" aqui (não na success page)
      if (isAlreadyRegisteredMessage(msg)) {
        setError(
          'Este e-mail já foi cadastrado. Se você ainda não confirmou, verifique sua caixa de entrada (e spam) ou reenvie o e-mail de confirmação.'
        )
        setCanResend(true)
        return
      }

      setError(msg || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              {canResend && (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full border border-input bg-background text-foreground shadow-sm hover:bg-accent"
                    onClick={handleResend}
                    disabled={!resendEnabled || isResending}
                  >
                    {isResending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
                  </Button>

                  {resendFeedback && (
                    <p className="text-sm text-muted-foreground">{resendFeedback}</p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating an account...' : 'Sign up'}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
