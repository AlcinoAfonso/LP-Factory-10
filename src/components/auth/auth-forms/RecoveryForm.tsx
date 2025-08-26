diff --git a/src/components/auth/auth-forms/RecoveryForm.tsx b/src/components/auth/auth-forms/RecoveryForm.tsx
index 4f33c5e..1a2f7bb 100644
--- a/src/components/auth/auth-forms/RecoveryForm.tsx
+++ b/src/components/auth/auth-forms/RecoveryForm.tsx
@@ -1,10 +1,13 @@
 "use client";
-import { useEffect, useMemo, useRef, useState } from "react";
+import { useEffect, useRef, useState } from "react";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { supabase } from "@/lib/supabase/client";
 
+type RemoteEvent = { type: "opened" | "success" | "expired" | "used" };
+
 type Props = {
   onBackToLogin?: () => void;
 };
 
 export default function RecoveryForm({ onBackToLogin }: Props) {
   const [email, setEmail] = useState("");
   const [sending, setSending] = useState(false);
   const [sent, setSent] = useState(false);
   const [cooldown, setCooldown] = useState(0);
   const [info, setInfo] = useState<string | null>(null);
+  const closeTimer = useRef<number | null>(null);
 
   // Cooldown simples de 30s
   useEffect(() => {
     if (cooldown <= 0) return;
     const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
     return () => clearTimeout(t);
   }, [cooldown]);
 
+  // Listener da outra aba (reset)
+  useEffect(() => {
+    let bc: BroadcastChannel | null = null;
+    try {
+      bc = new BroadcastChannel("lp-auth-reset");
+      bc.onmessage = (ev: MessageEvent<RemoteEvent>) => {
+        const kind = ev?.data?.type;
+        if (!kind) return;
+        if (kind === "opened") setInfo("Abrimos o link em outra aba; continue por lá.");
+        if (kind === "expired") setInfo("O link expirou. Reenvie um novo e-mail por aqui.");
+        if (kind === "used") setInfo("Este link já foi usado. Reenvie um novo e-mail.");
+        if (kind === "success") {
+          setInfo("Processo concluído. Vamos fechar este diálogo.");
+          if (closeTimer.current) window.clearTimeout(closeTimer.current);
+          closeTimer.current = window.setTimeout(() => onBackToLogin?.(), 2000);
+        }
+      };
+    } catch {}
+    return () => {
+      if (bc) { bc.onmessage = null; bc.close(); }
+      if (closeTimer.current) window.clearTimeout(closeTimer.current);
+    };
+  }, [onBackToLogin]);
+
   async function handleSend() {
     setInfo(null);
     setSending(true);
     try {
       const { error } = await supabase.auth.resetPasswordForEmail(email, {
         redirectTo: `${window.location.origin}/auth/reset`,
       });
       if (error) {
         setInfo("Se este e-mail estiver cadastrado, você receberá instruções.");
       } else {
         setSent(true);
         setInfo("Se este e-mail estiver cadastrado, você receberá instruções.");
         setCooldown(30);
       }
     } finally {
       setSending(false);
     }
   }
 
   return (
     <div className="space-y-4">
       <div>
         <Label htmlFor="email">E-mail</Label>
         <Input
           id="email"
           type="email"
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           placeholder="seu@email.com"
         />
       </div>
-      {info && <p className="text-sm text-muted-foreground">{info}</p>}
+      {info && <p className="text-sm text-muted-foreground">{info}</p>}
       <div className="flex gap-2">
         <Button onClick={handleSend} disabled={sending || cooldown > 0}>
           {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Enviar e-mail de redefinição"}
         </Button>
         <Button variant="ghost" onClick={onBackToLogin}>
           Voltar ao login
         </Button>
       </div>
     </div>
   );
 }
