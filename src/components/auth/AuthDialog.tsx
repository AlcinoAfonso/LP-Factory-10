// src/components/auth/AuthDialog.tsx
"use client";

import { Dialog } from "@/components/ui/dialog";
import { Auth } from "@supabase/auth-ui-react";
import type { ViewType } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";

export type AuthMode = "login" | "signup" | "reset";

interface Props {
  open: boolean;
  onClose: () => void;
  mode?: AuthMode; // default login
}

const viewMap: Record<AuthMode, ViewType> = {
  login: "sign_in",
  signup: "sign_up",
  reset: "forgotten_password",
};

export default function AuthDialog({ open, onClose, mode = "login" }: Props) {
  const supabase = createClient();
  const view: ViewType = viewMap[mode];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <div className="p-4">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view={view}
          magicLink={false}
          redirectTo="/a"
        />
      </div>
    </Dialog>
  );
}
