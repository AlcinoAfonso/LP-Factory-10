// src/components/auth/AuthDialog.tsx
"use client";

import { Dialog } from "@/components/ui/dialog";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";

export type AuthMode = "login" | "signup" | "reset";

interface Props {
  open: boolean;
  onClose: () => void;
  mode?: AuthMode; // opcional; default login
}

export default function AuthDialog({ open, onClose, mode = "login" }: Props) {
  const supabase = createClient();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // fecha quando o usuário fecha o modal
        if (!v) onClose();
      }}
    >
      <div className="p-4">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view={mode}
          magicLink={false}
          // ajuste este redirect conforme sua rota pós-login (middleware cobre)
          redirectTo="/a"
        />
      </div>
    </Dialog>
  );
}
