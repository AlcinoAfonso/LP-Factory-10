import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="text-2xl font-semibold">Página não encontrada</h2>
      <p className="mt-2 text-gray-600">O recurso solicitado não existe.</p>
      <Link href="/account" className="mt-6 inline-block rounded-xl bg-gray-900 px-4 py-2 text-white">
        Voltar para /account
      </Link>
    </main>
  );
}
