'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const RESEND_COOLDOWN_SEC = 60

function newRid() {
  try {
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
  return (
    m.includes('already registered') ||
    m.includes('already exists') ||
    m.includes('user already') ||
    m.includes('already been registered')
  )
}

function getIdentitiesCount(user: unknown): number | null {
  try {
    // supabase-js: user.identities?: Identity[]
    // @ts-expect-error - leitura defensiva
    const identities = user?.identities
    return Array.isArray(identities) ? identities.length : null
  } catch {
    return null
  }
}

function formatMMSS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function extractCooldownSeconds(msg: string): number | null {
  const m = msg.toLowerCase()
  const match = m.match(/after\s+(\d+)\s+seconds?/)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')

  // Erros gerais (ex.: rate limit / validação)
  const [error, setError] = useState<string | null>(null)

  // Estado UX unificado: “Este e-mail já está cadastrado” (caso 2 e 3)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  // Resend: feedback + cooldown
  const [isResending, setIsResending] = useState(false)
  const [resendFeedback, setResendFeedback] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)
  const [cooldownLeft, setCooldownLeft] = useState<number>(0)

  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])

  // Se o usuário mudar o e-mail, limpamos o estado “já cadastrado”
  useEffect(() => {
    setAlreadyRegistered(false)
    setResendFeedback(null)
    setCooldownUntil(0)
    setCooldownLeft(0)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedEmail])

  // Timer do cooldown
  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownLeft(0)
      return
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setCooldownLeft(left)
      if (left === 0) setCooldownUntil(0)
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [cooldownUntil])

  const resendEnabled = useMemo(() => {
    return alreadyRegistered && normalizedEmail.length > 0 && cooldownLeft === 0
  }, [alreadyRegistered, normalizedEmail, cooldownLeft])

  const resendButtonLabel = useMemo(() => {
    if (isResending) return 'Reenviando...'
    if (cooldownLeft > 0) return `Reenviar em ${formatMMSS(cooldownLeft)}`
    return 'Reenviar confirmação'
  }, [isResending, cooldownLeft])

  const handleResend = async () => {
    if (!resendEnabled || isResending) return

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

      setResendFeedback('E-mail reenviado. Confira inbox e spam.')
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_SEC * 1000)
    } catch (err) {
      const msg = normalizeErrMessage(err)

      if (isRateLimitMessage(msg)) {
        const secs = extractCooldownSeconds(msg) ?? RESEND_COOLDOWN_SEC
        setResendFeedback('Muitas tentativas. Aguarde para tentar novamente.')
        setCooldownUntil(Date.now() + secs * 1000)
      } else {
        setResendFeedback(msg)
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleUseAnotherEmail = () => {
    // link discreto: volta para o formulário sem competir com o CTA primário
    setAlreadyRegistered(false)
    setResendFeedback(null)
    setCooldownUntil(0)
    setCooldownLeft(0)
    setError(null)
    setPassword('')
    setRepeatPassword('')
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    setIsLoading(true)
    setError(null)
    setResendFeedback(null)
    setAlreadyRegistered(false)
    setCooldownUntil(0)
    setCooldownLeft(0)

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
        options: { emailRedirectTo },
      })

      const identitiesCount = getIdentitiesCount(data?.user)

      logAuth('auth_signup_result', {
        rid,
        ok: !error,
        has_user: !!data?.user,
        has_session: !!data?.session,
        identities_count: identitiesCount,
        error_message: error ? String(error.message || 'error') : null,
      })

      if (error) throw error

      // Heurística MVP: ok=true + identities_count=0 => e-mail já cadastrado (caso 2 ou 3)
      if (identitiesCount === 0) {
        setAlreadyRegistered(true)
        return
      }

      // Guardar apenas para UX (sem PII nos logs)
      try {
        sessionStorage.setItem('lp10_signup_email', normalizedEmail)
        sessionStorage.setItem('lp10_signup_rid', rid)
      } catch {}

      router.push('/auth/sign-up-success')
    } catch (err: unknown) {
      const msg = normalizeErrMessage(err)

      if (isRateLimitMessage(msg)) {
        setError('Muitas tentativas de envio de e-mail. Aguarde alguns minutos e tente novamente.')
        return
      }

      // fallback por mensagem (caso Supabase devolva erro explícito)
      if (isAlreadyRegisteredMessage(msg)) {
        setAlreadyRegistered(true)
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
          {alreadyRegistered ? (
            <CardTitle className="text-2xl">Este e-mail já está cadastrado</CardTitle>
          ) : (
            <>
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>Create a new account</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {/* Estado dedicado (3.2): uma tarefa por tela */}
          {alreadyRegistered ? (
            <div className="flex flex-col gap-3">
              {/* Email opcional, read-only */}
              {normalizedEmail && (
                <div className="grid gap-2">
                  <Label htmlFor="email_ro">Email</Label>
                  <Input id="email_ro" type="email" value={normalizedEmail} readOnly />
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Se você ainda não confirmou, confira a caixa de entrada e o spam e clique no link.
              </p>
              <p className="text-sm text-muted-foreground">Se você já confirmou antes, faça login.</p>

              <Button
                type="button"
                className="w-full"
                onClick={handleResend}
                disabled={!resendEnabled || isResending}
              >
                {resendButtonLabel}
              </Button>

              {resendFeedback && <p className="text-sm text-muted-foreground">{resendFeedback}</p>}

              <div className="text-center">
                <Link href="/auth/login" className="text-sm underline underline-offset-4">
                  Fazer login
                </Link>
              </div>

              {/* Opcional, bem discreto */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleUseAnotherEmail}
                  className="text-xs text-muted-foreground underline underline-offset-4"
                >
                  Usar outro e-mail
                </button>
              </div>
            </div>
          ) : (
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

                {/* Erros gerais */}
                {error && <p className="text-sm text-red-500">{error}</p>}

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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
