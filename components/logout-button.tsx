// components/logout-button.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Alinhado ao E7.2/C3: volta ao shell público (/a/home)
    router.push('/a/home');
  };

  return (
    <Button onClick={logout}>
      Sair
    </Button>
  );
}
