// app/a/page.tsx
// Landing pública — sem Supabase, sem Access Context, sem redirect automático.
export const dynamic = 'force-dynamic';

export default function AIndexPublic() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-3 text-3xl font-semibold">LP Factory — Dashboard</h1>
      <p className="mb-6 text-gray-600">
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
