import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  FormField,
  FormFieldError,
  FormFieldHint,
  FormFieldLabel,
} from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  listAccountMembers,
  type AccountMember,
  type AccountMemberError,
  type ManageableMemberRole,
} from "@/lib/access/account-members";
import { isAccountMembersEnabled } from "@/lib/access/account-members/config";
import { requireAccountMembersManager } from "@/lib/access/guards";

import {
  changeMemberRoleAction,
  deactivateMemberAction,
  inviteMemberAction,
  resendMemberInviteAction,
  revokeMemberInviteAction,
} from "./actions";
import { MemberActionButton } from "./MemberActionButton";

type MembersPageProps = Readonly<{
  params: Promise<{ account: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}>;

const ROLE_LABELS: Record<ManageableMemberRole | "owner", string> = {
  owner: "Owner",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visualizador",
};

const NOTICE_MESSAGES: Readonly<Record<string, string>> = {
  invite_sent: "Convite enviado por e-mail.",
  invite_in_app: "Convite criado. O usuário já cadastrado poderá aceitá-lo na tela inicial.",
  invite_resent: "Um novo e-mail de convite foi solicitado.",
  role_changed: "Papel do membro atualizado.",
  member_deactivated: "Membro desativado.",
  invite_revoked: "Convite revogado.",
};

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const { account: rawAccount } = await params;
  const account = rawAccount.trim().toLowerCase();
  if (!isAccountMembersEnabled()) notFound();

  const guarded = await requireAccountMembersManager(account);
  if (!guarded.allowed) {
    if (guarded.reason === "unauthenticated") redirect("/auth/login");
    notFound();
  }

  const query = await searchParams;
  const queryError = query.error as AccountMemberError | undefined;
  const hasEmailError = queryError === "invalid_email";
  const hasRoleError = queryError === "invalid_role";
  const result = await listAccountMembers(guarded.context);
  const activeMembers = result.ok
    ? result.value.filter((member) => member.status === "active")
    : [];
  const pendingMembers = result.ok
    ? result.value.filter((member) => member.status === "pending")
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-8">
        <header className="space-y-2">
          <Link className="inline-block text-sm font-medium text-brand-700 hover:underline" href={`/a/${account}`}>
            Voltar para a página principal
          </Link>
          <p className="text-sm font-medium text-brand-700">Configurações da conta</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Membros e convites</h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Convide pessoas e administre os acessos desta conta. O papel de owner permanece protegido.
          </p>
        </header>

        {query.notice && NOTICE_MESSAGES[query.notice] ? (
          <FeedbackMessage tone="success">{NOTICE_MESSAGES[query.notice]}</FeedbackMessage>
        ) : null}
        {queryError && !hasEmailError && !hasRoleError ? (
          <FeedbackMessage tone="error">
            {memberErrorMessage(queryError)}
          </FeedbackMessage>
        ) : null}
        {!result.ok ? (
          <FeedbackMessage tone="error">{memberErrorMessage(result.error)}</FeedbackMessage>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6" aria-labelledby="invite-member-title">
          <div className="mb-5 space-y-1">
            <h2 id="invite-member-title" className="text-lg font-semibold">Convidar membro</h2>
            <p className="text-sm text-muted-foreground">
              Usuários novos recebem e-mail; usuários já cadastrados veem o convite na tela inicial.
            </p>
          </div>

          <form action={inviteMemberAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <input type="hidden" name="account" value={account} />
            <FormField>
              <FormFieldLabel htmlFor="member-email" required>E-mail</FormFieldLabel>
              <Input
                id="member-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={hasEmailError}
                aria-describedby={hasEmailError ? "member-email-hint member-email-error" : "member-email-hint"}
              />
              <FormFieldHint id="member-email-hint">Use o e-mail que identifica o usuário no acesso à plataforma.</FormFieldHint>
              {hasEmailError ? <FormFieldError id="member-email-error">{memberErrorMessage(queryError)}</FormFieldError> : null}
            </FormField>
            <FormField>
              <FormFieldLabel htmlFor="member-role" required>Papel</FormFieldLabel>
              <Select
                id="member-role"
                name="role"
                defaultValue="viewer"
                required
                aria-invalid={hasRoleError}
                aria-describedby={hasRoleError ? "member-role-error" : undefined}
              >
                <option value="admin">Administrador</option>
                <option value="editor">Editor</option>
                <option value="viewer">Visualizador</option>
              </Select>
              {hasRoleError ? <FormFieldError id="member-role-error">{memberErrorMessage(queryError)}</FormFieldError> : null}
            </FormField>
            <MemberActionButton pendingLabel="Enviando convite...">Enviar convite</MemberActionButton>
          </form>
        </section>

        {result.ok ? (
          <>
            <MemberSection
              title="Membros ativos"
              description="Pessoas que já possuem acesso a esta conta."
              emptyTitle="Nenhum membro ativo"
              members={activeMembers}
              account={account}
              actorUserId={guarded.context.actorUserId}
            />

            <MemberSection
              title="Convites pendentes"
              description="Convites que ainda não concedem acesso à conta."
              emptyTitle="Nenhum convite pendente"
              members={pendingMembers}
              account={account}
              actorUserId={guarded.context.actorUserId}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}

function MemberSection(props: Readonly<{
  title: string;
  description: string;
  emptyTitle: string;
  members: readonly AccountMember[];
  account: string;
  actorUserId: string;
}>) {
  return (
    <section className="space-y-4" aria-labelledby={`${props.title.toLowerCase().replaceAll(" ", "-")}-title`}>
      <div>
        <h2 id={`${props.title.toLowerCase().replaceAll(" ", "-")}-title`} className="text-xl font-semibold">
          {props.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
      </div>

      {props.members.length === 0 ? (
        <EmptyState title={props.emptyTitle} description="Esta lista será atualizada após uma ação concluída." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {props.members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              account={props.account}
              actorUserId={props.actorUserId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MemberCard(props: Readonly<{
  member: AccountMember;
  account: string;
  actorUserId: string;
}>) {
  const { member, account, actorUserId } = props;
  const isProtected = member.role === "owner" || member.userId === actorUserId;

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-all font-medium text-foreground">{member.email}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ROLE_LABELS[member.role]} · {member.status === "active" ? "Ativo" : "Pendente"}
          </p>
        </div>
        <span className="w-fit rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {member.status === "active" ? "Acesso ativo" : member.isConfirmed ? "Aceite no app" : "E-mail pendente"}
        </span>
      </div>

      {member.status === "active" ? (
        isProtected ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {member.role === "owner" ? "O owner não pode ser alterado nesta área." : "Seu próprio vínculo é protegido."}
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <form action={changeMemberRoleAction} className="flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="account" value={account} />
              <input type="hidden" name="member_id" value={member.id} />
              <FormField className="min-w-0 flex-1">
                <FormFieldLabel htmlFor={`role-${member.id}`}>Alterar papel</FormFieldLabel>
                <Select id={`role-${member.id}`} name="role" defaultValue={member.role}>
                  <option value="admin">Administrador</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Visualizador</option>
                </Select>
              </FormField>
              <div className="sm:self-end">
                <MemberActionButton pendingLabel="Salvando...">Salvar papel</MemberActionButton>
              </div>
            </form>
            <form action={deactivateMemberAction} className="sm:self-end">
              <input type="hidden" name="account" value={account} />
              <input type="hidden" name="member_id" value={member.id} />
              <MemberActionButton
                pendingLabel="Desativando..."
                confirmation="Desativar este membro e remover seu acesso à conta?"
                tone="danger"
              >
                Desativar membro
              </MemberActionButton>
            </form>
          </div>
        )
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!member.isConfirmed ? (
            <form action={resendMemberInviteAction}>
              <input type="hidden" name="account" value={account} />
              <input type="hidden" name="member_id" value={member.id} />
              <MemberActionButton pendingLabel="Reenviando...">Reenviar convite</MemberActionButton>
            </form>
          ) : null}
          <form action={revokeMemberInviteAction}>
            <input type="hidden" name="account" value={account} />
            <input type="hidden" name="member_id" value={member.id} />
            <MemberActionButton
              pendingLabel="Revogando..."
              confirmation="Revogar este convite pendente? O usuário não receberá acesso à conta."
              tone="danger"
            >
              Revogar convite
            </MemberActionButton>
          </form>
        </div>
      )}
    </article>
  );
}

function memberErrorMessage(error: AccountMemberError): string {
  const messages: Partial<Record<AccountMemberError, string>> = {
    invalid_email: "Informe um e-mail válido.",
    invalid_role: "Selecione um papel permitido.",
    already_member: "Este usuário já pertence à conta.",
    owner_protected: "O vínculo de owner é protegido.",
    actor_protected: "Você não pode alterar ou desativar seu próprio vínculo.",
    invalid_transition: "Esta ação não é permitida para o estado atual do membro.",
    membership_conflict: "O vínculo mudou durante a ação. Atualize a página e tente novamente.",
    auth_invite_failed: "O convite não foi enviado. A pendência foi preservada para uma nova tentativa.",
    external_config_missing: "A configuração externa do convite ainda não está disponível.",
    invite_state_unavailable: "Não foi possível preparar o estado seguro do convite.",
    feature_disabled: "A gestão de membros ainda não está disponível.",
  };
  return messages[error] ?? "Não foi possível concluir a ação com segurança. Tente novamente.";
}
