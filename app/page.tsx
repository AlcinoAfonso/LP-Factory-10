// app/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/auth/login");
  }

  // Sem resolver Access Context aqui.
  // Canonicalização para /a; a escolha da conta acontecerá em /a/page.tsx.
  redirect("/a");
}
