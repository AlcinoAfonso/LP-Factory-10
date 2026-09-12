"use client";

import { useActionState, useEffect, useRef } from "react";

import type { AdminTaxonFactualReviewSummary } from "@/lib/admin/adapters/adminTaxonFactualReviewAdapter";
import type { FactualReviewLifecycleActionState } from "../../actions";

const initialState: FactualReviewLifecycleActionState = {
  error: null,
  message: null,
  revision: 0,
};

type LifecycleAction = (
  previous: FactualReviewLifecycleActionState,
  formData: FormData,
) => Promise<FactualReviewLifecycleActionState>;

export function AdminTaxonFactualReviewLifecycle({
  isActive,
  review,
  taxonId,
  unavailableMessage,
  openAction,
  closeWithoutChangeAction,
}: Readonly<{
  isActive: boolean;
  review: AdminTaxonFactualReviewSummary | null;
  taxonId: string;
  unavailableMessage: string | null;
  openAction: LifecycleAction;
  closeWithoutChangeAction: LifecycleAction;
}>) {
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const [openState, openFormAction, openPending] = useActionState(openAction, initialState);
  const [closeState, closeFormAction, closePending] = useActionState(
    closeWithoutChangeAction,
    initialState,
  );
  const feedback = closeState.revision >= openState.revision ? closeState : openState;
  const busy = openPending || closePending;
  const canOpen = !review || review.status === "closed_without_change" || review.status === "closed_published";

  useEffect(() => {
    if (feedback.revision > 0) feedbackRef.current?.focus();
  }, [feedback.revision]);

  return (
    <section aria-labelledby="factual-review-title" className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lifecycle factual</p>
      <h2 id="factual-review-title" className="mt-1 text-lg font-semibold text-card-foreground">
        Sessão de revisão factual
      </h2>
      <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
        O estado operacional do taxon é independente desta sessão. A avaliação automatizada é opcional;
        abrir ou concluir a decisão humana não depende do provider.
      </p>

      <dl className="mt-4 grid min-w-0 gap-3 text-sm sm:grid-cols-3">
        <Metric label="Estado operacional" value={isActive ? "Ativo" : "Inativo"} />
        <Metric label="Sessão factual" value={unavailableMessage ? "Indisponível" : review ? statusLabel(review.status) : "Sem histórico"} />
        <Metric label="Finalidade" value={unavailableMessage ? "Indisponível" : review ? kindLabel(review.kind) : (isActive ? "Revisão" : "Liberação")} />
      </dl>

      {unavailableMessage ? (
        <p className="mt-4 break-words rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          {unavailableMessage}
        </p>
      ) : null}
      {feedback.error ? <Feedback focusRef={feedbackRef} tone="error">{feedback.error}</Feedback> : null}
      {feedback.message ? <Feedback focusRef={feedbackRef} tone="success">{feedback.message}</Feedback> : null}

      {canOpen && !unavailableMessage ? (
        <form action={openFormAction} className="mt-4">
          <input type="hidden" name="taxonId" value={taxonId} />
          <ActionButton disabled={busy} pending={openPending}>
            {review ? "Abrir nova sessão factual" : isActive ? "Abrir revisão factual" : "Abrir sessão de liberação"}
          </ActionButton>
        </form>
      ) : null}

      {review?.status === "open" ? (
        <div className="mt-4 rounded-md border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Confirme somente quando a cobertura factual atual for suficiente sem alterar o draft.
            Em uma release, essa decisão conclui a liberação e ativa o taxon pelo lifecycle dedicado.
          </p>
          <form action={closeFormAction} className="mt-3">
            <input type="hidden" name="taxonId" value={taxonId} />
            <input type="hidden" name="reviewId" value={review.id} />
            <input type="hidden" name="expectedRevision" value={review.revision} />
            <input type="hidden" name="expectedContextFingerprint" value={review.contextFingerprint} />
            <ActionButton disabled={busy} pending={closePending}>
              {review.kind === "release" ? "Concluir liberação sem mudança" : "Fechar revisão sem mudança"}
            </ActionButton>
          </form>
        </div>
      ) : null}

      {review?.status === "awaiting_catalog_publication" ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          A decisão humana com mudança está vinculada ao draft exato e aguarda publicação e reconciliação.
        </p>
      ) : null}

      {review?.status === "closed_without_change" || review?.status === "closed_published" ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Esta é a última sessão factual concluída. O histórico permanece reconhecível após recarregar a página;
          uma nova sessão pode ser aberta quando outra revisão ou liberação for necessária.
        </p>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Feedback({ children, focusRef, tone }: Readonly<{
  children: string;
  focusRef: React.Ref<HTMLParagraphElement>;
  tone: "error" | "success";
}>) {
  return (
    <p
      ref={focusRef}
      tabIndex={-1}
      aria-live="polite"
      className={`mt-4 rounded-md border px-3 py-2 text-sm outline-none ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

function ActionButton({ children, disabled, pending }: Readonly<{
  children: React.ReactNode;
  disabled: boolean;
  pending: boolean;
}>) {
  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white outline-none transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      type="submit"
    >
      {pending ? "Registrando…" : children}
    </button>
  );
}

function statusLabel(status: AdminTaxonFactualReviewSummary["status"]): string {
  if (status === "open") return "Aberta";
  if (status === "awaiting_catalog_publication") return "Aguardando publicação";
  if (status === "closed_published") return "Publicada e reconciliada";
  return "Concluída sem mudança";
}

function kindLabel(kind: AdminTaxonFactualReviewSummary["kind"]): string {
  return kind === "release" ? "Liberação" : "Revisão";
}
