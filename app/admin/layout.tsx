import { requireAdminSectionAccess } from "./_server/section-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSectionAccess();

  return (
    <div className="min-h-screen bg-surface-app">
      <nav className="border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-3">
            <span className="rounded-md border border-brand-600/20 bg-brand-50 px-2 py-1 text-xs font-semibold tracking-wide text-brand-700">
              LP Factory
            </span>
            <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
