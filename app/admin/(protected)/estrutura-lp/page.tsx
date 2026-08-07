import Link from "next/link";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  adminLandingPageStructureViews,
  normalizeAdminLandingPageStructureView,
  readAdminLandingPageStructure,
  type AdminLandingPageStructureView,
} from "@/lib/admin/adapters/adminLandingPageStructureAdapter";
import type { AdminOperationalDiagnosticItem } from "@/lib/admin/adapters/adminReadOnlyTypes";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type StructureRead = Awaited<ReturnType<typeof readAdminLandingPageStructure>>;
type RootData = Extract<StructureRead, { view: "parametros" }>["data"];
type ModuleData = Extract<StructureRead, { view: "modulos" }>["data"];
type InputData = Extract<StructureRead, { view: "entradas" }>["data"];
type ResearchData = Extract<StructureRead, { view: "pesquisas" }>["data"];

const viewLabels: Record<AdminLandingPageStructureView, string> = {
  parametros: "Parâmetros",
  modulos: "Módulos e variantes",
  entradas: "Entradas",
  pesquisas: "Pesquisas",
};

export default async function AdminLandingPageStructurePage({ searchParams }: PageProps) {
  const rawParams = (await searchParams) ?? {};
  const query = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  const view = normalizeAdminLandingPageStructureView(query.view);
  const structure = await readAdminLandingPageStructure(view, query);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Contrato estrutural read-only"
        title="Estrutura da LP"
        description="Consulte parâmetros, módulos, entradas e pesquisas usados pela landing page sem alterar registries ou dados operacionais."
        meta={viewLabels[view]}
      />

      <nav aria-label="Visões da estrutura da LP" className="flex flex-wrap gap-2">
        {adminLandingPageStructureViews.map((candidate) => (
          <Link
            key={candidate}
            href={`/admin/estrutura-lp?view=${candidate}`}
            aria-current={candidate === view ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-4 focus-visible:ring-brand-600/20",
              candidate === view
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {viewLabels[candidate]}
          </Link>
        ))}
      </nav>

      {structure.view === "parametros" ? <RootView data={structure.data} /> : null}
      {structure.view === "modulos" ? <ModuleView data={structure.data} /> : null}
      {structure.view === "entradas" ? <InputView data={structure.data} /> : null}
      {structure.view === "pesquisas" ? <ResearchView data={structure.data} /> : null}
    </div>
  );
}

