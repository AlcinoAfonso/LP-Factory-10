"use client";

import { useActionState } from "react";

import type { AdminEndCustomerResearchSelection } from "@/lib/admin/adapters/adminReadOnlyTypes";

type SelectionActionState = {
  error: string | null;
  selectedVersion: number | null;
};

type SelectionAction = (
  state: SelectionActionState,
  formData: FormData,
) => Promise<SelectionActionState>;

type AdminTaxonResearchSelectionFormProps = {
  action: SelectionAction;
  isActive: boolean;
  selection: Exclude<AdminEndCustomerResearchSelection, { status: "disabled" }>;
  taxonId: string;
};

const initialState: SelectionActionState = {
  error: null,
  selectedVersion: null,
};

export function AdminTaxonResearchSelectionForm({
  action,
  isActive,
  selection,
  taxonId,
}: AdminTaxonResearchSelectionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const selectedVersion = state.selectedVersion ??
    (selection.status === "available" ? selection.selectedVersion : null);
  const selectionLabel = selectedVersion === null
    ? "Sem versão selecionada"
    : `Versão v${selectedVersion} selecionada`;

  return (
    <section
      aria-labelledby="end-customer-research-selection-title"
      className="rounded-lg border border-border bg-card p-5 shadow-card"
    >
      <h2
        className="text-sm font-semibold text-card-foreground"
        id="end-customer-research-selection-title"
      >
        Pesquisa integral end_customer
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A seleção é humana e explícita. Arquivar uma nova versão não altera a versão vigente.
      </p>

      {selection.status === "read_failed" ? (
        <p
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {selection.message}
        </p>
      ) : (
        <form action={formAction} className="mt-4 space-y-4">
          <input name="taxonId" type="hidden" value={taxonId} />

          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Seleção vigente
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{selectionLabel}</p>
          </div>

          <div>
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="end-customer-research-version"
            >
              Versão candidata
            </label>
            <input
              aria-describedby="end-customer-research-version-help"
              className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isActive || pending}
              id="end-customer-research-version"
              inputMode="numeric"
              min={1}
              name="researchVersion"
              required
              step={1}
              type="number"
            />
            <p className="mt-1 text-xs text-muted-foreground" id="end-customer-research-version-help">
              Informe uma versão inteira positiva já arquivada para este taxon.
            </p>
          </div>

          {!isActive ? (
            <p className="text-sm text-amber-800" role="status">
              Ative o taxon antes de selecionar uma pesquisa integral.
            </p>
          ) : null}
          {state.error ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}
          {state.selectedVersion !== null && !state.error ? (
            <p
              className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              role="status"
            >
              Versão v{state.selectedVersion} selecionada com sucesso.
            </p>
          ) : null}

          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isActive || pending}
            type="submit"
          >
            {pending ? "Validando e salvando..." : "Selecionar versão candidata"}
          </button>
        </form>
      )}
    </section>
  );
}
