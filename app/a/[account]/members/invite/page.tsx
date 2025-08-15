"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function InvitePage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin"|"editor"|"viewer">("viewer");
  const [msg, setMsg] = useState("");
  const pathname = usePathname();
  const slug = pathname.split("/")[2] || ""; // /a/[account]/members/invite

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Enviando...");
    const res = await fetch(`/api/invite?account=${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const out = await res.json();
    setMsg(out.ok ? "Convite enviado" : `Erro: ${out.error}`);
  }

  return (
    <form onSubmit={submit} className="p-6 space-y-3 max-w-md">
      <h1 className="text-xl font-semibold">Convidar usuário</h1>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email@exemplo.com" className="border p-2 w-full" required />
      <select value={role} onChange={(e)=>setRole(e.target.value as any)} className="border p-2 w-full">
        <option value="admin">admin</option>
        <option value="editor">editor</option>
        <option value="viewer">viewer</option>
      </select>
      <button className="border px-4 py-2 rounded">Enviar convite</button>
      <div className="text-sm text-muted-foreground">{msg}</div>
    </form>
  );
}
