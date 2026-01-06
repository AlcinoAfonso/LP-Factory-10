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
import { useEffect, useMemo, useState } from 'react'

const COOLDOWN_MS = 5 * 60 * 1000
const STORAGE_KEY = 'lp10_forgot_password_cooldown_until'

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return `${mm}:${ss}`
}

function isValidEmail(email: string) {
  // Validação simples (evita falsos positivos óbvios)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  const remainingSeconds = useMemo(() => {
    if (!cooldownUntil) return 0
    const diff = Math.ceil((cooldownUntil - now) / 1000)
    return diff > 0 ? diff : 0
  }, [cooldownUntil, now])

  const inCooldown = remainingSeconds > 0

  useEffect(() => {
    // Recupera cooldown local (evita spam do botão ao recarregar)
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const val = raw ? Number(raw) : 0
      if (val && Number.isFinite(val) && val > Date.now()) {
        setCooldownUntil(val)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!cooldownUntil) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [cooldownUntil])

  useEffect(() => {
    if (!cooldownUntil) return
    if (remainingSeconds === 0) {
      setCooldownUntil(null)
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [cooldownUntil, remainingSeconds])

  async function startCooldown() {
    const until = Date.now() + COOLDOWN_MS
    setCooldownUntil(until)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(until))
    } catch {
      // ignore
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()

    if (!isValidEmail(trimmed)) {
      setError('E-mail inválido.')
      return
    }

    if (inCooldown) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Recovery deve passar por /auth/confirm para validar OTP e setar sessão
      const redirectTo = `${window.location.origin}/auth/confirm?next=/auth/update-password`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmed,
        { redirectTo }
      )

      if (resetError) {
        // Não expor detalhes (evita enumeração). Mas avisar falha real.
        setError('Não foi possível solicitar agora. Tente novamente em instantes.')
        setSuccess(false)
        return
      }

      setSuccess(true)
      await startCooldown()
    } catch {
      setError('Não foi possível solicitar agora. Tente novamente em instantes.')
      setSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>
            Enviaremos um link para redefinição, se este e-mail estiver cadastrado.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              {success && (
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-muted-foreground">
                    Se este e-mail estiver cadastrado, o link deve chegar em alguns minutos.
                    Verifique também Spam/Promoções.
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || inCooldown}>
                {isLoading
                  ? 'Enviando...'
                  : inCooldown
                    ? `Aguarde ${formatMMSS(remainingSeconds)}`
                    : success
                      ? 'Reenviar link'
                      : 'Enviar link'}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Já tem conta?{' '}
              <Link href="/auth/login" className="underline underline-offset-4">
                Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