function RootView({ data }: { data: RootData }) {
  if (!data.result) {
    return <EmptyState title="Contrato raiz indisponível" description="Nenhuma versão pública foi encontrada." />;
  }
  if (!data.result.ok) return <FailureState title="Parâmetros indisponíveis" />;

  const root = data.result.value;
  return (
    <div className="space-y-6">
      <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-4 shadow-card">
        <input type="hidden" name="view" value="parametros" />
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(220px,1fr)_auto] sm:items-end">
          <SelectField label="Versão" name="rootVersion" defaultValue={String(root.rootVersion)}>
            {data.versions.map((version) => <option key={version} value={version}>Versão {version}</option>)}
          </SelectField>
          <SelectField label="Preset" name="preset" defaultValue={root.resolvedPresetKey}>
            {Object.values(root.presets).map((preset) => <option key={preset.key} value={preset.key}>{preset.key}</option>)}
          </SelectField>
          <SubmitButton />
        </div>
      </form>

      <section className="grid gap-3 md:grid-cols-3" aria-label="Resumo dos parâmetros">
        <SummaryCard label="Versão da raiz" value={`v${root.rootVersion}`} detail={root.family} />
        <SummaryCard label="Lifecycle" value={lifecycleLabel(root.lifecycleStatus)} detail={root.lifecycleStatus} tone={root.lifecycleStatus === "hypothesis" ? "warning" : "success"} />
        <SummaryCard label="Preset resolvido" value={root.resolvedPresetKey} detail={`Padrão: ${root.defaultPreset}`} />
      </section>

      <DataSection title="Papéis semânticos" description="Faixas editoriais recomendadas e limites absolutos.">
        <Table headings={["Papel", "Faixa recomendada", "Limite absoluto"]} minWidth="620px">
          {Object.values(root.semanticRoles).map((role) => (
            <tr key={role.key} className="align-top">
              <Cell primary={humanize(role.key)} secondary={role.key} />
              <Cell primary={`${role.textRange.recommended.min}–${role.textRange.recommended.max} caracteres`} />
              <Cell primary={`${role.textRange.absoluteMax} caracteres`} />
            </tr>
          ))}
        </Table>
      </DataSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataSection title="Preset e tipografia" description="Parâmetros efetivos do preset selecionado.">
          <DefinitionList items={[
            ["Densidade", humanize(root.resolvedPreset.density)],
            ["Spacing de seção", humanize(root.resolvedPreset.defaultSectionSpacing)],
            ["Largura da página", root.resolvedPreset.maxPageWidth],
            ["Largura de leitura", root.resolvedPreset.maxReadingWidth],
            ["H1", formatValue(root.resolvedPreset.typography.h1)],
            ["H2", formatValue(root.resolvedPreset.typography.h2)],
            ["H3", formatValue(root.resolvedPreset.typography.h3)],
            ["Corpo", formatValue(root.resolvedPreset.typography.body)],
            ["Apoio", root.resolvedPreset.typography.support],
          ]} />
        </DataSection>
        <DataSection title="Critérios visuais" description="Baseline responsiva e de acessibilidade do contrato.">
          <DefinitionList items={[
            ["Baseline", root.visualCriteria.accessibilityBaseline],
            ["Mobile first", yesNo(root.visualCriteria.mobileFirst)],
            ["Viewport mínimo", `${root.visualCriteria.minViewportPx}px`],
            ["Viewports de evidência", root.visualCriteria.evidenceViewportsPx.map((value) => `${value}px`).join(", ")],
            ["Foco visível", yesNo(root.visualCriteria.visibleFocusRequired)],
            ["Sem truncamento", yesNo(root.visualCriteria.noTextTruncation)],
            ["Sem scroll causado por texto", yesNo(root.visualCriteria.noHorizontalScrollFromText)],
          ]} />
        </DataSection>
      </div>

      <DataSection title="Papéis visuais" description={`Opções de spacing: ${root.commonOptions.spacing.map(humanize).join(", ")}.`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(root.visualRoles).map((role) => (
            <div key={role.key} className="rounded-md border border-border bg-background p-3">
              <p className="font-medium text-foreground">{humanize(role.key)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{role.key}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.description}</p>
            </div>
          ))}
        </div>
      </DataSection>
    </div>
  );
}

