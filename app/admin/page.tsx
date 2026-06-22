import Link from 'next/link';

export default function AdminPage() {
  return (
    <>
      <header className="border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/a/home"
            aria-label="Ir para inicio"
            className="inline-flex items-center rounded-md border border-brand-600/20 bg-brand-50 px-2.5 py-1 text-sm font-semibold tracking-wide text-brand-700 transition-colors hover:border-brand-600/35 hover:bg-brand-50/70"
          >
            LP Factory
          </Link>

          <nav className="flex flex-wrap items-center gap-3">
            <Link
              href="/auth/login?next=%2Fadmin%2Fcontas"
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-4.75rem)] max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-brand-700">
          Area administrativa
        </p>
        <h1 className="max-w-xs text-2xl font-semibold leading-tight tracking-tight text-foreground sm:max-w-full sm:text-3xl md:text-4xl">
          Admin Dashboard <span className="block sm:inline">LP Factory</span>
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-6 text-gray-600 sm:max-w-2xl sm:text-base sm:leading-7">
          Acesse a area interna de acompanhamento operacional da plataforma.
        </p>
        <Link
          href="/auth/login?next=%2Fadmin%2Fcontas"
          className="mt-8 inline-flex items-center justify-center rounded-md border border-brand-600/30 bg-brand-50 px-5 py-2.5 text-sm font-medium text-brand-700 shadow-sm transition-colors hover:bg-brand-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Entrar no admin
        </Link>
      </main>
    </>
  );
}
