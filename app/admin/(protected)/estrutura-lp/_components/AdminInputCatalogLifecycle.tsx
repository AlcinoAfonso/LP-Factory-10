"use client";

import { useActionState } from "react";

import type { AdminInputCatalogLifecycleState } from "@/lib/admin/adapters/adminInputCatalogLifecycleAdapter";
import type { InputCatalogLifecycleActionState } from "../actions";
import {
  initializeInputCatalogDraftAction,
  prepareInputCatalogPublicationAction,
  reconcileInputCatalogPublishedDraftAction,
  saveInputCatalogDraftAction,
  validateInputCatalogDraftAction,
} from "../actions";

const initialInputCatalogLifecycleActionState: InputCatalogLifecycleActionState = {
  error: null,
  message: null,
  handoff: null,
  revision: 0,
};

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
  const requiresSameFactConfirmation = draft?.fieldChanges.some(
    (change) => change.sameFactConfirmationRequired,
  ) ?? false;

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

      <dl className="grid gap-2 text-sm sm:grid-cols-1">
        <Metric label="Versões publicadas" value={state.publishedVersions.join(", ")} />
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
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
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
          <details className="rounded-md border border-border bg-background p-3">
            <summary className="cursor-pointer font-medium text-foreground">
              Mudanças factuais e alcance ancestral ({draft.fieldChanges.length})
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              {draft.fieldChanges.map((change) => (
                  <li key={`${change.originLayer}:${change.originTaxonId ?? "universal"}:${change.fieldKey}`} className="rounded border border-border px-3 py-2">
                    <p className="font-medium text-foreground">
                      {change.fieldKey} · {changeKindLabel(change.kind)}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Residência: {change.originLayer}
                      {change.originTaxonId ? ` (${change.originTaxonId})` : ""}. Alcance: {change.affectedTaxonIds.length} taxon(s).
                    </p>
                    {change.attributeChanges.length > 0 ? (
                      <dl className="mt-2 space-y-2 rounded bg-muted/30 p-2 text-xs">
                        {change.attributeChanges.map((attributeChange) => (
                          <div key={attributeChange.attribute}>
                            <dt className="font-semibold text-foreground">{attributeChange.attribute}</dt>
                            <dd className="break-all text-muted-foreground">
                              Antes: {attributeChange.previousValue}
                            </dd>
                            <dd className="break-all text-muted-foreground">
                              Depois: {attributeChange.nextValue}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {change.sameFactConfirmationRequired ? (
                      <p className="mt-1 font-medium text-amber-700">
                        Exige confirmação humana explícita de que o field continua representando o mesmo fato.
                      </p>
                    ) : null}
                    {change.affectedTaxonIds.length > 0 ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-brand-700">
                          Ver taxons alcançados
                        </summary>
                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          {change.affectedTaxonIds.join(", ")}
                        </p>
                      </details>
                    ) : null}
                  </li>
                ))}
              {draft.fieldChanges.length === 0 ? (
                <li className="text-muted-foreground">O draft ainda não altera fields factuais.</li>
              ) : null}
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
            <form action={validationAction} className="space-y-2">
              <input type="hidden" name="expectedRevision" value={draft.revision} />
              <input type="hidden" name="expectedContentFingerprint" value={draft.contentFingerprint} />
              <input type="hidden" name="expectedLifecycleContextFingerprint" value={draft.lifecycleContextFingerprint} />
              <p className="max-w-xl break-all text-xs text-muted-foreground">
                Confirmação vinculada à revisão {draft.revision}, ao conteúdo {draft.contentFingerprint}
                {" "}e ao contexto de alcance {draft.lifecycleContextFingerprint}.
              </p>
              {requiresSameFactConfirmation ? (
                <label className="flex max-w-xl items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <input type="checkbox" name="sameFactConfirmed" className="mt-1" />
                  <span>
                    Após revisar os atributos, valores e alcance exibidos acima, confirmo que toda edição
                    sinalizada preserva o mesmo fato. Caso contrário, usarei um novo fieldKey.
                  </span>
                </label>
              ) : null}
              <ActionButton pending={validationPending} pendingLabel="Validando…" secondary>
                Revalidar conteúdo e alcance
              </ActionButton>
            </form>
            <form action={publicationAction}>
              <input type="hidden" name="expectedRevision" value={draft.revision} />
              <ActionButton
                pending={publicationPending}
                pendingLabel="Preparando…"
                disabled={!draft.validationCurrent}
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

function changeKindLabel(kind: "added" | "edited" | "inactivated" | "reactivated") {
  return {
    added: "adição",
    edited: "edição",
    inactivated: "inativação",
    reactivated: "reativação",
  }[kind];
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
