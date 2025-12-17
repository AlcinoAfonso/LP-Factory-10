// app/page.tsx
import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { createClient } from "@/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/auth/login");
  }

  const ctx = await getAccessContext();
  if (!ctx?.account_slug) {
    redirect("/onboarding/new");
  }

  redirect(`/a/${ctx.account_slug}`);
}
