import { LoadingState } from "@/components/ui/loading-state";

export default function MembersLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <LoadingState label="Carregando membros e convites..." />
    </main>
  );
}
