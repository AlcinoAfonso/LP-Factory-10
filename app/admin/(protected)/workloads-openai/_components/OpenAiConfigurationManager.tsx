"use client";

import { useMemo, useState } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type {
  OpenAiAdministrativeConfigurationUnit,
  OpenAiManagedWorkloadEnvironment,
  OpenAiWorkloadConfigurationOptions,
  OpenAiWorkloadPresentation,
} from "@/openai-workloads";
import { OpenAiWorkloadDetail } from "./OpenAiWorkloadDetail";

type Props = Readonly<{
  units: readonly OpenAiAdministrativeConfigurationUnit[];
  presentations: readonly OpenAiWorkloadPresentation[];
  configurationOptions: readonly OpenAiWorkloadConfigurationOptions[];
  catalogAvailable: boolean;
}>;

type WorkloadGroup = Readonly<{
  key: string;
  displayName: string;
  roadmapReference: string;
  units: readonly OpenAiAdministrativeConfigurationUnit[];
}>;

const environments = ["preview", "production"] as const;

export function OpenAiConfigurationManager({
  units,
  presentations,
  configurationOptions,
  catalogAvailable,
}: Props) {
  const [environment, setEnvironment] =
    useState<OpenAiManagedWorkloadEnvironment>("preview");
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const groups = useMemo(
    () => groupUnits(
      units.filter((unit) => unit.environment === environment),
      presentations,
    ),
    [environment, presentations, units],
  );

  return (
    <section className="space-y-4" aria-labelledby="managed-workloads-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Configuração por função
          </p>
          <h2 id="managed-workloads-title" className="mt-1 text-lg font-semibold text-foreground">
            Workloads gerenciados
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Selecione um ambiente e abra somente a função que precisa de ajuste. A
            configuração ativa continua independente do catálogo de novas escolhas.
          </p>
        </div>

        <div
          className="inline-flex w-full rounded-lg border border-border bg-muted p-1 sm:w-auto"
          role="group"
          aria-label="Ambiente dos workloads"
        >
          {environments.map((candidate) => {
            const selected = candidate === environment;
            return (
              <button
                key={candidate}
                type="button"
                className={`min-h-11 flex-1 rounded-md px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:flex-none ${
                  selected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                }`}
                aria-pressed={selected}
                onClick={() => {
                  setEnvironment(candidate);
                  setOpenGroupKey(null);
                }}
              >
                {candidate === "preview" ? "Preview" : "Production"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="max-h-[72vh] overflow-y-auto overflow-x-hidden">
          <div className="sticky top-0 z-10 border-b border-border bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:hidden">
            Função e configuração atual
          </div>
          <div className="sticky top-0 z-10 hidden grid-cols-[minmax(12rem,2fr)_minmax(6rem,.65fr)_minmax(12rem,1.5fr)_minmax(4rem,.45fr)_auto] gap-3 border-b border-border bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Função</span>
            <span>Recorte</span>
            <span>Configuração atual</span>
            <span>Imagem</span>
            <span className="text-right">Ação</span>
          </div>

          {groups.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground" role="status">
              Nenhum workload foi retornado para {environment === "preview" ? "Preview" : "Production"}.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {groups.map((group) => {
                const open = openGroupKey === group.key;
                const detailId = `workload-detail-${safeId(environment)}-${safeId(group.key)}`;
                return (
                  <li key={group.key}>
                    <article
                      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(12rem,2fr)_minmax(6rem,.65fr)_minmax(12rem,1.5fr)_minmax(4rem,.45fr)_auto] sm:items-center ${
                        open ? "bg-brand-50/40" : "bg-card"
                      }`}
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                          {group.displayName}
                        </h3>
                        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground sm:hidden">
                          {group.units.map((unit) => unit.workload).join(" + ")}
                        </p>
                      </div>

                      <div className="col-span-2 row-start-2 grid min-w-0 grid-cols-[minmax(5rem,.65fr)_minmax(0,1.5fr)_minmax(4rem,.45fr)] items-center gap-3 sm:contents">
                        <p className="text-xs text-foreground sm:text-sm">
                          <span className="mr-1 text-muted-foreground sm:hidden">Recorte:</span>
                          {group.roadmapReference}
                        </p>
                        <ConfigurationSummary units={group.units} />
                        <p className="text-xs text-foreground sm:text-sm">
                          <span className="mr-1 text-muted-foreground sm:hidden">Imagem:</span>
                          Não
                        </p>
                      </div>

                      <button
                        type="button"
                        className="col-start-2 row-start-1 inline-flex min-h-11 items-center justify-center self-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition hover:bg-muted focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:col-start-5"
                        aria-expanded={open}
                        aria-controls={detailId}
                        onClick={() => setOpenGroupKey(open ? null : group.key)}
                      >
                        {open ? "Fechar" : "Abrir"}
                      </button>

                    </article>

                    {open ? (
                      <div id={detailId} className="border-t border-border bg-background p-4 sm:p-5">
                        <ExpandedGroup
                          group={group}
                          configurationOptions={configurationOptions}
                          catalogAvailable={catalogAvailable}
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Preview e Production mantêm candidatas, provas, revisões, ativações e rollback
        independentes. Trocar o seletor não mistura os estados.
      </p>
    </section>
  );
}

function ExpandedGroup({
  group,
  configurationOptions,
  catalogAvailable,
}: Readonly<{
  group: WorkloadGroup;
  configurationOptions: readonly OpenAiWorkloadConfigurationOptions[];
  catalogAvailable: boolean;
}>) {
  const grouped = group.units.length > 1;
  return (
    <section aria-label={`Detalhe de ${group.displayName}`} className="space-y-4">
      {grouped ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">{group.displayName}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Texto e imagem estão agrupados apenas na apresentação; cada unidade mantém
              lifecycle, revisão, prova, ativação e rollback próprios.
            </p>
          </div>
          <AdminStatusBadge tone="neutral">2 unidades técnicas</AdminStatusBadge>
        </div>
      ) : null}

      <div className={grouped ? "grid gap-4 xl:grid-cols-2" : ""}>
        {group.units.map((unit) => (
          <OpenAiWorkloadDetail
            key={`${unit.environment}-${unit.workload}-${unit.configurationVersion}`}
            unit={unit}
            label={grouped ? (unit.apiKind === "responses_text" ? "Texto" : "Imagem") : "Lifecycle técnico"}
            options={configurationOptions.find((candidate) => candidate.workload === unit.workload)}
            catalogAvailable={catalogAvailable}
          />
        ))}
      </div>
    </section>
  );
}

function ConfigurationSummary({ units }: Readonly<{ units: readonly OpenAiAdministrativeConfigurationUnit[] }>) {
  return (
    <div className="min-w-0 text-xs text-foreground sm:text-sm">
      <span className="mr-1 text-muted-foreground sm:hidden">Atual:</span>
      {units.map((unit) => (
        <span key={unit.workload} className="block truncate">
          {units.length > 1 ? `${unit.apiKind === "responses_text" ? "Texto" : "Imagem"}: ` : ""}
          {configurationLabel(unit)}
        </span>
      ))}
    </div>
  );
}

function groupUnits(
  units: readonly OpenAiAdministrativeConfigurationUnit[],
  presentations: readonly OpenAiWorkloadPresentation[],
): readonly WorkloadGroup[] {
  const presentationByWorkload = new Map(
    presentations.map((presentation) => [presentation.workload, presentation]),
  );
  const groups = new Map<string, OpenAiAdministrativeConfigurationUnit[]>();
  for (const unit of units) {
    const presentation = presentationByWorkload.get(unit.workload);
    const key = presentation?.visualGroup ?? unit.workload;
    const grouped = groups.get(key) ?? [];
    grouped.push(unit);
    groups.set(key, grouped);
  }

  return Array.from(groups, ([key, grouped]) => {
    const presentation = grouped[0]
      ? presentationByWorkload.get(grouped[0].workload)
      : undefined;
    return {
      key,
      displayName: presentation?.name ?? grouped[0]?.displayName ?? "Workload sem nome",
      roadmapReference: presentation?.roadmapReference ?? "Não informado",
      units: grouped,
    };
  });
}

function configurationLabel(unit: OpenAiAdministrativeConfigurationUnit) {
  const revision = unit.activeRevision;
  return `${revision.model} · ${revision.reasoningEffort}`;
}

function safeId(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}
