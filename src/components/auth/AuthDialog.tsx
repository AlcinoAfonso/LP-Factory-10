"use client";

import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Login, SignUp, ResetPassword } from "@supabase/ui";

interface Props {
  open: boolean;
  mode: "login" | "signup" | "reset";
  onClose: () => void;
}

export default function AuthDialog({ open, mode, onClose }: Props) {
  const router = useRouter();

  const handleSuccess = () => {
    onClose();
    router.push("/a"); // middleware decide conta ou onboarding
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {mode === "login" && <Login onSuccess={handleSuccess} />}
      {mode === "signup" && <SignUp onSuccess={handleSuccess} />}
      {mode === "reset" && <ResetPassword onSuccess={handleSuccess} />}
    </Dialog>
  );
}
