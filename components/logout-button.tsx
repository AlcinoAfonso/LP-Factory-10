// components/logout-button.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // ✅ ajuste simples
    router.push('/a/home')
  }

  return <Button onClick={logout}>Sair</Button>
}
