"use client";

import { Dialog } from "@/components/ui/dialog";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";

// definimos manualmente os modos válidos do <Auth />
type AuthMode = "sign_in" | "sign_up" | "forgotten_password";

interface Props {
  open: boolean;
  mode?: AuthMode;
  onClose: () => void;
}

export default function AuthDialog({ open, mode = "sign_in", onClose }: Props) {
  const supabase = createClient();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        view={mode}
        magicLink={false}
        redirectTo="/a"
      />
    </Dialog>
  );
}