function ModuleView({ data }: { data: ModuleData }) {
  const resolved = data.result?.ok ? data.result.value : null;
  return (
    <div className="space-y-6">
      <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-4 shadow-card">
        <input type="hidden" name="view" value="modulos" />
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-[1fr_1.2fr_160px_auto] md:items-end">
          <SelectField label="Módulo" name="module" defaultValue={data.moduleIdentity?.moduleKey ?? ""}>
            {data.identities.modules.map((module) => <option key={module.moduleKey} value={module.moduleKey}>{humanize(module.moduleKey)}</option>)}
          </SelectField>
          <SelectField label="Variante" name="variant" defaultValue={data.variantIdentity?.variantKey ?? ""}>
            {data.identities.modules.flatMap((module) => module.variants.map((variant) => (
              <option key={variant.variantKey} value={variant.variantKey}>{humanize(variant.variantKey)} · v{variant.variantVersion}</option>
            )))}
          </SelectField>
          <SelectField label="Perfil de funil" name="funnel" defaultValue={data.funnelProfileKey}>
            <option value="bofu">BOFU</option><option value="mofu">MOFU</option><option value="tofu">TOFU</option>
          </SelectField>
          <SubmitButton />
        </div>
      </form>

      <DataSection title="Catálogo de módulos" description={`Versão ${data.identities.moduleCatalogVersion}; ${data.identities.modules.length} módulos públicos.`}>
        <Table headings={["Módulo", "Versão", "Lifecycle", "Função estrutural", "Variantes", "Capabilities", "Interações"]} minWidth="980px">
          {data.identities.modules.map((module) => {
            const presentation = data.selection.modules.find((item) => item.moduleAlias === module.moduleKey);
            return (
              <tr key={module.moduleKey} className="align-top">
                <Cell primary={humanize(module.moduleKey)} secondary={module.moduleKey} />
                <Cell primary={`v${module.moduleVersion}`} />
                <Cell primary={lifecycleLabel(module.lifecycleStatus)} secondary={module.lifecycleStatus} />
                <Cell primary={presentation?.purpose ?? "—"} />
                <Cell primary={module.variants.map((variant) => humanize(variant.variantKey)).join(", ")} />
                <Cell primary={unique(presentation?.variants.flatMap((variant) => variant.capabilities) ?? []).map(humanize).join(", ") || "—"} />
                <Cell primary={unique(presentation?.variants.flatMap((variant) => variant.interactions) ?? []).map(humanize).join(", ") || "Nenhuma"} />
              </tr>
            );
          })}
        </Table>
      </DataSection>

      {!resolved ? <FailureState title="Contrato do módulo indisponível" /> : (
        <>
          <section className="grid gap-3 md:grid-cols-3" aria-label="Resumo do módulo resolvido">
            <SummaryCard label="Módulo" value={humanize(resolved.module.moduleKey)} detail={`v${resolved.module.moduleVersion}`} />
            <SummaryCard label="Variante" value={humanize(resolved.variant.variantName)} detail={`v${resolved.variant.variantVersion}`} />
            <SummaryCard label="Perfil explícito" value={data.funnelProfileKey.toUpperCase()} detail={resolved.funnelCopyProfile.profileKey} />
          </section>
          <DataSection title="Fields resolvidos" description="Contrato de conteúdo da variante selecionada.">
            <Table headings={["Field", "Tipo", "Cardinalidade", "Papel semântico", "Política", "Fonte de copy", "Suporte"]} minWidth="980px">
              {resolved.fieldContract.fields.map((field) => (
                <tr key={field.fieldKey} className="align-top">
                  <Cell primary={humanize(field.fieldKey)} secondary={field.path} />
                  <Cell primary={humanize(field.fieldKind)} />
                  <Cell primary={`${field.cardinality.min}–${field.cardinality.max}`} />
                  <Cell primary={"semanticRole" in field ? humanize(field.semanticRole) : "Não se aplica"} />
                  <Cell primary={humanize(field.policy)} />
                  <Cell primary={"copySourceMap" in field ? formatValue(field.copySourceMap) : "Não se aplica"} />
                  <Cell primary={"support" in field && field.support ? humanize(field.support) : "—"} />
                </tr>
              ))}
            </Table>
          </DataSection>
          <div className="grid gap-6 xl:grid-cols-2">
            <DataSection title="Interações" description="Contratos operacionais declarados pela variante.">
              {resolved.variant.interactionContracts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma interação declarada.</p> : (
                <div className="space-y-3">{resolved.variant.interactionContracts.map((contract) => (
                  <details key={contract.kind} className="rounded-md border border-border bg-background p-3">
                    <summary className="cursor-pointer font-medium text-foreground">{humanize(contract.kind)}</summary>
                    <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{JSON.stringify(contract, null, 2)}</pre>
                  </details>
                ))}</div>
              )}
            </DataSection>
            <DataSection title="Critérios e restrições" description="Invariantes e limites do módulo canônico.">
              <DefinitionList items={[
                ["Capabilities", resolved.variant.capabilities.map(humanize).join(", ") || "Nenhuma"],
                ["Invariantes", resolved.module.invariants.join(" · ")],
                ["Fronteiras", resolved.module.boundaries.join(" · ")],
                ["Interações permitidas", resolved.module.permittedInteractionKinds.map(humanize).join(", ") || "Nenhuma"],
              ]} />
            </DataSection>
          </div>
        </>
      )}
    </div>
  );
}

