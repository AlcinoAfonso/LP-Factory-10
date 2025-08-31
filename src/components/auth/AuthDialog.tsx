"use client";

import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";

interface Props {
  open: boolean;
  mode?: "login" | "signup" | "reset";
  onClose: () => void;
}

export default function AuthDialog({ open, mode = "login", onClose }: Props) {
  const router = useRouter();
  const supabase = createClient();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        view={mode}
        redirectTo="/a"
        magicLink={false}
      />
    </Dialog>
  );
}
