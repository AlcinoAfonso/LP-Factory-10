export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-8">
        <div className="text-sm uppercase tracking-wide text-gray-500">LP Factory 10</div>
        <h1 className="mt-2 text-3xl font-semibold">Account Dashboard (pré‑acesso)</h1>
        <p className="mt-2 text-gray-600">
          Escolha uma opção para continuar.
        </p>
      </header>

      <div className="grid gap-4">
        <button
          id="btn-signin"
          data-intent="signin"
          type="button"
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-100"
        >
          Entrar
        </button>

        <button
          id="btn-create-account"
          data-intent="create-account"
          type="button"
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-100"
        >
          Criar conta
        </button>
      </div>

      <footer className="mt-12 text-xs text-gray-500">
        Esta página não requer login. Popups serão adicionados na próxima etapa.
      </footer>
    </main>
  );
}
