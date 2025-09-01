"use client";

import { Dialog } from "@/components/ui/dialog";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthDialog({ open, onClose }: Props) {
  const supabase = createClient();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        view="sign_in" // 🔧 mínimo, só login
        redirectTo="/a"
        magicLink={false}
      />
    </Dialog>
  );
}
