"use client";

import { useActionState, useEffect, useState } from "react";

import type {
  AdminInputCatalogCoverageField,
  AdminInputCatalogReview,
} from "@/lib/admin/adapters/adminReadOnlyTypes";
import { applyInputCatalogReviewPresentation } from "@/lib/admin/adapters/adminTaxonomyReviewPolicy";
import type { InputCatalogReviewActionState } from "../../actions";

type ReviewAction = (
  state: InputCatalogReviewActionState,
  formData: FormData,
) => Promise<InputCatalogReviewActionState>;

type Props = {
  review: Exclude<AdminInputCatalogReview, { status: "disabled" }>;
  taxonId: string;
  legacyMode:
    | "rollout_gate_off"
    | "runtime_active"
    | "operational_configuration_unproven"
    | "unavailable";
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
  legacyMode,
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
  const legacyAvailable = legacyMode === "rollout_gate_off";
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
        Compare a cobertura herdada. Você pode liberar sem IA quando ela já for suficiente ou pedir sugestões opcionais abaixo.
      </p>

      <div className="mt-4 rounded-md border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">Estado da avaliação</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {reviewedVersion === null
            ? availableReview.isActive ? "Ativo, sem revisão E20.2 vigente" : "Inativo, aguardando revisão E20.2"
            : `Versão ${reviewedVersion} avaliada${availableReview.isActive ? "" : "; taxon ainda inativo"}`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {availableReview.selectedResearchVersion === null
            ? "Pesquisa E20.5 ausente; isso não impede a liberação sem IA."
            : `Pesquisa integral E20.5 selecionada: v${availableReview.selectedResearchVersion}.`}
        </p>
      </div>

      <div className="mt-4 rounded-md border border-border px-4 py-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Cobertura herdada da E20.2 v{availableReview.currentInputCatalogVersion}
        </p>
        <p className="mt-2 text-sm text-foreground">
          Planos confrontados: {availableReview.coverage.plans.join(", ")}.
        </p>
        <div className="mt-3 grid gap-4" aria-label="Catálogos completos herdados da E20.2">
          {availableReview.coverage.catalogs.map((catalog) => (
            <section className="rounded border border-border bg-muted/20 px-3 py-3" key={catalog.plan}>
              <h3 className="text-sm font-semibold text-foreground">Plano {humanizeCoverageValue(catalog.plan)}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Camadas aplicadas: {catalog.appliedLayers.map((layer) =>
                  layer.taxonName ? `${humanizeCoverageValue(layer.level)} (${layer.taxonName})` : humanizeCoverageValue(layer.level)
                ).join(" → ")}.
              </p>
              <ul className="mt-3 grid gap-3" aria-label={`Fields herdados do plano ${catalog.plan}`}>
                {catalog.fields.map((field) => (
                  <li className="rounded border border-border bg-background px-3 py-3" key={field.fieldKey}>
                    <p className="text-sm font-medium text-foreground">{field.fieldKey}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{field.purpose}</p>
                    <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <CoverageDetail label="Tipo" value={humanizeCoverageValue(field.valueType)} />
                      <CoverageDetail label="Escopo do valor" value={humanizeCoverageValue(field.valueScope)} />
                      <CoverageDetail label="Origem da definição" value={humanizeCoverageValue(field.originLayer)} />
                      <CoverageDetail label="Origem esperada do valor" value={humanizeCoverageValue(field.expectedValueOrigin)} />
                      <CoverageDetail label="Obrigação" value={humanizeCoverageValue(field.obligation)} />
                      <CoverageDetail label="Validação" value={formatCoverageValidation(field)} />
                      <CoverageDetail label="Condição de obrigatoriedade" value={formatCoverageCondition(field.requiredWhen)} />
                      <CoverageDetail label="Condição de aplicabilidade" value={formatCoverageCondition(field.applicableWhen)} />
                      <CoverageDetail label="Planos permitidos" value={field.allowedPlans.map(humanizeCoverageValue).join(", ")} />
                      <CoverageDetail
                        label="Política de substituição"
                        value={field.landingPageSubstitutionPolicy
                          ? humanizeCoverageValue(field.landingPageSubstitutionPolicy)
                          : "Não declarada"}
                      />
                    </dl>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {legacyAvailable ? (
        <>
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
        </>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form action={recordFormAction} className="space-y-3 rounded-md border border-border p-4" onSubmit={() => setAttemptedAction("record")}>
            <input name="taxonId" type="hidden" value={taxonId} />
            <input name="inputCatalogVersion" type="hidden" value={availableReview.currentInputCatalogVersion} />
            <p className="text-sm text-muted-foreground">
              Confirmo que a cobertura herdada da versão E20.2 {availableReview.currentInputCatalogVersion} é suficiente para este taxon.
            </p>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {recordPending
                ? "Liberando..."
                : availableReview.isActive
                  ? "Confirmar cobertura sem IA"
                  : "Liberar taxon sem IA"}
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
      {!actionError && attemptedAction === "record" && lastAction === "record" && recordState.reviewedVersion !== null ? <p className="mt-4 text-sm text-emerald-800" role="status">Versão {recordState.reviewedVersion} registrada e taxon liberado.</p> : null}
      {!actionError && attemptedAction === "reopen" && lastAction === "reopen" && reopenState.reopened ? <p className="mt-4 text-sm text-emerald-800" role="status">Avaliação reaberta; o estado voltou para não avaliado.</p> : null}
    </section>
  );
}

function CoverageDetail({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatCoverageCondition(
  condition: AdminInputCatalogCoverageField["requiredWhen"],
): string {
  if (!condition) return "Nenhuma";
  const value = typeof condition.value === "string"
    ? humanizeCoverageValue(condition.value)
    : typeof condition.value === "boolean"
      ? condition.value ? "Sim" : "Não"
      : condition.value.map(humanizeCoverageValue).join(", ");
  return `${condition.fieldKey} ${condition.operator === "equals" ? "igual a" : "em"} ${value}`;
}

function formatCoverageValidation(field: AdminInputCatalogCoverageField): string {
  const validation = field.validation;
  if (validation.kind === "enum") {
    return `Opções: ${validation.allowedValues.map(humanizeCoverageValue).join(", ")}`;
  }
  if (validation.kind === "string_list") {
    const constraints = [
      validation.allowedValues?.length
        ? `opções ${validation.allowedValues.map(humanizeCoverageValue).join(", ")}`
        : null,
      validation.minItems !== undefined ? `mínimo ${validation.minItems}` : null,
      validation.maxItems !== undefined ? `máximo ${validation.maxItems}` : null,
    ].filter((value): value is string => value !== null);
    return constraints.length ? `Lista de textos: ${constraints.join("; ")}` : "Lista de textos";
  }
  if (validation.kind === "number_range") {
    const limits = [
      validation.minimum !== undefined ? `mínimo ${validation.minimum}` : null,
      validation.maximum !== undefined ? `máximo ${validation.maximum}` : null,
    ].filter((value): value is string => value !== null);
    return `Faixa numérica${limits.length ? `: ${limits.join(", ")}` : ""} (${validation.currency})`;
  }
  return humanizeCoverageValue(validation.kind);
}

function humanizeCoverageValue(value: string): string {
  return value.replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
