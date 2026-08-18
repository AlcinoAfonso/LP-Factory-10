export default function LandingPagePreviewLoading() {
  return (
    <main className="min-w-0 bg-surface-app px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-[90rem] animate-pulse space-y-5" aria-busy="true" aria-label="Carregando preview privado">
        <div className="h-40 rounded-2xl border border-surface-border bg-white shadow-card" />
        <div className="aspect-[4/5] rounded-[1.75rem] border border-surface-border bg-white shadow-card sm:aspect-video" />
      </div>
    </main>
  );
}
