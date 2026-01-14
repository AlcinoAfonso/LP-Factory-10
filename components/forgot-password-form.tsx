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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // cooldown simples para evitar spam
  const COOLDOWN_SECONDS = 60
  const [cooldownLeft, setCooldownLeft] = useState(0)

  const inCooldown = cooldownLeft > 0

  useEffect(() => {
    if (!inCooldown) return
    const id = setInterval(() => {
      setCooldownLeft((v) => (v > 0 ? v - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [inCooldown])

  const cooldownLabel = useMemo(() => {
    if (!inCooldown) return null
    return `Aguarde ${cooldownLeft}s para tentar novamente.`
  }, [inCooldown, cooldownLeft])

  async function startCooldown() {
    setCooldownLeft(COOLDOWN_SECONDS)
    // garante ao menos 1 tick (evita “0s” visual em alguns devices)
    await sleep(10)
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

      // Commit 2 (Item 4): redirectTo direto para /auth/update-password (sem querystring).
      const redirectTo = `${window.location.origin}/auth/update-password`

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
                  placeholder="nome@exemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error ? (
                <div className="text-sm text-red-600">{error}</div>
              ) : null}

              {success ? (
                <div className="text-sm text-green-600">
                  Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.
                </div>
              ) : null}

              {cooldownLabel ? (
                <div className="text-xs text-muted-foreground">{cooldownLabel}</div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading || inCooldown}>
                {isLoading ? 'Enviando…' : 'Enviar link de redefinição'}
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
