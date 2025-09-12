// app/a/page.tsx
// Landing pública de /a — não depende de contexto/sessão e não redireciona.
export const dynamic = 'force-static';

export default function AIndexPublic() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold mb-3">LP Factory — Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Esta é a landing pública do dashboard. Entre ou crie sua conta para continuar.
      </p>
      <div className="flex gap-3">
        <a
          href="/auth/login"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Entrar
        </a>
        <a
          href="/auth/sign-up"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Criar conta
        </a>
      </div>
    </main>
  );
}
