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
import { useState, useEffect } from 'react'
import { onPasswordResetCompleted } from '@/src/lib/auth/tab-sync'
import { useRouter } from 'next/navigation'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resetCompleted, setResetCompleted] = useState(false)
  const router = useRouter()
  
  // Escuta evento de conclusão do reset na outra aba
  useEffect(() => {
    if (!success || resetCompleted) return
    
    const cleanup = onPasswordResetCompleted(() => {
      setResetCompleted(true)
      // Aguarda 2 segundos mostrando sucesso, depois redireciona
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    })
    
    // Limpa listener após 10 minutos ou quando componente desmontar
    const timeout = setTimeout(cleanup, 600000)
    
    return () => {
      cleanup()
      clearTimeout(timeout)
    }
  }, [success, resetCompleted, router])
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    
    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {resetCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">✓ Senha Redefinida com Sucesso</CardTitle>
            <CardDescription>Sua senha foi alterada com sucesso</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Redirecionando para o login...
            </p>
          </CardContent>
        </Card>
      ) : success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you registered using your email and password, you will receive a password reset
              email.
            </p>
            <p className="text-xs text-muted-foreground">
              Esta aba será atualizada automaticamente quando você concluir a redefinição de senha.
            </p>
            <div className="mt-4 text-center text-sm">
              <Link href="/auth/login" className="underline underline-offset-4">
                Voltar ao login
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>
              Type in your email and we&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
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
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send reset email'}
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
      )}
    </div>
  )
}
