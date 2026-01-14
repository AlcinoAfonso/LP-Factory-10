// app/auth/update-password/page.tsx
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

// Fallback legado: quando o usuário chega aqui já com sessão válida
// (ex.: fluxo antigo que passava por /auth/confirm e criava sessão).
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
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-1">Defina sua nova senha</h1>
      <p className="text-sm text-gray-600 mb-4">
        A senha deve ter pelo menos 8 caracteres e conter letras e números.
      </p>

      {errorMsg ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      {!isRecoveryTokenFlow ? (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          Este link não contém um token de recuperação. Se você abriu esta página
          diretamente, solicite um novo link em{" "}
          <a className="underline" href="/auth/forgot-password">
            Esqueci minha senha
          </a>
          .
        </div>
      ) : null}

      {isRecoveryTokenFlow ? (
        // Fluxo novo (sem “Continuar”): POST direto para /auth/confirm
        <form method="POST" action="/auth/confirm" className="grid gap-3">
          <input type="hidden" name="type" value="recovery" />
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="code" value={code} />
          <input type="hidden" name="next" value="/a/home" />

          <label className="grid gap-1">
            <span className="text-sm font-medium">Nova senha</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2"
              autoComplete="new-password"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Confirmar nova senha</span>
            <input
              name="confirm"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2"
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Salvar nova senha
          </button>
        </form>
      ) : (
        // Fallback legado (com sessão): mantém comportamento antigo
        <form action={updatePasswordWithSessionAction} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Nova senha</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2"
              autoComplete="new-password"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Confirmar nova senha</span>
            <input
              name="confirm"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2"
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Salvar nova senha
          </button>
        </form>
      )}
    </main>
  );
}
