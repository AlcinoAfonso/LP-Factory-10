// app/auth/update-password/PasswordResetSuccess.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PasswordResetSuccess({ fromEmail }: { fromEmail: boolean }) {
  const router = useRouter()

  useEffect(() => {
    // Se veio do email, emite evento para a outra aba
    if (fromEmail) {
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('lp-factory-auth')
          channel.postMessage({ type: 'password-reset-completed', timestamp: Date.now() })
          channel.close()
        } else {
          // Fallback para localStorage
          localStorage.setItem('lp-factory-auth-message', JSON.stringify({ 
            type: 'password-reset-completed', 
            timestamp: Date.now() 
          }))
          setTimeout(() => {
            try {
              localStorage.removeItem('lp-factory-auth-message')
            } catch (e) {
              // Ignora erro se localStorage não estiver disponível
            }
          }, 1000)
        }
      } catch (e) {
        console.error('Failed to emit reset completion:', e)
      }
    }

    // Redireciona após 1 segundo
    const timer = setTimeout(() => {
      router.push('/a/home')
    }, 1000)

    return () => clearTimeout(timer)
  }, [fromEmail, router])

  return (
    <main className="max-w-md mx-auto p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2 text-green-600">✓ Senha Atualizada</h1>
        <p className="text-sm text-gray-600 mb-4">Redirecionando...</p>
      </div>
    </main>
  )
}
