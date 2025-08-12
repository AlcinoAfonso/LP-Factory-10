// app/select-account/page.tsx
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
import {
  mapAccountFromDB,
  mapMemberFromDB,
  pickAccount,
  type DBAccountRow,
  type DBMemberRow,
} from "@/src/lib/access/adapters/accountAdapter";

export default async function SelectAccountPage() {
  const supabase = getServerSupabase();

  // Auth
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) redirect("/login");

  // Contas do usuário (RLS ON) + status do account para filtro (active|trial)
  const { data: rows, error } = await supabase
    .from("account_users")
    .select(`
      id, account_id, user_id, role, status, permissions,
      accounts:accounts!inner(id, name, subdomain, domain, status)
    `)
    .eq("user_id", user.id);

  if (error) {
    // Em produção, ideal: logar erro e mostrar um estado de erro amigável
    redirect("/blocked");
  }

  const items =
    (rows ?? [])
      .map((row: any) => {
        const accRow = pickAccount(row.accounts) as DBAccountRow | null;
        if (!accRow) return null;
        return {
          account: mapAccountFromDB(accRow),
          member: mapMemberFromDB(row as DBMemberRow),
        };
      })
      .filter(Boolean) as { account: ReturnType<typeof mapAccountFromDB>; member: ReturnType<typeof mapMemberFromDB> }[];

  // Mostrar apenas contas ativas ou em trial
  const visible = items.filter(
    (x) => x.account.status === "active" || x.account.status === "trial"
  );

  if (visible.length === 0) {
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

  // Lista com Server Action para auditar e redirecionar
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Selecione uma conta</CardTitle>
            <CardDescription>Escolha a conta para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visible.map(({ account }) => (
              <form
                key={account.id}
                action={chooseAccount}
                className="rounded-2xl border p-4 flex items-center justify-between gap-4 hover:bg-accent hover:text-accent-foreground transition"
              >
                <div>
                  <div className="font-semibold">{account.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {account.subdomain}
                  </div>
                </div>
                <input type="hidden" name="account_id" value={account.id} />
                <Button type="submit">Entrar</Button>
              </form>
            ))}
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
