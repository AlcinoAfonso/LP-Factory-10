"use client";

import { useActionState } from "react";

import type { AdminInputCatalogLifecycleState } from "@/lib/admin/adapters/adminInputCatalogLifecycleAdapter";
import {
  initialInputCatalogLifecycleActionState,
  initializeInputCatalogDraftAction,
  prepareInputCatalogPublicationAction,
  reconcileInputCatalogPublishedDraftAction,
  saveInputCatalogDraftAction,
  validateInputCatalogDraftAction,
} from "../actions";

export function AdminInputCatalogLifecycle({
  state,
}: {
  state: AdminInputCatalogLifecycleState;
}) {
  const [initializeState, initializeAction, initializePending] = useActionState(
    initializeInputCatalogDraftAction,
    initialInputCatalogLifecycleActionState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveInputCatalogDraftAction,
    initialInputCatalogLifecycleActionState,
  );
  const [validationState, validationAction, validationPending] = useActionState(
    validateInputCatalogDraftAction,
    initialInputCatalogLifecycleActionState,
  );
  const [publicationState, publicationAction, publicationPending] = useActionState(
    prepareInputCatalogPublicationAction,
    initialInputCatalogLifecycleActionState,
  );
  const [reconciliationState, reconciliationAction, reconciliationPending] = useActionState(
    reconcileInputCatalogPublishedDraftAction,
    initialInputCatalogLifecycleActionState,
  );
  const feedback = [reconciliationState, publicationState, validationState, saveState, initializeState]
    .find((item) => item.revision > 0);
  const draft = state.draft;

  return (
    <section
      aria-labelledby="input-catalog-lifecycle-title"
      className="space-y-4 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Lifecycle repo-only
          </p>
          <h2 id="input-catalog-lifecycle-title" className="mt-1 text-lg font-semibold text-foreground">
            Versão atual e próximo draft
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            A versão publicada permanece no repositório. O draft abaixo é administrativo,
            não operacional e só prepara um handoff para materialização, revisão e deploy.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
          Atual v{state.currentVersion}
        </span>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <Metric label="Versões publicadas" value={state.publishedVersions.join(", ")} />
        <Metric label="Taxons ativos" value={String(state.totalActiveTaxons)} />
        <Metric label="Taxons operacionais" value={String(state.totalOperationalTaxons)} />
      </dl>

      {state.error ? (
        <Status tone="error">{state.error}</Status>
      ) : null}
      {feedback?.error ? <Status tone="error">{feedback.error}</Status> : null}
      {feedback?.message ? <Status tone="success">{feedback.message}</Status> : null}

      {!state.error && !draft ? (
        <form action={initializeAction}>
          <ActionButton pending={initializePending} pendingLabel="Criando draft…">
            Criar próximo draft v{state.currentVersion + 1}
          </ActionButton>
        </form>
      ) : null}

      {draft ? (
        <div className="space-y-4">
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Draft" value={`v${draft.targetVersion}`} />
            <Metric label="Revisão administrativa" value={String(draft.revision)} />
            <Metric label="Validação" value={draft.validationCurrent ? "Atual" : "Pendente"} />
            <Metric label="Handoff" value={draft.publicationPrepared ? "Preparado" : "Pendente"} />
          </div>

          {draft.publishedReconciliationRequired ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Registry implantado e fingerprint comprovado</p>
              <p className="mt-1">
                {draft.publishedReconciliationAllowed
                  ? "Encerre somente a residência temporária. Esta ação não publica nem altera a versão atual."
                  : "A reconciliação permanece bloqueada neste ambiente e só pode ser concluída no runtime de Production."}
              </p>
              <form action={reconciliationAction} className="mt-3">
                <input type="hidden" name="expectedRevision" value={draft.revision} />
                <ActionButton
                  disabled={!draft.publishedReconciliationAllowed}
                  pending={reconciliationPending}
                  pendingLabel="Reconciliando…"
                >
                  Reconciliar draft já implantado
                </ActionButton>
              </form>
            </div>
          ) : (
            <>
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Sem mudança material" value={String(draft.totals.noMaterialChange)} />
            <Metric label="Evolução compatível" value={String(draft.totals.compatibleEvolution)} />
            <Metric label="Revisão necessária" value={String(draft.totals.reviewRequired)} />
            <Metric label="Bloqueios operacionais" value={String(draft.totals.blockingOperationalReviews)} />
            <Metric label="Configurações inválidas" value={String(draft.totals.invalidOperationalConfigurations)} />
          </div>

          <details className="rounded-md border border-border bg-background p-3">
            <summary className="cursor-pointer font-medium text-foreground">
              Taxons que exigem revisão ({draft.totals.reviewRequired})
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              {draft.impacts
                .filter((impact) => impact.classification === "review_required")
                .map((impact) => (
                  <li key={impact.taxon.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2">
                    <span>
                      <span className="font-medium text-foreground">{impact.taxon.name}</span>
                      <span className="ml-2 text-muted-foreground">{impact.taxon.slug}</span>
                      {draft.reviewedTaxonIds.includes(impact.taxon.id) ? (
                        <span className="ml-2 font-medium text-emerald-700">Decisão vinculada ao draft atual</span>
                      ) : null}
                    </span>
                    <a
                      href={`/admin/taxonomia/${impact.taxon.id}?catalogDraftRevision=${draft.revision}`}
                      className="rounded px-2 py-1 font-medium text-brand-700 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
                    >
                      {draft.reviewedTaxonIds.includes(impact.taxon.id)
                        ? "Reavaliar E20.6.5"
                        : "Avaliar draft na E20.6.5"}
                    </a>
                  </li>
                ))}
            </ul>
          </details>

          <form action={saveAction} className="space-y-3">
            <input type="hidden" name="expectedRevision" value={draft.revision} />
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Conteúdo estruturado do draft</span>
              <span className="block text-xs leading-5 text-muted-foreground">
                Edite somente a próxima versão. Salvar invalida validações e handoffs anteriores.
              </span>
              <textarea
                key={`${draft.revision}-${draft.contentFingerprint}`}
                name="catalogJson"
                defaultValue={draft.catalogJson}
                spellCheck={false}
                className="min-h-72 w-full rounded-md border border-border bg-background p-3 font-mono text-xs leading-5 text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
              />
            </label>
            <ActionButton pending={savePending} pendingLabel="Salvando…">
              Salvar draft
            </ActionButton>
          </form>

          <div className="flex flex-wrap gap-3">
            <form action={validationAction}>
              <input type="hidden" name="expectedRevision" value={draft.revision} />
              <ActionButton pending={validationPending} pendingLabel="Validando…" secondary>
                Revalidar conteúdo e impacto
              </ActionButton>
            </form>
            <form action={publicationAction}>
              <input type="hidden" name="expectedRevision" value={draft.revision} />
              <ActionButton
                pending={publicationPending}
                pendingLabel="Preparando…"
                disabled={
                  !draft.validationCurrent ||
                  draft.totals.blockingOperationalReviews > 0 ||
                  draft.totals.invalidOperationalConfigurations > 0
                }
              >
                Preparar handoff repo-only
              </ActionButton>
            </form>
          </div>

          {publicationState.handoff ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Handoff congelado e copiável</span>
              <textarea
                readOnly
                value={publicationState.handoff}
                className="min-h-56 w-full rounded-md border border-border bg-muted/30 p-3 font-mono text-xs leading-5 text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
              />
            </label>
          ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Status({ children, tone }: { children: string; tone: "error" | "success" }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={tone === "error"
        ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"}
    >
      {children}
    </p>
  );
}

function ActionButton({
  children,
  pending,
  pendingLabel,
  secondary = false,
  disabled = false,
}: {
  children: React.ReactNode;
  pending: boolean;
  pendingLabel: string;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={secondary
        ? "min-h-11 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground outline-none transition hover:bg-muted focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-50"
        : "min-h-11 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white outline-none transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-50"}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