function InputView({ data }: { data: InputData }) {
  const resolved = data.result?.ok ? data.result.value : null;
  const chainError = data.chain && !data.chain.ok ? data.chain.error : null;
  return (
    <div className="space-y-6">
      <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-4 shadow-card">
        <input type="hidden" name="view" value="entradas" />
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-[160px_160px_1fr_auto] md:items-end">
          <SelectField label="Versão" name="catalogVersion" defaultValue={data.version === null ? "" : String(data.version)}>
            {data.versions.map((version) => <option key={version} value={version}>Versão {version}</option>)}
          </SelectField>
          <SelectField label="Plano consultado" name="plan" defaultValue={data.plan}>
            {data.plans.map((plan) => <option key={plan} value={plan}>{humanize(plan)}</option>)}
          </SelectField>
          <TaxonSelect taxons={data.taxons} selectedId={data.selectedTaxon?.id ?? ""} />
          <SubmitButton />
        </div>
      </form>

      {data.taxonError || chainError ? <FailureState title={data.taxonError ?? chainError ?? "Cadeia indisponível"} /> : null}
      {!resolved && !data.taxonError && !chainError ? <FailureState title="Catálogo de entradas indisponível" /> : null}
      {resolved ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Resumo das entradas">
            <SummaryCard label="Taxon servido" value={resolved.servedTaxon.name} detail={humanize(resolved.servedTaxon.level)} />
            <SummaryCard label="Plano" value={humanize(resolved.plan)} detail="Consulta, não entitlement" />
            <SummaryCard label="Versão" value={`v${resolved.version}`} />
            <SummaryCard label="Camadas" value={String(resolved.appliedLayers.length)} detail={resolved.appliedLayers.map((layer) => humanize(layer.level)).join(" → ")} />
            <SummaryCard label="Validade" value="Válido" detail={`${resolved.fields.length} fields`} tone="success" />
          </section>
          <DataSection title="Fields resolvidos" description="Evidências extensas permanecem como detalhe secundário.">
            <Table headings={["Field", "Finalidade", "Origem", "Tipo / escopo", "Obrigação", "Condição", "Validação", "Substituição", "Proveniência"]} minWidth="1300px">
              {resolved.fields.map((field) => (
                <tr key={field.fieldKey} className="align-top">
                  <Cell primary={field.fieldKey} />
                  <Cell primary={field.purpose} />
                  <Cell primary={humanize(field.originLayer)} secondary={field.originTaxon?.name} />
                  <Cell primary={humanize(field.valueType)} secondary={humanize(field.valueScope)} />
                  <Cell primary={humanize(field.obligation)} />
                  <Cell primary={formatValue(field.requiredWhen ?? field.applicableWhen ?? null)} />
                  <Cell primary={formatValue(field.validation)} />
                  <Cell primary={humanize(field.landingPageSubstitutionPolicy ?? "not_applicable")} />
                  <Cell primary={field.provenance.map((item) => `${humanize(item.property)}: ${humanize(item.layer)}${item.taxon ? ` (${item.taxon.name})` : ""}`).join(" · ")} secondary={field.evidence.summary} />
                </tr>
              ))}
            </Table>
          </DataSection>
        </>
      ) : null}
    </div>
  );
}

function ResearchView({ data }: { data: ResearchData }) {
  const resolved = data.result?.ok ? data.result.value : null;
  return (
    <div className="space-y-6">
      <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-4 shadow-card">
        <input type="hidden" name="view" value="pesquisas" />
        <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto] sm:items-end">
          <TaxonSelect taxons={data.taxons} selectedId={data.selectedTaxon?.id ?? ""} />
          <SubmitButton />
        </div>
      </form>

      {data.taxonError ? <FailureState title={data.taxonError} /> : null}
      {data.diagnostics ? (
        <section className="grid gap-4 md:grid-cols-2" aria-label="Estado das pesquisas">
          <ResearchStatusCard audience="Business buyer (BB)" diagnostic={data.diagnostics.businessBuyer} />
          <ResearchStatusCard audience="End customer (EC)" diagnostic={data.diagnostics.endCustomer} />
        </section>
      ) : null}

      {resolved ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ResearchAudience title="Business buyer (BB)" audience={resolved.businessBuyer} taxonName={taxonName(data.taxons, resolved.businessBuyer.sourceTaxonId)} />
          <ResearchAudience title="End customer (EC)" audience={resolved.endCustomer} taxonName={taxonName(data.taxons, resolved.endCustomer.sourceTaxonId)} />
        </div>
      ) : data.result && !data.result.ok ? (
        <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
          Detalhamento estrutural indisponível. Motivo seguro: {researchFailureLabel(data.result.error.code)}.
          <span className="ml-1 text-xs">Código: {data.result.error.code}</span>
        </p>
      ) : null}
    </div>
  );
}

function ResearchAudience({ title, audience, taxonName: sourceTaxonName }: {
  title: string;
  audience: Extract<NonNullable<ResearchData["result"]>, { ok: true }>["value"]["businessBuyer"];
  taxonName: string;
}) {
  return (
    <DataSection title={title} description={`${sourceTaxonName} · ${audience.sourceRelation === "own" ? "Própria" : "Pai direto"} · versão ${audience.version}`}>
      <Table headings={["Bloco", "Presença", "Itens ativos"]} minWidth="460px">
        {audience.researches.map((research) => (
          <tr key={research.researchId}>
            <Cell primary={humanize(research.researchBlock)} secondary={research.researchBlock} />
            <td className="px-4 py-3"><AdminStatusBadge tone="success">Presente</AdminStatusBadge></td>
            <Cell primary={String(research.items.length)} />
          </tr>
        ))}
      </Table>
    </DataSection>
  );
}

