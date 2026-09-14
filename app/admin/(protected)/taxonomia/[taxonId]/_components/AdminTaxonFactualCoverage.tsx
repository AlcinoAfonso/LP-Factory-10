"use client";

import { useActionState } from "react";

import type {
  AdminFactualCoverageField,
  AdminTaxonFactualRelease,
} from "@/lib/admin/adapters/adminReadOnlyTypes";
import type { ReleaseTaxonActionState } from "../../actions";

type ReleaseAction = (
  state: ReleaseTaxonActionState,
  formData: FormData,
) => Promise<ReleaseTaxonActionState>;

type Props = Readonly<{
  release: AdminTaxonFactualRelease;
  releaseAction: ReleaseAction;
  taxonId: string;
}>;

const initialState: ReleaseTaxonActionState = {
  error: null,
  released: false,
  revision: 0,
};

export function AdminTaxonFactualCoverage({
  release,
  releaseAction,
  taxonId,
}: Props) {
  const [state, formAction, pending] = useActionState(
    releaseAction,
    initialState,
  );

  if (release.status !== "available") {
    return (
      <section
        aria-labelledby="factual-coverage-title"
        className="rounded-lg border border-border bg-card p-5 shadow-card"
      >
        <h2
          className="text-lg font-semibold text-card-foreground"
          id="factual-coverage-title"
        >
          Cobertura factual corrente
        </h2>
        <p
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {release.message}
        </p>
      </section>
    );
  }

  const isActive = release.isActive || state.released;
  const coverageByLayer = release.appliedLayers.map((layer) => ({
    ...layer,
    fields: release.fields.filter(
      (field) =>
        field.originLayer === layer.level &&
        field.originTaxonName === layer.taxonName,
    ),
  }));

  return (
    <section
      aria-labelledby="factual-coverage-title"
      className="rounded-lg border border-border bg-card p-5 shadow-card"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            E20.2 v{release.currentInputCatalogVersion}
          </p>
          <h2
            className="mt-1 text-lg font-semibold text-card-foreground"
            id="factual-coverage-title"
          >
            Cobertura factual corrente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo factual único aplicado pela hierarquia corrente.
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
            isActive
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {isActive ? "Taxon ativo" : "Taxon aguardando liberação"}
        </span>
      </div>

      <div className="mt-4 rounded-md border border-border bg-muted/20 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Hierarquia aplicada
        </p>
        <ol className="mt-2 flex flex-wrap gap-2 text-sm text-foreground">
          {release.appliedLayers.map((layer) => (
            <li
              className={`rounded-full border px-3 py-1 ${
                layer.served
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-border bg-background"
              }`}
              key={`${layer.level}:${layer.taxonName ?? "universal"}`}
            >
              {humanize(layer.level)}
              {layer.taxonName ? ` — ${layer.taxonName}` : ""}
              {layer.served ? <span className="sr-only">, taxon servido</span> : null}
            </li>
          ))}
        </ol>
      </div>

      <div
        aria-label="Legenda de origem dos fields"
        className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"
      >
        <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-brand-800">
          Próprio: origem no taxon servido
        </span>
        <span className="rounded-full border border-border bg-muted px-2.5 py-1">
          Herdado: origem em camada ancestral
        </span>
      </div>

      <div className="mt-4 grid gap-4" aria-label="Cobertura factual por camada">
        {coverageByLayer.map((layer, layerIndex) => (
          <section
            aria-labelledby={`factual-layer-${layerIndex}`}
            className="min-w-0 rounded-lg border border-border bg-muted/20 p-4"
            key={`${layer.level}:${layer.taxonName ?? "universal"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground" id={`factual-layer-${layerIndex}`}>
                {humanize(layer.level)}
                {layer.taxonName ? ` — ${layer.taxonName}` : ""}
              </h3>
              <span className="text-xs font-medium text-muted-foreground">
                {layer.fields.length} field(s)
              </span>
            </div>
            {layer.fields.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum field tem origem nesta camada.</p>
            ) : (
              <ul className="mt-3 grid gap-3" aria-label={`Fields de ${humanize(layer.level)}`}>
                {layer.fields.map((field) => (
                  <li
                    className="min-w-0 rounded-md border border-border bg-background px-4 py-3 [overflow-wrap:anywhere]"
                    key={field.fieldKey}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{field.fieldKey}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{field.purpose}</p>
                      </div>
                      <span className="inline-flex w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {field.ownership === "own" ? "Próprio" : "Herdado"}
                      </span>
                    </div>
                    <details className="mt-3 text-sm text-muted-foreground">
                      <summary className="flex min-h-11 cursor-pointer items-center rounded-md font-medium text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">
                        Ver detalhes do field
                      </summary>
                      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Detail label="Camada de origem" value={formatOrigin(field)} />
                        <Detail label="Tipo" value={humanize(field.valueType)} />
                        <Detail label="Escopo do valor" value={humanize(field.valueScope)} />
                        <Detail label="Origem esperada" value={humanize(field.expectedValueOrigin)} />
                        <Detail label="Obrigação" value={humanize(field.obligation)} />
                        <Detail label="Validação" value={formatValidation(field)} />
                        <Detail label="Condição obrigatória" value={formatCondition(field.requiredWhen)} />
                        <Detail label="Condição aplicável" value={formatCondition(field.applicableWhen)} />
                      </dl>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {!isActive ? (
        <form action={formAction} className="mt-5 rounded-md border border-brand-200 bg-brand-50/50 p-4">
          <input name="taxonId" type="hidden" value={taxonId} />
          <input
            name="coverageFingerprint"
            type="hidden"
            value={release.coverageFingerprint}
          />
          <p className="text-sm text-foreground">
            A liberação confirma somente esta cobertura corrente e ativa o taxon. Pesquisa e IA não são obrigatórias.
          </p>
          <button
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Liberando..." : "Liberar taxon sem IA"}
          </button>
        </form>
      ) : (
        <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Taxon ativo. Alterações futuras do catálogo não reabrem esta decisão automaticamente.
        </p>
      )}

      {state.error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      {!state.error && state.released ? (
        <p className="mt-4 text-sm font-medium text-emerald-800" role="status">
          Taxon liberado com a cobertura factual corrente.
        </p>
      ) : null}
    </section>
  );
}

function Detail({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatOrigin(field: AdminFactualCoverageField): string {
  const layer = humanize(field.originLayer);
  return field.originTaxonName ? `${layer} — ${field.originTaxonName}` : layer;
}

function formatCondition(
  condition: AdminFactualCoverageField["requiredWhen"],
): string {
  if (!condition) return "Nenhuma";
  const value = typeof condition.value === "string"
    ? humanize(condition.value)
    : typeof condition.value === "boolean"
      ? condition.value ? "Sim" : "Não"
      : condition.value.map(humanize).join(", ");
  return `${condition.fieldKey} ${condition.operator === "equals" ? "igual a" : "em"} ${value}`;
}

function formatValidation(field: AdminFactualCoverageField): string {
  const validation = field.validation;
  if (validation.kind === "enum") {
    return `Opções: ${validation.allowedValues.map(humanize).join(", ")}`;
  }
  if (validation.kind === "string_list") {
    const constraints = [
      validation.allowedValues?.length
        ? `opções ${validation.allowedValues.map(humanize).join(", ")}`
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
  return humanize(validation.kind);
}

function humanize(value: string): string {
  return value
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
