'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

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
  // SUPA-05: logs estruturados, sem PII
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

export default function Page() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [rid, setRid] = useState<string>('')
  const [isSending, setIsSending] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    try {
      const storedEmail = sessionStorage.getItem('lp10_signup_email') || ''
      const storedRid = sessionStorage.getItem('lp10_signup_rid') || ''
      if (storedEmail) setEmail(storedEmail)
      if (storedRid) setRid(storedRid)
    } catch {}
  }, [])

  const canResend = useMemo(() => email.trim().length > 0, [email])

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setFeedback('Email is required to resend the confirmation.')
      return
    }

    const resendRid = newRid()
    const emailRedirectTo = buildEmailRedirectTo(resendRid)

    setIsSending(true)
    setFeedback(null)

    logAuth('auth_signup_resend_submit', {
      rid: resendRid,
      emailRedirectTo_path: '/auth/confirm',
      next: '/a/home',
      prev_rid: rid || null,
    })

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { emailRedirectTo },
      })

      logAuth('auth_signup_resend_result', {
        rid: resendRid,
        ok: !error,
        error_message: error ? String(error.message || 'error') : null,
      })

      if (error) throw error

      try {
        sessionStorage.setItem('lp10_signup_email', normalizedEmail)
        sessionStorage.setItem('lp10_signup_rid', resendRid)
      } catch {}

      setRid(resendRid)
      setFeedback('Confirmation email sent. Check your inbox (and spam).')
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to resend confirmation email.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Thank you for signing up!</CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  You&apos;ve successfully signed up. Please check your email to confirm your account
                  before signing in.
                </p>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email used</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}

                <Button className="w-full" onClick={handleResend} disabled={isSending || !canResend}>
                  {isSending ? 'Sending...' : 'Resend confirmation email'}
                </Button>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
                  onClick={() => router.push('/auth/login')}
                >
                  Go to login
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
