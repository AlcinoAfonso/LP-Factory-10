// app/auth/update-password/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormFieldError, FormFieldHint, FormFieldLabel } from "@/components/ui/form-field";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import {
  getAccountMemberInviteDestination,
  respondToAccountMemberInvite,
  validateAccountMemberInvite,
} from "@/lib/access/account-members";
import { isAccountMembersEnabled } from "@/lib/access/account-members/config";
import {
  getInviteStateCookieName,
  verifySignedInviteState,
} from "@/lib/access/account-members/invite-state";
import { shouldDiscardInviteStateAfterActivationError } from "@/lib/access/account-members/policy";
import { requireAuthenticatedAccountMemberUser } from "@/lib/access/guards";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function validatePassword(pw: string, confirm: string): string | null {
  if (!pw || !confirm) return "Preencha os dois campos.";
  if (pw !== confirm) return "As senhas não coincidem.";
  if (pw.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  const hasNumber = /\d/.test(pw);
  const hasLetter = /[A-Za-z]/.test(pw);
  if (!hasNumber || !hasLetter) return "Use letras e números na senha.";
  return null;
}

async function updatePasswordWithSessionAction(formData: FormData) {
  "use server";

  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  const validationError = validatePassword(password, confirm);
  if (validationError) {
    redirect(`/auth/update-password?e=${encodeURIComponent(validationError)}`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/auth/update-password?e=${encodeURIComponent(
        "Sessão ausente. Solicite um novo link de recuperação."
      )}`
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const msg =
      error.message === "Auth session missing!"
        ? "Sessão ausente. Solicite um novo link de recuperação."
        : error.message;

    redirect(`/auth/update-password?e=${encodeURIComponent(msg)}`);
  }

  redirect("/a/home");
}

async function completeAccountMemberInviteAction(formData: FormData) {
  "use server";

  const inviteId = String(formData.get("invite") || "");
  if (!isAccountMembersEnabled()) {
    redirect("/auth/error?error=Convites%20indispon%C3%ADveis.");
  }

  const cookieName = getInviteStateCookieName(inviteId);
  if (!cookieName) {
    redirect("/auth/error?error=Contexto%20de%20convite%20inv%C3%A1lido.");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value ?? "";
  const inviteState = verifySignedInviteState(token);
  if (!inviteState.ok || inviteState.value.account_user_id !== inviteId) {
    await clearInviteStateCookie(cookieName);
    redirect("/auth/error?error=Contexto%20de%20convite%20inv%C3%A1lido.");
  }

  const authenticated = await requireAuthenticatedAccountMemberUser();
  if (!authenticated.allowed || authenticated.context.actorUserId !== inviteState.value.user_id) {
    await clearInviteStateCookie(cookieName);
    redirect("/auth/error?error=Contexto%20de%20convite%20inv%C3%A1lido.");
  }

  const membership = await validateAccountMemberInvite(authenticated.context, {
    accountId: inviteState.value.account_id,
    memberId: inviteState.value.account_user_id,
  });
  if (!membership.ok) {
    if (membership.error === "member_not_found" || membership.error === "invalid_transition") {
      await clearInviteStateCookie(cookieName);
    }
    redirect(invitePasswordErrorPath(inviteId, "Não foi possível validar este convite."));
  }

  if (membership.value.status === "active") {
    await clearInviteStateCookie(cookieName);
    const destination = await getAccountMemberInviteDestination(
      authenticated.context,
      inviteState.value.account_id,
    );
    redirect(destination.ok ? `/a/${destination.value}` : "/a/home");
  }

  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  const validationError = validatePassword(password, confirm);
  if (validationError) redirect(invitePasswordErrorPath(inviteId, validationError));

  const supabase = await createClient();
  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    redirect(invitePasswordErrorPath(inviteId, "Não foi possível definir a senha. Tente novamente."));
  }

  const activated = await respondToAccountMemberInvite(authenticated.context, {
    accountId: inviteState.value.account_id,
    memberId: inviteState.value.account_user_id,
    operation: "accept",
  });
  if (!activated.ok) {
    if (shouldDiscardInviteStateAfterActivationError(activated.error)) {
      await clearInviteStateCookie(cookieName);
      redirect(invitePasswordErrorPath(inviteId, "Este convite não pode mais ser concluído."));
    }
    redirect(invitePasswordErrorPath(inviteId, "Senha definida. Tente concluir o convite novamente."));
  }

  await clearInviteStateCookie(cookieName);
  const destination = await getAccountMemberInviteDestination(
    authenticated.context,
    inviteState.value.account_id,
  );
  redirect(destination.ok ? `/a/${destination.value}` : "/a/home");
}

async function clearInviteStateCookie(cookieName: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 0,
  });
}

function invitePasswordErrorPath(inviteId: string, message: string): string {
  return `/auth/update-password?invite=${encodeURIComponent(inviteId)}&e=${encodeURIComponent(message)}`;
}

type UpdatePasswordSearchParams = {
  e?: string;
  token_hash?: string;
  type?: string;
  code?: string;
  invite?: string;
};

export default async function UpdatePasswordPage(props: any) {
  const searchParams = (props.searchParams
    ? await props.searchParams
    : undefined) as UpdatePasswordSearchParams | undefined;

  const errorMsg = searchParams?.e ? decodeURIComponent(searchParams.e) : null;

  const token_hash = searchParams?.token_hash || "";
  const type = searchParams?.type || "";
  const code = searchParams?.code || "";
  const inviteId = searchParams?.invite || "";

  const isRecoveryTokenFlow =
    type === "recovery" && (token_hash.length > 0 || code.length > 0);
  const isInviteFlow = Boolean(inviteId) && isAccountMembersEnabled();
  const isDisabledInviteFlow = Boolean(inviteId) && !isAccountMembersEnabled();

  return (
    <main className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Defina sua nova senha</CardTitle>
          <CardDescription>
            A senha deve ter pelo menos 8 caracteres e conter letras e números.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMsg ? <FormFieldError>{errorMsg}</FormFieldError> : null}

          {!isRecoveryTokenFlow && !isInviteFlow ? (
            <FeedbackMessage tone="warning">
              {isDisabledInviteFlow ? (
                "O fluxo de convites ainda não está disponível."
              ) : (
                <>
                  Este link não contém um token de recuperação. Se você abriu esta página diretamente,
                  solicite um novo link em{" "}
                  <a className="underline" href="/auth/forgot-password">Esqueci minha senha</a>.
                </>
              )}
            </FeedbackMessage>
          ) : null}

          {isRecoveryTokenFlow ? (
            <form method="POST" action="/auth/confirm" className="grid gap-4">
              <input type="hidden" name="type" value="recovery" />
              <input type="hidden" name="token_hash" value={token_hash} />
              <input type="hidden" name="code" value={code} />
              <input type="hidden" name="next" value="/a/home" />

              <FormField>
                <FormFieldLabel htmlFor="password" required>
                  Nova senha
                </FormFieldLabel>
                <Input id="password" name="password" type="password" required autoComplete="new-password" />
              </FormField>

              <FormField>
                <FormFieldLabel htmlFor="confirm" required>
                  Confirmar nova senha
                </FormFieldLabel>
                <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
                <FormFieldHint>A senha deve conter letras e números.</FormFieldHint>
              </FormField>

              <Button type="submit" className="w-full">Salvar nova senha</Button>
            </form>
          ) : isInviteFlow ? (
            <form action={completeAccountMemberInviteAction} className="grid gap-4">
              <input type="hidden" name="invite" value={inviteId} />

              <FormField>
                <FormFieldLabel htmlFor="password" required>
                  Crie sua senha
                </FormFieldLabel>
                <Input id="password" name="password" type="password" required autoComplete="new-password" />
              </FormField>

              <FormField>
                <FormFieldLabel htmlFor="confirm" required>
                  Confirmar senha
                </FormFieldLabel>
                <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
                <FormFieldHint>A senha deve conter letras e números.</FormFieldHint>
              </FormField>

              <Button type="submit" className="w-full">Concluir cadastro</Button>
            </form>
          ) : !isDisabledInviteFlow ? (
            <form action={updatePasswordWithSessionAction} className="grid gap-4">
              <FormField>
                <FormFieldLabel htmlFor="password" required>
                  Nova senha
                </FormFieldLabel>
                <Input id="password" name="password" type="password" required autoComplete="new-password" />
              </FormField>

              <FormField>
                <FormFieldLabel htmlFor="confirm" required>
                  Confirmar nova senha
                </FormFieldLabel>
                <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
                <FormFieldHint>A senha deve conter letras e números.</FormFieldHint>
              </FormField>

              <Button type="submit" className="w-full">Salvar nova senha</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
