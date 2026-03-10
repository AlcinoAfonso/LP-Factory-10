import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <LoadingState label="Carregando Account Dashboard…" />
    </div>
  );
}
