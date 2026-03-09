// app/auth/update-password/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormFieldError, FormFieldHint, FormFieldLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
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

type UpdatePasswordSearchParams = {
  e?: string;
  token_hash?: string;
  type?: string;
  code?: string;
};

export default async function UpdatePasswordPage(props: any) {
  const searchParams = (props.searchParams
    ? await props.searchParams
    : undefined) as UpdatePasswordSearchParams | undefined;

  const errorMsg = searchParams?.e ? decodeURIComponent(searchParams.e) : null;

  const token_hash = searchParams?.token_hash || "";
  const type = searchParams?.type || "";
  const code = searchParams?.code || "";

  const isRecoveryTokenFlow =
    type === "recovery" && (token_hash.length > 0 || code.length > 0);

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

          {!isRecoveryTokenFlow ? (
            <div className="rounded-lg border border-border bg-accent/40 p-3 text-sm text-muted-foreground">
              Este link não contém um token de recuperação. Se você abriu esta página diretamente,
              solicite um novo link em <a className="underline" href="/auth/forgot-password">Esqueci minha senha</a>.
            </div>
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
          ) : (
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
          )}
        </CardContent>
      </Card>
    </main>
  );
}
