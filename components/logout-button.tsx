'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  
  const logout = async () => {
    const intent = new CustomEvent("communication-base:leave", { cancelable: true, detail: { documentNavigation: false } })
    if (!window.dispatchEvent(intent)) return
    const supabase = createClient()
    await supabase.auth.signOut()
    if (intent.detail.documentNavigation) window.location.assign('/a/home')
    else router.push('/a/home')
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
