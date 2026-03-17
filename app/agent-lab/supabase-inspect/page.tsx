import { SupabaseInspectChat } from "@/components/agent/SupabaseInspectChat";

export default function SupabaseInspectAgentLabPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Agent Lab — Supabase Inspect</h1>
        <p className="text-sm text-muted-foreground">
          Página isolada para validar a sessão do workflow
          <code className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">
            wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7
          </code>
          via ChatKit.
        </p>
      </header>

      <SupabaseInspectChat />
    </main>
  );
}
