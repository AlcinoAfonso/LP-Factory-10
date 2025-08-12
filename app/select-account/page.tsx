import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/src/lib/supabase/server";
import { chooseAccount } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Acc = { id: string; name: string; subdomain: string };

// Normaliza a relação: pode vir objeto (1:1) ou array (1:N)
function pickAccount(a: any): Acc | undefined {
  if (!a) return undefined;
  return (Array.isArray(a) ? a[0] : a) as Acc | undefined;
}

export default async function SelectAccountPage() {
  const supabase = getServerSupabase();

  // Auth
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) redirect("/login");

  // Contas ativas do usuário (RLS ON)
  const { data: rows, error } = await supabase
    .from("account_users")
    .select("role, status, accounts:accounts!inner(id, name, subdomain)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error || !rows || rows.length === 0) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Nenhuma conta encontrada</CardTitle>
            <CardDescription>
              Você não possui acesso a nenhuma conta ativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/login">Voltar ao login</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Lista de contas com Server Action para auditar e redirecionar
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Selecione uma conta</CardTitle>
            <CardDescription>Escolha a conta para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((r: any) => {
              const acc = pickAccount(r.accounts);
              if (!acc) return null;
              return (
                <form
                  key={acc.id}
                  action={chooseAccount}
                  className="rounded-2xl border p-4 flex items-center justify-between gap-4 hover:bg-accent hover:text-accent-foreground transition"
                >
                  <div>
                    <div className="font-semibold">{acc.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {acc.subdomain}
                    </div>
                  </div>
                  <input type="hidden" name="account_id" value={acc.id} />
                  <Button type="submit">Entrar</Button>
                </form>
              );
            })}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild variant="link">
            <Link href="/login">Trocar de usuário</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
