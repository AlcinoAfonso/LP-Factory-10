"use client";

import { useActionState, useEffect, useState } from "react";

import type { AdminInputCatalogReview } from "@/lib/admin/adapters/adminReadOnlyTypes";
import { applyInputCatalogReviewPresentation } from "@/lib/admin/adapters/adminTaxonomyReviewPolicy";
import type { InputCatalogReviewActionState } from "../../actions";

type ReviewAction = (
  state: InputCatalogReviewActionState,
  formData: FormData,
) => Promise<InputCatalogReviewActionState>;

type Props = {
  review: Exclude<AdminInputCatalogReview, { status: "disabled" }>;
  taxonId: string;
  recordAction: ReviewAction;
  reopenAction: ReviewAction;
};

const initialState: InputCatalogReviewActionState = {
  error: null,
  reviewedVersion: null,
  reopened: false,
  revision: 0,
};

export function AdminTaxonInputCatalogReview({
  review,
  taxonId,
  recordAction,
  reopenAction,
}: Props) {
  const [recordState, recordFormAction, recordPending] = useActionState(recordAction, initialState);
  const [reopenState, reopenFormAction, reopenPending] = useActionState(reopenAction, initialState);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [presentation, setPresentation] = useState({
    reviewedVersion: review.status === "available" ? review.reviewedVersion : null,
    lastAction: null as "record" | "reopen" | null,
  });
  const [attemptedAction, setAttemptedAction] = useState<"record" | "reopen" | null>(null);

  useEffect(() => {
    if (!recordState.error && recordState.reviewedVersion !== null) {
      setPresentation((current) => applyInputCatalogReviewPresentation(current, {
        type: "record",
        reviewedVersion: recordState.reviewedVersion as number,
      }));
    }
  }, [recordState.error, recordState.reviewedVersion, recordState.revision]);

  useEffect(() => {
    if (!reopenState.error && reopenState.reopened) {
      setPresentation((current) => applyInputCatalogReviewPresentation(current, { type: "reopen" }));
    }
  }, [reopenState.error, reopenState.reopened, reopenState.revision]);

  if (review.status !== "available") {
    return (
      <section aria-labelledby="input-catalog-review-title" className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold text-card-foreground" id="input-catalog-review-title">
          Avaliar suficiência da E20.2
        </h2>
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {review.message}
        </p>
      </section>
    );
  }

  const availableReview = review;
  const reviewedVersion = presentation.reviewedVersion;
  const lastAction = presentation.lastAction;
  const busy = recordPending || reopenPending;
  const actionError = attemptedAction === "reopen" ? reopenState.error : recordState.error;

  async function copyHandoff() {
    try {
      await navigator.clipboard.writeText(availableReview.handoff);
      setCopyStatus("Instrução copiada. Continue a avaliação no Codex App.");
    } catch {
      setCopyStatus("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <section aria-labelledby="input-catalog-review-title" className="rounded-lg border border-border bg-card p-5 shadow-card">
      <h2 className="text-lg font-semibold text-card-foreground" id="input-catalog-review-title">
        Avaliar suficiência da E20.2
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Copie a instrução, conclua a análise no Codex App e só depois registre a versão E20.2 aceita por decisão humana.
      </p>

      <div className="mt-4 rounded-md border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">Estado da avaliação</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {reviewedVersion === null ? "Não avaliado" : `Versão ${reviewedVersion} avaliada`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pesquisa integral E20.5 selecionada: v{availableReview.selectedResearchVersion}.
        </p>
      </div>

      <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor="input-catalog-review-handoff">
        Instrução para o Codex
      </label>
      <textarea
        className="mt-1 min-h-40 w-full rounded-md border border-border bg-background p-3 text-xs text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
        id="input-catalog-review-handoff"
        readOnly
        value={availableReview.handoff}
      />
      <button
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30"
        onClick={copyHandoff}
        type="button"
      >
        Copiar instrução para o Codex
      </button>
      {copyStatus ? <p className="mt-2 text-sm text-muted-foreground" role="status">{copyStatus}</p> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form action={recordFormAction} className="space-y-3 rounded-md border border-border p-4" onSubmit={() => setAttemptedAction("record")}>
          <input name="taxonId" type="hidden" value={taxonId} />
          <label className="text-xs font-medium text-muted-foreground" htmlFor="input-catalog-review-version">
            Versão E20.2 aceita como suficiente
          </label>
          <input
            className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-60"
            disabled={busy}
            id="input-catalog-review-version"
            inputMode="numeric"
            min={1}
            name="inputCatalogVersion"
            required
            step={1}
            type="number"
          />
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {recordPending ? "Registrando..." : "Registrar versão avaliada"}
          </button>
        </form>

        <form action={reopenFormAction} className="space-y-3 rounded-md border border-border p-4" onSubmit={() => setAttemptedAction("reopen")}>
          <input name="taxonId" type="hidden" value={taxonId} />
          <p className="text-sm text-muted-foreground">
            Reabra a avaliação antes de trocar pesquisa, slug, atividade ou cadeia que possa alterar o catálogo resolvido.
          </p>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-60"
            disabled={busy || reviewedVersion === null}
            type="submit"
          >
            {reopenPending ? "Reabrindo..." : "Reabrir avaliação"}
          </button>
        </form>
      </div>

      {actionError ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{actionError}</p> : null}
      {!actionError && attemptedAction === "record" && lastAction === "record" && recordState.reviewedVersion !== null ? <p className="mt-4 text-sm text-emerald-800" role="status">Versão {recordState.reviewedVersion} registrada como avaliada.</p> : null}
      {!actionError && attemptedAction === "reopen" && lastAction === "reopen" && reopenState.reopened ? <p className="mt-4 text-sm text-emerald-800" role="status">Avaliação reaberta; o estado voltou para não avaliado.</p> : null}
    </section>
  );
}