function ResearchStatusCard({ audience, diagnostic }: { audience: string; diagnostic: AdminOperationalDiagnosticItem }) {
  const status = researchDiagnosticLabel(diagnostic);
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-medium uppercase text-muted-foreground">{audience}</p><p className="mt-1 font-semibold text-foreground">{status}</p></div>
        <AdminStatusBadge tone={diagnostic.tone}>{status}</AdminStatusBadge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Origem</dt><dd className="mt-1 text-foreground">{diagnostic.origin ?? "Não comprovada"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Diagnóstico</dt><dd className="mt-1 text-foreground">{diagnostic.reason}</dd></div>
      </dl>
    </article>
  );
}

function TaxonSelect({ taxons, selectedId }: { taxons: readonly { id: string; name: string; level: string; parentName: string | null }[]; selectedId: string }) {
  return (
    <SelectField label="Taxon ativo" name="taxon" defaultValue={selectedId}>
      {taxons.map((taxon) => <option key={taxon.id} value={taxon.id}>{taxon.name} · {humanize(taxon.level)}{taxon.parentName ? ` · ${taxon.parentName}` : ""}</option>)}
    </SelectField>
  );
}

function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue: string; children: ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4">{children}</select>
    </label>
  );
}

function SubmitButton() {
  return <button className="h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white outline-none transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20">Consultar</button>;
}

function SummaryCard({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail?: string; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3"><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><AdminStatusBadge tone={tone}>{value}</AdminStatusBadge></div>
      {detail ? <p className="mt-3 text-sm text-muted-foreground">{detail}</p> : null}
    </article>
  );
}

function DataSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <header className="border-b border-border px-4 py-3"><h2 className="font-semibold text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Table({ headings, minWidth, children }: { headings: string[]; minWidth: string; children: ReactNode }) {
  return (
    <div className="max-h-[70vh] overflow-auto rounded-md border border-border">
      <table className="w-full divide-y divide-border text-sm" style={{ minWidth }}>
        <thead className="sticky top-0 z-10 bg-muted text-left text-xs font-medium uppercase text-muted-foreground"><tr>{headings.map((heading) => <th key={heading} scope="col" className="px-4 py-3">{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ primary, secondary }: { primary: string; secondary?: string | null }) {
  return <td className="px-4 py-3"><div className="max-w-md whitespace-normal text-foreground">{primary || "—"}</div>{secondary ? <div className="mt-1 max-w-md text-xs text-muted-foreground">{secondary}</div> : null}</td>;
}

function DefinitionList({ items }: { items: readonly (readonly [string, string])[] }) {
  return <dl className="grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-md border border-border bg-background p-3"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm text-foreground">{value || "—"}</dd></div>)}</dl>;
}

function FailureState({ title }: { title: string }) {
  return <div role="status" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{title}. Nenhum contrato foi aproximado ou alterado.</div>;
}

function lifecycleLabel(value: string) {
  return value === "hypothesis" ? "Hipótese" : value === "validated" ? "Validado" : value === "deprecated" ? "Descontinuado" : humanize(value);
}

function humanize(value: string) {
  return value.replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function yesNo(value: boolean) { return value ? "Sim" : "Não"; }

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "Não se aplica";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function unique(values: readonly string[]) { return [...new Set(values)]; }

function taxonName(taxons: readonly { id: string; name: string }[], id: string) {
  return taxons.find((taxon) => taxon.id === id)?.name ?? "Taxon de origem";
}

function researchDiagnosticLabel(item: AdminOperationalDiagnosticItem) {
  return item.label;
}

function researchFailureLabel(code: string) {
  if (["RESEARCH_MISSING", "RESEARCH_INCOMPLETE"].includes(code)) return "pesquisa ausente ou incompleta";
  if (["RESEARCH_INVALID", "RESEARCH_AMBIGUOUS"].includes(code)) return "pesquisa requer revisão";
  return "leitura indisponível";
}
