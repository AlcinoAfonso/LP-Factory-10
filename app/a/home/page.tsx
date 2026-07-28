import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  listPendingAccountMemberInvites,
  type AccountMemberError,
  type PendingAccountMemberInvite,
} from "@/lib/access/account-members";
import { isAccountMembersEnabled } from "@/lib/access/account-members/config";
import { getFirstAccountForCurrentUser } from "@/lib/access/adapters/accessContextAdapter";
import { requireAuthenticatedAccountMemberUser } from "@/lib/access/guards";
import { getUserEmail } from "@/lib/auth/authAdapter";

import {
  acceptPendingMemberInviteAction,
  declinePendingMemberInviteAction,
} from "./member-invite-actions";
import { PendingInviteActionButton } from "./PendingInviteActionButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomeSearchParams = {
  clear_last?: string;
  invite_notice?: string;
  invite_error?: string;
};

export default async function HomePage(props: Readonly<{
  searchParams?: Promise<HomeSearchParams>;
}>) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const clearLast = searchParams?.clear_last === "1";
  const userEmail = await getUserEmail();

  if (userEmail) {
    if (isAccountMembersEnabled()) {
      const authenticated = await requireAuthenticatedAccountMemberUser();
      if (!authenticated.allowed) redirect("/auth/login");

      const pendingInvites = await listPendingAccountMemberInvites(authenticated.context);
      if (!pendingInvites.ok) {
        return <PendingInvitesReadError userEmail={userEmail} />;
      }
      if (pendingInvites.value.length > 0) {
        return (
          <PendingInvitesView
            userEmail={userEmail}
            invites={pendingInvites.value}
            notice={searchParams?.invite_notice}
            error={searchParams?.invite_error as AccountMemberError | undefined}
          />
        );
      }
    }

    const cookieStore = await cookies();
    const last = clearLast
      ? null
      : cookieStore.get("last_account_subdomain")?.value?.trim();

    if (last) redirect(`/a/${last}`);

    const accountSubdomain = await getFirstAccountForCurrentUser();
    if (accountSubdomain) redirect(`/a/${accountSubdomain}`);

    redirect("/auth/confirm/info");
  }

  return (
    <>
      <Header userEmail={null} />
      <main className="mx-auto max-w-3xl px-6 py-12 text-center">
        <h1 className="mb-2 text-3xl font-semibold">Bem-vindo ao LP Factory</h1>
        <p className="text-base text-gray-600">
          Crie páginas incríveis em minutos.{" "}
          <span className="font-medium text-gray-700">Comece agora.</span>
        </p>
      </main>
    </>
  );
}

function PendingInvitesView(props: Readonly<{
  userEmail: string;
  invites: readonly PendingAccountMemberInvite[];
  notice?: string;
  error?: AccountMemberError;
}>) {
  return (
    <>
      <Header userEmail={props.userEmail} accountMembersEnabled />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-6">
          <header className="space-y-2">
            <p className="text-sm font-medium text-brand-700">Acesso pendente</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Convites para você
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Aceite para entrar na conta ou recuse para remover a pendência.
            </p>
          </header>

          {props.notice === "accepted" ? (
            <FeedbackMessage tone="success">Convite aceito.</FeedbackMessage>
          ) : null}
          {props.notice === "declined" ? (
            <FeedbackMessage tone="success">
              Convite recusado e removido da lista.
            </FeedbackMessage>
          ) : null}
          {props.error ? (
            <FeedbackMessage tone="error">
              {pendingInviteErrorMessage(props.error)}
            </FeedbackMessage>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {props.invites.map((invite) => (
              <article
                key={invite.memberId}
                className="rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <h2 className="text-lg font-semibold text-foreground">
                  {invite.accountName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Papel proposto: {pendingInviteRoleLabel(invite.role)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Conta: {invite.accountSubdomain}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <form action={acceptPendingMemberInviteAction}>
                    <input type="hidden" name="account_id" value={invite.accountId} />
                    <input type="hidden" name="member_id" value={invite.memberId} />
                    <PendingInviteActionButton pendingLabel="Aceitando...">
                      Aceitar convite
                    </PendingInviteActionButton>
                  </form>
                  <form action={declinePendingMemberInviteAction}>
                    <input type="hidden" name="account_id" value={invite.accountId} />
                    <input type="hidden" name="member_id" value={invite.memberId} />
                    <PendingInviteActionButton
                      pendingLabel="Recusando..."
                      confirmation={`Recusar o convite para ${invite.accountName}? A pendência será revogada.`}
                      tone="danger"
                    >
                      Recusar convite
                    </PendingInviteActionButton>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function PendingInvitesReadError({ userEmail }: Readonly<{ userEmail: string }>) {
  return (
    <>
      <Header userEmail={userEmail} accountMembersEnabled />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <FeedbackMessage tone="error">
          Não foi possível verificar seus convites com segurança. Atualize a página para tentar novamente.
        </FeedbackMessage>
      </main>
    </>
  );
}

function pendingInviteRoleLabel(role: PendingAccountMemberInvite["role"]): string {
  return role === "admin" ? "Administrador" : role === "editor" ? "Editor" : "Visualizador";
}

function pendingInviteErrorMessage(error: AccountMemberError): string {
  if (error === "member_not_found" || error === "invalid_transition") {
    return "Este convite não está mais pendente ou não pertence ao usuário autenticado.";
  }
  if (error === "owner_protected") return "Convites de owner não são permitidos.";
  if (error === "feature_disabled") return "O fluxo de convites ainda não está disponível.";
  return "Não foi possível concluir a ação com segurança. Tente novamente.";
}
