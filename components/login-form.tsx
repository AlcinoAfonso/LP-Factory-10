'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField, FormFieldError, FormFieldLabel } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

function sanitizeNext(next?: string | null): string {
  if (!next) return '/a/home'
  if (!next.startsWith('/')) return '/a/home'
  if (next.startsWith('//')) return '/a/home'
  return next
}

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      const safeNext = sanitizeNext(searchParams.get('next'))
      window.location.assign(safeNext)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocorreu um erro')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>Entre com seu e-mail e senha</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <FormField>
                <FormFieldLabel htmlFor="email">E-mail</FormFieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>

              <FormField>
                <FormFieldLabel htmlFor="password">Senha</FormFieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {/* Mobile-safe: link abaixo do campo (não “colado” no label) */}
                <Link
                  href="/auth/forgot-password"
                  className="mt-2 inline-block text-sm underline underline-offset-4"
                >
                  Esqueci minha senha
                </Link>
              </FormField>

              {error && <FormFieldError>{error}</FormFieldError>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{' '}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
