'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useEffect, useMemo, useState } from 'react'

type ForgotPasswordFormProps = React.ComponentProps<'div'>

const COOLDOWN_MS = 5 * 60 * 1000
const STORAGE_KEY = 'lp10_forgot_password_cooldown_until'

function isValidEmail(email: string) {
  // simples e suficiente para UX (sem regex "perfeita")
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function readCooldownUntil(): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function writeCooldownUntil(ts: number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, String(ts))
}

export function ForgotPasswordForm({ className, ...props }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const now = useMemo(() => Date.now(), [])

  const inCooldown = useMemo(() => {
    if (!cooldownUntil) return false
    return Date.now() < cooldownUntil
  }, [cooldownUntil])

  const remainingSeconds = useMemo(() => {
    if (!cooldownUntil) return 0
    const ms = cooldownUntil - Date.now()
    return ms > 0 ? Math.ceil(ms / 1000) : 0
  }, [cooldownUntil])

  useEffect(() => {
    const stored = readCooldownUntil()
    if (stored && stored > Date.now()) setCooldownUntil(stored)
  }, [now])

  useEffect(() => {
    if (!cooldownUntil) return
    if (Date.now() >= cooldownUntil) return

    const t = window.setInterval(() => {
      if (cooldownUntil && Date.now() >= cooldownUntil) {
        setCooldownUntil(null)
        writeCooldownUntil(0)
      }
    }, 500)

    return () => window.clearInterval(t)
  }, [cooldownUntil])

  async function startCooldown() {
    const until = Date.now() + COOLDOWN_MS
    setCooldownUntil(until)
    writeCooldownUntil(until)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const trimmed = email.trim()

    if (!isValidEmail(trimmed)) {
      setError('E-mail inválido.')
      return
    }

    if (inCooldown) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Recovery cai direto em /auth/update-password (sem querystring). O token é verificado no POST /auth/confirm.
      const redirectTo = new URL('/auth/update-password', window.location.origin).toString()

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
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>
            Informe seu e-mail. Se ele estiver cadastrado, enviaremos um link para redefinição.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}

            {success ? (
              <p className="text-sm text-green-700">
                Se este e-mail estiver cadastrado, você receberá um link para redefinição.
              </p>
            ) : null}

            {inCooldown ? (
              <p className="text-sm text-muted-foreground">
                Aguarde {remainingSeconds}s para solicitar novamente.
              </p>
            ) : null}

            <Button type="submit" disabled={isLoading || inCooldown}>
              {isLoading ? 'Enviando...' : 'Enviar link'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          Dica: verifique sua caixa de spam/lixo eletrônico.
        </CardFooter>
      </Card>
    </div>
  )
}
