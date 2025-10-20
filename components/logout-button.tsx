'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  
  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/a/home')
  }
  
  return (
    <button 
      type="button"
      onClick={logout}
      aria-label="Sair da sessão"
      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
    >
      Sair
    </button>
  )
}
