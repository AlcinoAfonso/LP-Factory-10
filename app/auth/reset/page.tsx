diff --git a/app/auth/reset/page.tsx b/app/auth/reset/page.tsx
index 1d2abc1..8a9f0d3 100644
--- a/app/auth/reset/page.tsx
+++ b/app/auth/reset/page.tsx
@@ -1,9 +1,12 @@
 "use client";
 
-import { useEffect, useState } from "react";
-import { useRouter, useSearchParams } from "next/navigation";
+import { useEffect, useState } from "react";
+import { useRouter, useSearchParams } from "next/navigation";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { supabase } from "@/lib/supabase/client";
 
+type LinkState = "idle" | "valid" | "expired" | "used" | "invalid" | "network_error";
+
 const hasUpper = (s: string) => /[A-Z]/.test(s);
 const hasLower = (s: string) => /[a-z]/.test(s);
 const hasDigit = (s: string) => /\d/.test(s);
@@ -13,14 +16,17 @@ export default function ResetPasswordPage() {
   const router = useRouter();
   const search = useSearchParams();
   const code = search.get("code"); // token do e-mail (quando presente)
 
   const [sessionReady, setSessionReady] = useState(false);
   const [tokenErr, setTokenErr] = useState<string | null>(null);
 
   const [pwd1, setPwd1] = useState("");
   const [pwd2, setPwd2] = useState("");
   const [loading, setLoading] = useState(false);
   const [msg, setMsg] = useState<string | null>(null);
   const [ok, setOk] = useState(false);
+  const [linkState, setLinkState] = useState<LinkState>("idle");
 
   // Troca o code do e-mail por sessão válida
   useEffect(() => {
     (async () => {
-      if (!code) {
-        setTokenErr("Link inválido. Solicite uma nova redefinição.");
-        return;
-      }
+      // Quando não há token no query, alguns provedores voltam com erros no query/hash.
+      const errQuery = search.get("error");
+      const errCodeQuery = search.get("error_code");
+      let errHash: string | null = null;
+      let errCodeHash: string | null = null;
+      if (typeof window !== "undefined" && window.location.hash) {
+        const hp = new URLSearchParams(window.location.hash.slice(1));
+        errHash = hp.get("error");
+        errCodeHash = hp.get("error_code");
+      }
+      const err = errQuery || errHash;
+      const errCode = errCodeQuery || errCodeHash;
+
+      if (!code) {
+        // Casos sem token: classificar por erro do callback (se houver)
+        if (errCode === "otp_expired") {
+          setLinkState("expired");
+          setTokenErr("Este link expirou.");
+          try { const bc = new BroadcastChannel("lp-auth-reset"); bc.postMessage({ type: "expired" }); setTimeout(() => bc.close(), 0); } catch {}
+          return;
+        }
+        if (err === "access_denied") {
+          setLinkState("invalid");
+          setTokenErr("Link inválido. Solicite uma nova redefinição.");
+          return;
+        }
+        // Acesso direto sem token/erro: tratar como inválido
+        setLinkState("invalid");
+        setTokenErr("Link inválido. Solicite uma nova redefinição.");
+        return;
+      }
 
       const { error } = await supabase.auth.exchangeCodeForSession(code);
       if (error) {
-        setTokenErr("O link expirou ou já foi usado. Solicite novamente.");
+        // Preferir status quando presente; fallback para mensagem
+        const anyErr = error as any;
+        if (anyErr?.status === 410) {
+          setLinkState("expired");
+          setTokenErr("Este link expirou.");
+          try { const bc = new BroadcastChannel("lp-auth-reset"); bc.postMessage({ type: "expired" }); setTimeout(() => bc.close(), 0); } catch {}
+          return;
+        }
+        if (anyErr?.status === 400) {
+          setLinkState("invalid");
+          setTokenErr("Link inválido. Solicite uma nova redefinição.");
+          return;
+        }
+        const m = (error.message || "").toLowerCase();
+        if (m.includes("used")) {
+          setLinkState("used");
+          setTokenErr("Este link já foi usado. Solicite nova redefinição.");
+          try { const bc = new BroadcastChannel("lp-auth-reset"); bc.postMessage({ type: "used" }); setTimeout(() => bc.close(), 0); } catch {}
+        } else if (m.includes("expire")) {
+          setLinkState("expired");
+          setTokenErr("Este link expirou.");
+          try { const bc = new BroadcastChannel("lp-auth-reset"); bc.postMessage({ type: "expired" }); setTimeout(() => bc.close(), 0); } catch {}
+        } else {
+          setLinkState("invalid");
+          setTokenErr("Link inválido. Solicite uma nova redefinição.");
+        }
         return;
       }
 
       // Avisar a outra aba que o link foi aberto (mitigação UX)
       try {
         const bc = new BroadcastChannel("lp-auth-reset");
         bc.postMessage({ type: "opened" });
         setTimeout(() => bc.close(), 0);
       } catch {
         /* ignore */
       }
 
-      setSessionReady(true);
+      setSessionReady(true);
+      setLinkState("valid");
     })();
-  }, [code]);
+  }, [code, search]);
 
   function validate(): string | null {
     if (pwd1.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
     if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
       return "Use ao menos 1 letra maiúscula, 1 minúscula e 1 número.";
     }
     if (pwd1 !== pwd2) return "As senhas não coincidem.";
     return null;
   }
@@ -64,6 +100,10 @@ export default function ResetPasswordPage() {
     setOk(true);
     setMsg("Senha atualizada com sucesso! Você será redirecionado.");
+    // notifica aba original sobre sucesso
+    try { const bc = new BroadcastChannel("lp-auth-reset"); bc.postMessage({ type: "success" }); setTimeout(() => bc.close(), 0); } catch {}
   }
 
   // Redirect automático após sucesso
   useEffect(() => {
     if (ok) {
       const t = setTimeout(() => router.push("/a"), 3000); // middleware envia para /a/demo
       return () => clearTimeout(t);
     }
   }, [ok, router]);
 
   // Estados
-  if (tokenErr) {
+  if (tokenErr && linkState !== "valid") {
     return (
       <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
         <h1 className="text-xl font-semibold">Redefinir senha</h1>
-        <p className="text-red-600">{tokenErr}</p>
+        <p className="text-red-600">{tokenErr}</p>
         <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
       </div>
     );
   }
