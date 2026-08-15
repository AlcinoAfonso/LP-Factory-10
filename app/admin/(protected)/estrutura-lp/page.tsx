import Link from "next/link";
import { Fragment, type ReactNode } from "react";

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
import type { AdminTaxonResearchAudiencePresentation } from "@/lib/admin/adapters/adminTaxonomyAdapter";
import { cn } from "@/lib/utils";

import { ModuleStructureFilters } from "./ModuleStructureFilters";

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
type ResolvedModule = Extract<NonNullable<ModuleData["result"]>, { ok: true }>["value"];
type ModuleField = ResolvedModule["fieldContract"]["fields"][number];
type ResolvedInput = Extract<NonNullable<InputData["result"]>, { ok: true }>["value"];
type InputField = ResolvedInput["fields"][number];

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
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Contrato estrutural somente leitura"
        title="Estrutura da LP"
      />

      <nav aria-label="Visões da estrutura da LP" className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
        {adminLandingPageStructureViews.map((candidate) => (
          <Link
            key={candidate}
            href={`/admin/estrutura-lp?view=${candidate}`}
            aria-current={candidate === view ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium outline-none transition focus-visible:rounded-sm focus-visible:ring-4 focus-visible:ring-brand-600/20",
              candidate === view
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
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
    <div className="space-y-4">
      <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-3">
        <input type="hidden" name="view" value="parametros" />
        <div className="flex flex-wrap items-end gap-3">
          <SelectField className="w-full sm:w-44" label="Versão" name="rootVersion" defaultValue={String(root.rootVersion)}>
            {data.versions.map((version) => <option key={version} value={version}>Versão {version}</option>)}
          </SelectField>
          <SelectField className="w-full sm:w-72" label="Preset consultado" name="preset" defaultValue={root.resolvedPresetKey}>
            {Object.values(root.presets).map((preset) => (
              <option key={preset.key} value={preset.key}>{presetLabel(preset.key)}</option>
            ))}
          </SelectField>
          <SubmitButton />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{presetDescription(root.resolvedPresetKey)}</p>
        <p className="mt-1 text-xs text-muted-foreground">A consulta não altera o preset padrão nem persiste configuração.</p>
      </form>

      <CompactSummary
        label="Resumo dos parâmetros"
        values={[
          `Raiz v${root.rootVersion}`,
          lifecycleLabel(root.lifecycleStatus),
          presetLabel(root.resolvedPresetKey),
          `Padrão: ${presetLabel(root.defaultPreset)}`,
        ]}
      />

      <DataSection title="Papéis semânticos" description="Faixas editoriais recomendadas e limites absolutos.">
        <Table headings={["Papel", "Faixa recomendada", "Limite absoluto"]} minWidth="620px">
          {Object.values(root.semanticRoles).map((role) => (
            <tr key={role.key} className="align-top">
              <Cell primary={semanticRoleLabel(role.key)} secondary={role.key} />
              <Cell primary={`${role.textRange.recommended.min}–${role.textRange.recommended.max} caracteres`} />
              <Cell primary={`${role.textRange.absoluteMax} caracteres`} />
            </tr>
          ))}
        </Table>
      </DataSection>

      <div className="grid gap-4 xl:grid-cols-2">
        <DataSection title="Preset e tipografia" description="Parâmetros efetivos do preset selecionado.">
          <DefinitionList items={[
            ["Densidade", spacingLabel(root.resolvedPreset.density)],
            ["Espaçamento de seção", spacingLabel(root.resolvedPreset.defaultSectionSpacing)],
            ["Largura da página", root.resolvedPreset.maxPageWidth],
            ["Largura de leitura", root.resolvedPreset.maxReadingWidth],
            ["H1", typographyRange(root.resolvedPreset.typography.h1)],
            ["H2", typographyRange(root.resolvedPreset.typography.h2)],
            ["H3", typographyRange(root.resolvedPreset.typography.h3)],
            ["Corpo", typographyBody(root.resolvedPreset.typography.body)],
            ["Apoio", readableRem(root.resolvedPreset.typography.support)],
          ]} />
        </DataSection>
        <DataSection title="Critérios visuais" description="Baseline responsiva e de acessibilidade do contrato.">
          <DefinitionList items={[
            ["Baseline", "Referência WCAG 2.2"],
            ["Prioridade mobile", yesNo(root.visualCriteria.mobileFirst)],
            ["Viewport mínimo", `${root.visualCriteria.minViewportPx}px`],
            ["Viewports de evidência", root.visualCriteria.evidenceViewportsPx.map((value) => `${value}px`).join(", ")],
            ["Foco visível", yesNo(root.visualCriteria.visibleFocusRequired)],
            ["Sem truncamento", yesNo(root.visualCriteria.noTextTruncation)],
            ["Sem scroll por texto", yesNo(root.visualCriteria.noHorizontalScrollFromText)],
          ]} />
        </DataSection>
      </div>

      <DataSection title="Papéis visuais" description={`Opções de espaçamento: ${root.commonOptions.spacing.map(spacingLabel).join(", ")}.`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(root.visualRoles).map((role) => (
            <div key={role.key} className="rounded-md border border-border bg-background px-3 py-2">
              <p className="font-medium text-foreground">{visualRoleLabel(role.key)}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{visualRoleDescription(role.key)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{role.key}</p>
            </div>
          ))}
        </div>
      </DataSection>
    </div>
  );
}

function ModuleView({ data }: { data: ModuleData }) {
  const resolved = data.result?.ok ? data.result.value : null;
  const modules = data.identities.modules.map((module) => ({
    moduleKey: module.moduleKey,
    label: moduleLabel(module.moduleKey),
    variants: module.variants.map((variant) => ({
      variantKey: variant.variantKey,
      variantVersion: variant.variantVersion,
      label: variantLabel(variant.variantKey),
    })),
  }));

  return (
    <div className="space-y-4">
      <DataSection title="Catálogo de módulos" description={`Versão ${data.identities.moduleCatalogVersion}; ${data.identities.modules.length} módulos públicos.`}>
        <Table
          headings={["Módulo", "Status", "Função estrutural", "Variantes", "Capacidades", "Interações"]}
          minWidth="860px"
          columnWidths={["16%", "10%", "27%", "16%", "17%", "14%"]}
        >
          {data.identities.modules.map((module) => {
            const presentation = data.selection.modules.find((item) => item.moduleAlias === module.moduleKey);
            return (
              <tr key={module.moduleKey} className="align-top">
                <Cell primary={moduleLabel(module.moduleKey)} secondary={`${module.moduleKey} · v${module.moduleVersion}`} />
                <Cell primary={lifecycleLabel(module.lifecycleStatus)} />
                <Cell primary={moduleStructuralFunction(module.moduleKey, presentation?.purpose)} />
                <Cell primary={module.variants.map((variant) => variantLabel(variant.variantKey)).join(", ")} />
                <Cell primary={unique(presentation?.variants.flatMap((variant) => variant.capabilities) ?? []).map(capabilityLabel).join(", ") || "—"} />
                <Cell primary={unique(presentation?.variants.flatMap((variant) => variant.interactions) ?? []).map(interactionLabel).join(", ") || "Nenhuma"} />
              </tr>
            );
          })}
        </Table>
      </DataSection>

      <ModuleStructureFilters
        key={`${data.moduleIdentity?.moduleKey ?? ""}:${data.variantIdentity?.variantKey ?? ""}:${data.funnelProfileKey}`}
        modules={modules}
        initialModuleKey={data.moduleIdentity?.moduleKey ?? ""}
        initialVariantKey={data.variantIdentity?.variantKey ?? ""}
        initialFunnelProfileKey={data.funnelProfileKey}
      />

      {!resolved ? <FailureState title="Contrato do módulo indisponível" /> : (
        <>
          <DataSection title="Campos resolvidos" description="Contrato de conteúdo da variante selecionada.">
            <Table
              headings={["Campo", "Tipo / Cardinalidade", "Papel semântico", "Política", "Fonte"]}
              minWidth="760px"
              columnWidths={["17%", "17%", "21%", "20%", "25%"]}
            >
              {resolved.fieldContract.fields.map((field) => (
                <tr key={field.path} className="align-top">
                  <Cell primary={moduleFieldLabel(field.fieldKey)} secondary={field.fieldKey} />
                  <Cell primary={`${moduleFieldKindLabel(field.fieldKind)} · ${field.cardinality.min}–${field.cardinality.max}`} />
                  <Cell primary={"semanticRole" in field ? semanticRoleLabel(field.semanticRole) : "Não se aplica"} />
                  <Cell primary={moduleFieldPolicyLabel(field.policy)} />
                  <Cell primary={moduleFieldSourceLabel(field)} secondary={<ModuleFieldDetails field={field} />} />
                </tr>
              ))}
            </Table>
          </DataSection>
          <div className="grid gap-4 xl:grid-cols-2">
            <DataSection title="Interações" description="Contratos operacionais declarados pela variante.">
              {resolved.variant.interactionContracts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma interação declarada.</p> : (
                <div className="space-y-2">{resolved.variant.interactionContracts.map((contract) => <InteractionDetails key={contract.kind} contract={contract} />)}</div>
              )}
            </DataSection>
            <DataSection title="Critérios e fronteiras" description="Invariantes e limites do módulo canônico.">
              <DefinitionList items={[
                ["Estado do contrato", lifecycleLabel(resolved.module.lifecycleStatus)],
                ["Capacidades", resolved.variant.capabilities.map(capabilityLabel).join(", ") || "Nenhuma"],
                ["Interações permitidas", resolved.module.permittedInteractionKinds.map(interactionLabel).join(", ") || "Nenhuma"],
                ["Restrições", `${resolved.module.boundaries.length} declaradas`],
              ]} />
              <details className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <summary className="cursor-pointer font-medium text-foreground">Detalhes técnicos do contrato</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
                  {[...resolved.module.invariants, ...resolved.module.boundaries].map((item) => <li key={item}>{item}</li>)}
                </ul>
              </details>
            </DataSection>
          </div>
        </>
      )}
    </div>
  );
}

function InputView({ data }: { data: InputData }) {
  const resolved = data.result?.ok ? data.result.value : null;
  const chainError = data.chain && !data.chain.ok ? data.chain.error.message : null;
  return (
    <div className="space-y-4">
      <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-3">
        <input type="hidden" name="view" value="entradas" />
        <div className="flex flex-wrap items-end gap-3">
          <SelectField className="w-full sm:w-40" label="Versão" name="catalogVersion" defaultValue={data.version === null ? "" : String(data.version)}>
            {data.versions.map((version) => <option key={version} value={version}>Versão {version}</option>)}
          </SelectField>
          <SelectField className="w-full sm:w-40" label="Plano consultado" name="plan" defaultValue={data.plan}>
            {data.plans.map((plan) => <option key={plan} value={plan}>{planLabel(plan)}</option>)}
          </SelectField>
          <TaxonSelect className="w-full sm:min-w-72 sm:flex-1" taxons={data.taxons} selectedId={data.selectedTaxon?.id ?? ""} />
          <SubmitButton />
        </div>
      </form>

      {data.taxonError || chainError ? <FailureState title={data.taxonError ?? chainError ?? "Cadeia indisponível"} /> : null}
      {!resolved && !data.taxonError && !chainError ? <FailureState title="Catálogo de entradas indisponível" /> : null}
      {resolved ? (
        <>
          <CompactSummary
            label="Resumo das entradas"
            values={[
              resolved.servedTaxon.name,
              inputLayerLabel(resolved.servedTaxon.level),
              planLabel(resolved.plan),
              `v${resolved.version}`,
              resolved.appliedLayers.map((layer) => inputLayerLabel(layer.level)).join(" → "),
              `${resolved.fields.length} campos`,
              "Válido",
            ]}
          />
          <DataSection title="Campos resolvidos" description="Condições, validação e evidências ficam como detalhes secundários.">
            <Table
              headings={["Campo", "Finalidade", "Origem", "Tipo / Escopo", "Obrigação"]}
              minWidth="820px"
              columnWidths={["18%", "26%", "18%", "20%", "18%"]}
            >
              {resolved.fields.map((field) => (
                <Fragment key={field.fieldKey}>
                  <tr className="align-top">
                    <Cell primary={inputFieldLabel(field.fieldKey)} secondary={field.fieldKey} />
                    <Cell primary={field.purpose} />
                    <Cell primary={inputLayerLabel(field.originLayer)} secondary={field.originTaxon?.name ?? "Camada universal"} />
                    <Cell primary={`${inputValueTypeLabel(field.valueType)} · ${inputScopeLabel(field.valueScope)}`} secondary={inputExpectedOriginLabel(field.expectedValueOrigin)} />
                    <Cell primary={inputObligationLabel(field.obligation)} />
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-3 pb-3 pt-0"><InputFieldDetails field={field} /></td>
                  </tr>
                </Fragment>
              ))}
            </Table>
          </DataSection>
        </>
      ) : null}
    </div>
  );
}

function ResearchView({ data }: { data: ResearchData }) {
  const presentation = "presentation" in data ? data.presentation : null;
  return (
    <div className="space-y-4">
      <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-3">
        <input type="hidden" name="view" value="pesquisas" />
        <div className="flex flex-wrap items-end gap-3">
          <TaxonSelect className="w-full sm:min-w-80 sm:flex-1" taxons={data.taxons} selectedId={data.selectedTaxon?.id ?? ""} />
          <SubmitButton />
        </div>
      </form>

      {data.taxonError ? <FailureState title={data.taxonError} /> : null}
      {presentation ? (
        <>
          <section className="grid gap-3 md:grid-cols-2" aria-label="Estado das pesquisas">
            <ResearchStatusCard audience="Comprador empresarial (BB)" diagnostic={presentation.diagnostics.businessBuyer} />
            <ResearchStatusCard audience="Cliente final (EC)" diagnostic={presentation.diagnostics.endCustomer} />
          </section>
          <div className="grid gap-4 xl:grid-cols-2">
            {presentation.businessBuyer
              ? <ResearchAudience title="Comprador empresarial (BB)" presentation={presentation.businessBuyer} taxons={data.taxons} />
              : <ResearchUnavailable title="Comprador empresarial (BB)" diagnostic={presentation.diagnostics.businessBuyer} />}
            {presentation.endCustomer
              ? <ResearchAudience title="Cliente final (EC)" presentation={presentation.endCustomer} taxons={data.taxons} />
              : <ResearchUnavailable title="Cliente final (EC)" diagnostic={presentation.diagnostics.endCustomer} />}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ResearchAudience({ title, presentation, taxons }: {
  title: string;
  presentation: AdminTaxonResearchAudiencePresentation;
  taxons: readonly { id: string; name: string }[];
}) {
  const audience = presentation.audience;
  return (
    <DataSection title={title} description={`${taxonName(taxons, presentation.sourceTaxonId)} · ${researchSourceRelationLabel(presentation.sourceRelation)} · versão ${audience.version}`}>
      <Table headings={["Bloco", "Presença", "Itens ativos"]} minWidth="460px">
        {audience.researches.map((research) => (
          <tr key={research.researchId}>
            <Cell primary={researchBlockLabel(research.researchBlock)} secondary={research.researchBlock} />
            <td className="px-4 py-3"><AdminStatusBadge tone="success">Presente</AdminStatusBadge></td>
            <Cell primary={String(research.items.length)} />
          </tr>
        ))}
      </Table>
    </DataSection>
  );
}

function ResearchUnavailable({ title, diagnostic }: { title: string; diagnostic: AdminOperationalDiagnosticItem }) {
  return (
    <DataSection title={title} description="Esta ausência é específica desta audiência e não oculta a outra resolução.">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">{diagnostic.reason}</p>
        <AdminStatusBadge tone={diagnostic.tone}>{diagnostic.label}</AdminStatusBadge>
      </div>
    </DataSection>
  );
}

function ResearchStatusCard({ audience, diagnostic }: { audience: string; diagnostic: AdminOperationalDiagnosticItem }) {
  return (
    <article className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{audience}</p>
        <AdminStatusBadge tone={diagnostic.tone}>{diagnostic.label}</AdminStatusBadge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{diagnostic.reason}</p>
      <p className="mt-1 text-xs text-muted-foreground">Origem: {diagnostic.origin ?? "Não comprovada"}</p>
    </article>
  );
}

function ModuleFieldDetails({ field }: { field: ModuleField }) {
  const source = moduleFieldCopySource(field);
  return (
    <details className="mt-2 text-xs text-muted-foreground">
      <summary className="cursor-pointer font-medium text-foreground">Detalhes técnicos</summary>
      <CompactDetailList items={[
        ["Caminho canônico", field.path],
        ["Chave", field.fieldKey],
        ["Modo de fonte", source ? sourceModeLabel(source.sourceMode) : "Não se aplica"],
        ...(source && source.sourceMode !== "operational_evidence" ? [
          ["Caminho de pesquisa", source.researchPath],
          ["Itens principais", source.primaryItemKeys.reduce<string[]>((labels, item) => {
            if (item) labels.push(researchItemLabel(item));
            return labels;
          }, []).join(", ")],
          ["Item auxiliar", source.auxiliaryItemKey ? researchItemLabel(source.auxiliaryItemKey) : "Não se aplica"],
        ] as const : []),
        ...(source && source.sourceMode === "operational_evidence" ? [["Caminho de evidência", source.evidencePath]] as const : []),
        ...(source && source.sourceMode === "research_with_operational_support" ? [
          ["Suporte", "Evidência operacional obrigatória quando houver alegação"],
          ["Referências de suporte", source.operationalSupport.referenceKeys.join(", ")],
        ] as const : []),
        ...("support" in field && field.support ? [["Suporte", moduleFieldSupportLabel(field.support)]] as const : []),
      ]} />
    </details>
  );
}

function InteractionDetails({ contract }: { contract: ResolvedModule["variant"]["interactionContracts"][number] }) {
  if (contract.kind === "form") {
    return (
      <details className="rounded-md border border-border bg-background px-3 py-2">
        <summary className="cursor-pointer font-medium text-foreground">Formulário</summary>
        <CompactDetailList items={[
          ["Campos", contract.fields.map((field) => `${moduleFieldLabel(field.fieldKey)} (${formValueTypeLabel(field.valueType)}, ${inputObligationLabel(field.obligation)})`).join(" · ")],
          ["Consentimento", `Obrigatório · ${moduleFieldLabel(contract.consent.fieldKey)}`],
          ["Acessibilidade", "Rótulos, instruções e erros associados; operável por teclado"],
          ["Vínculo operacional", `${inputFieldLabel(contract.operationalBinding.inputCatalogFieldKey)} = ${contract.operationalBinding.requiredValue}`],
        ]} />
      </details>
    );
  }

  return (
    <details className="rounded-md border border-border bg-background px-3 py-2">
      <summary className="cursor-pointer font-medium text-foreground">Acordeão</summary>
      <CompactDetailList items={[
        ["Acessibilidade", "Operável por teclado, com estado expandido e região associada"],
        ["Comportamento", "Inicia recolhido; mantém foco; um item expandido por vez"],
      ]} />
    </details>
  );
}

function InputFieldDetails({ field }: { field: InputField }) {
  return (
    <details className="rounded-md border border-border bg-background px-3 py-2 text-sm">
      <summary className="cursor-pointer font-medium text-foreground">Condições, validação e proveniência</summary>
      <CompactDetailList items={[
        ["Condição", inputConditionLabel(field.requiredWhen ?? field.applicableWhen)],
        ["Validação", inputValidationLabel(field.validation)],
        ["Substituição", inputSubstitutionLabel(field.landingPageSubstitutionPolicy ?? "not_applicable")],
        ["Proveniência", field.provenance.map(inputProvenanceLabel).join(" · ")],
        ["Evidência", field.evidence.summary],
        ["Referências", field.evidence.references.map(evidenceReferenceLabel).join(" · ")],
      ]} />
    </details>
  );
}

function TaxonSelect({ taxons, selectedId, className }: {
  taxons: readonly { id: string; name: string; level: string; parentName: string | null }[];
  selectedId: string;
  className?: string;
}) {
  return (
    <SelectField className={className} label="Taxon ativo" name="taxon" defaultValue={selectedId}>
      {taxons.map((taxon) => <option key={taxon.id} value={taxon.id}>{taxon.name} · {inputLayerLabel(taxon.level)}{taxon.parentName ? ` · ${taxon.parentName}` : ""}</option>)}
    </SelectField>
  );
}

function SelectField({ label, name, defaultValue, children, className }: {
  label: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("space-y-1", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus-visible:ring-4">{children}</select>
    </label>
  );
}

function SubmitButton() {
  return <button type="submit" className="h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white outline-none transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20">Consultar</button>;
}

function CompactSummary({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <section aria-label={label} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground">
        {values.map((value, index) => (
          <Fragment key={`${value}-${index}`}>
            {index > 0 ? <span aria-hidden="true" className="text-muted-foreground">·</span> : null}
            <span>{value}</span>
          </Fragment>
        ))}
      </p>
    </section>
  );
}

function DataSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="border-b border-border px-3 py-2"><h2 className="font-semibold text-foreground">{title}</h2><p className="mt-0.5 text-sm text-muted-foreground">{description}</p></header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function Table({ headings, minWidth, columnWidths, children }: {
  headings: string[];
  minWidth: string;
  columnWidths?: readonly string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className={cn("w-full divide-y divide-border text-sm", columnWidths && "table-fixed")} style={{ minWidth }}>
        {columnWidths ? <colgroup>{columnWidths.map((width, index) => <col key={`${width}-${index}`} style={{ width }} />)}</colgroup> : null}
        <thead className="bg-muted text-left text-xs font-medium uppercase text-muted-foreground"><tr>{headings.map((heading) => <th key={heading} scope="col" className="whitespace-normal px-3 py-2.5">{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return <td className="px-3 py-2.5"><div className="max-w-md break-words whitespace-normal text-foreground">{primary || "—"}</div>{secondary ? <div className="mt-1 max-w-md break-words text-xs text-muted-foreground">{secondary}</div> : null}</td>;
}

function DefinitionList({ items }: { items: readonly (readonly [string, ReactNode])[] }) {
  return <dl className="grid gap-2 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-md border border-border bg-background px-3 py-2"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm text-foreground">{value || "—"}</dd></div>)}</dl>;
}

function CompactDetailList({ items }: { items: readonly (readonly [string, ReactNode])[] }) {
  return <dl className="mt-2 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">{items.map(([label, value]) => <div key={label}><dt className="font-medium text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words text-foreground">{value || "—"}</dd></div>)}</dl>;
}

function FailureState({ title }: { title: string }) {
  return <div role="status" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{title}. Nenhum contrato foi aproximado ou alterado.</div>;
}

function presetLabel(value: string) {
  return value === "balanced" ? "Equilibrado" : value === "compact" ? "Compacto" : humanize(value);
}

function presetDescription(value: string) {
  if (value === "balanced") return "Espaçamento padrão, página até 72rem, leitura até 68ch e títulos mais amplos.";
  if (value === "compact") return "Espaçamento mais contido, página até 68rem, leitura até 64ch e títulos menores.";
  return "Parâmetros efetivos do preset selecionado.";
}

function lifecycleLabel(value: string) {
  return value === "hypothesis" ? "Hipótese" : value === "validated" ? "Validado" : value === "deprecated" ? "Descontinuado" : humanize(value);
}

function spacingLabel(value: string) {
  return value === "compact" ? "Compacto" : value === "default" ? "Padrão" : value === "spacious" ? "Amplo" : humanize(value);
}

function typographyRange(value: { min: string; max: string }) { return `${readableRem(value.min)}–${readableRem(value.max)}`; }

function typographyBody(value: { base: string; editorialEmphasis?: string }) {
  return value.editorialEmphasis ? `${readableRem(value.base)}; ênfase editorial ${readableRem(value.editorialEmphasis)}` : readableRem(value.base);
}

function readableRem(value: string) { return value.replace(".", ",").replace(/rem$/, " rem"); }

function semanticRoleLabel(value: string) {
  const labels: Record<string, string> = {
    eyebrow: "Sobretítulo", h1: "Título principal", h2: "Título de seção", h3: "Subtítulo de seção", paragraph: "Parágrafo", cta_label: "Rótulo da ação", privacy_note: "Nota de privacidade", faq_question: "Pergunta frequente", faq_answer: "Resposta frequente", card_title: "Título de card", card_body: "Texto de card", benefit_item: "Item de benefício", step_label: "Rótulo de etapa", step_title: "Título de etapa", step_body: "Texto de etapa",
  };
  return labels[value] ?? humanize(value);
}

function visualRoleLabel(value: string) {
  const labels: Record<string, string> = { primary_action: "Ação principal", focus_indicator: "Indicador de foco", border: "Borda", surface: "Superfície", text: "Texto", state: "Estado" };
  return labels[value] ?? humanize(value);
}

function visualRoleDescription(value: string) {
  const descriptions: Record<string, string> = {
    primary_action: "Tratamento da ação prioritária de conversão.", focus_indicator: "Indicador visível na navegação por teclado.", border: "Tratamento de limites e divisórias.", surface: "Tratamento de página e seções.", text: "Tratamento de cor e legibilidade do texto.", state: "Tratamento dos estados de retorno.",
  };
  return descriptions[value] ?? "Papel visual declarado pelo contrato canônico.";
}

function moduleLabel(value: string) {
  const labels: Record<string, string> = {
    hero: "Herói", trust_bar: "Faixa de confiança", problem_solution: "Problema e solução", offer: "Oferta", benefits: "Benefícios", comparison: "Comparação", lead_capture: "Captura de lead", process: "Processo", technical_assurance: "Garantia técnica", social_proof: "Prova social", faq: "Perguntas frequentes", final_cta: "Ação final",
  };
  return labels[value] ?? humanize(value);
}

function variantLabel(value: string) {
  const variant = value.includes(".") ? value.split(".").at(-1)?.replace(/@v\d+$/, "") ?? value : value;
  return variant === "standard" ? "Padrão" : variant === "form" ? "Formulário" : variant === "accordion" ? "Acordeão" : humanize(variant);
}

function moduleStructuralFunction(moduleKey: string, fallback?: string) {
  const functions: Record<string, string> = {
    hero: "Apresenta a proposta principal e conduz à rota prioritária.", trust_bar: "Apresenta sinais breves e verificáveis de confiança.", problem_solution: "Relaciona problema ou risco a uma resposta prática.", offer: "Apresenta ofertas ou casos de uso disponíveis.", benefits: "Apresenta benefícios práticos sustentados por pesquisa e operação.", comparison: "Compara alternativas ou critérios de forma neutra.", lead_capture: "Conduz uma conversão de contato com foco.", process: "Apresenta etapas do processo de forma clara.", technical_assurance: "Apresenta garantias e critérios técnicos verificáveis.", social_proof: "Apresenta prova social verificável.", faq: "Esclarece objeções e dúvidas frequentes.", final_cta: "Reforça a próxima ação ao final da página.",
  };
  return functions[moduleKey] ?? (fallback ? humanize(fallback) : "Função estrutural declarada.");
}

function capabilityLabel(value: string) {
  const labels: Record<string, string> = { primary_action: "Ação principal", image_asset: "Ativo de imagem", accordion_interaction: "Acordeão", embedded_form: "Formulário incorporado" };
  return labels[value] ?? humanize(value);
}

function interactionLabel(value: string) { return value === "form" ? "Formulário" : value === "accordion" ? "Acordeão" : humanize(value); }

function moduleFieldLabel(value: string) {
  const labels: Record<string, string> = {
    eyebrow: "Sobretítulo", title: "Título", subtitle: "Subtítulo", description: "Descrição", body: "Texto", label: "Rótulo", image: "Imagem", logo: "Logotipo", items: "Itens", item: "Item", question: "Pergunta", answer: "Resposta", primaryAction: "Ação principal", secondaryAction: "Ação secundária", action: "Ação", name: "Nome", role: "Função", proof: "Prova", heading: "Título", caption: "Legenda", privacyConsent: "Consentimento de privacidade",
  };
  return labels[value] ?? humanize(value);
}

function moduleFieldKindLabel(value: string) {
  const labels: Record<string, string> = { text: "Texto", collection: "Coleção", action: "Ação", image: "Imagem", technical_reference: "Referência técnica" };
  return labels[value] ?? humanize(value);
}

function moduleFieldPolicyLabel(value: string) {
  const labels: Record<string, string> = { research_guided: "Orientado por pesquisa", hybrid: "Híbrido", operational_required: "Exige evidência operacional", technical_reference: "Referência técnica", not_copy: "Não é copy" };
  return labels[value] ?? humanize(value);
}

function moduleFieldSupportLabel(value: string) { return value === "when_factual" ? "Quando houver dado factual" : value === "when_present" ? "Quando estiver presente" : humanize(value); }

function moduleFieldCopySource(field: ModuleField) {
  if ("copySourceMap" in field) return field.copySourceMap;
  if ("label" in field) return field.label.copySourceMap;
  return null;
}

function moduleFieldSourceLabel(field: ModuleField) {
  const source = moduleFieldCopySource(field);
  if (source) return sourceModeLabel(source.sourceMode);
  if (field.fieldKind === "collection") return "Estrutura de coleção";
  if (field.fieldKind === "technical_reference" || field.fieldKind === "image") return "Referência técnica";
  return "Não se aplica";
}

function sourceModeLabel(value: string) {
  return value === "research" ? "Pesquisa" : value === "research_with_operational_support" ? "Pesquisa + suporte operacional" : value === "operational_evidence" ? "Evidência operacional" : humanize(value);
}

function researchItemLabel(value: string) {
  const labels: Record<string, string> = { positioning_opportunity: "Oportunidade de posicionamento", trigger: "Gatilho", desire: "Desejo", pain: "Dor", objection: "Objeção", proof_type: "Tipo de prova", belief: "Crença", fear: "Receio", narrative_arc: "Arco narrativo", awareness_level: "Nível de consciência", search_intent: "Intenção de busca", commercial_keywords: "Palavras-chave comerciais", faq_questions: "Perguntas frequentes" };
  return labels[value] ?? humanize(value);
}

function formValueTypeLabel(value: string) { return value === "text" ? "Texto" : value === "email" ? "E-mail" : value === "phone" ? "Telefone" : humanize(value); }

function planLabel(value: string) { return value === "starter" ? "Starter" : value === "lite" ? "Lite" : value === "pro" ? "Pro" : value === "ultra" ? "Ultra" : humanize(value); }

function inputLayerLabel(value: string) {
  const labels: Record<string, string> = { universal: "Universal", segment: "Segmento", niche: "Nicho", ultra_niche: "Ultranicho" };
  return labels[value] ?? humanize(value);
}

function inputValueTypeLabel(value: string) {
  const labels: Record<string, string> = { string: "Texto", phone: "Telefone", email: "E-mail", url: "URL", enum: "Opção", string_list: "Lista de textos", boolean: "Sim ou não", number_range: "Faixa numérica", keyword_map: "Mapa de palavras-chave", asset_reference: "Referência de ativo", color_palette: "Paleta de cores" };
  return labels[value] ?? humanize(value);
}

function inputScopeLabel(value: string) {
  const labels: Record<string, string> = { account: "Conta", business: "Negócio", offer: "Oferta", campaign: "Campanha", landing_page: "Landing page" };
  return labels[value] ?? humanize(value);
}

function inputExpectedOriginLabel(value: string) {
  const labels: Record<string, string> = { account_provided: "Informado pela conta", business_provided: "Informado pelo negócio", offer_provided: "Informado pela oferta", campaign_provided: "Informado pela campanha", landing_page_provided: "Informado na landing page" };
  return labels[value] ?? humanize(value);
}

function inputObligationLabel(value: string) { return value === "required" ? "Obrigatório" : value === "optional" ? "Opcional" : value === "conditional" ? "Condicional" : humanize(value); }

function inputSubstitutionLabel(value: string) { return value === "not_applicable" ? "Não se aplica" : value === "forbidden" ? "Vedada" : value === "explicit_allowed" ? "Permitida explicitamente" : humanize(value); }

function inputFieldLabel(value: string) {
  const labels: Record<string, string> = {
    primary_conversion_channel: "Canal principal de conversão", business_display_name: "Nome de exibição do negócio", funnel_stage: "Estágio do funil", traffic_source: "Origem do tráfego", whatsapp_destination: "Destino no WhatsApp", phone_destination: "Telefone de destino", email_destination: "E-mail de destino", external_url_destination: "URL externa de destino", privacy_policy_url: "URL da política de privacidade", paid_search_keyword_map: "Mapa de palavras-chave de mídia paga", service_locations: "Locais atendidos", property_types: "Tipos de imóvel", property_price_range: "Faixa de preço dos imóveis", property_stage: "Estágio do imóvel", transaction_intent: "Intenção de transação", financing_support_available: "Suporte a financiamento", document_support_available: "Suporte documental", creci_registration: "Registro CRECI", attendance_modes: "Modalidades de atendimento", primary_service_or_offer: "Serviço ou oferta principal", primary_service_or_offer_description: "Descrição do serviço ou oferta", brand_logo_asset: "Ativo do logotipo", brand_color_palette: "Paleta de cores da marca",
  };
  return labels[value] ?? humanize(value);
}

function inputConditionLabel(condition: InputField["requiredWhen"] | undefined) {
  if (!condition) return "Sem condição adicional";
  const value = Array.isArray(condition.value) ? condition.value.map(inputOptionLabel).join(", ") : inputOptionLabel(String(condition.value));
  return condition.operator === "equals" ? `${inputFieldLabel(condition.fieldKey)} é ${value}` : `${inputFieldLabel(condition.fieldKey)} está entre ${value}`;
}

function inputValidationLabel(validation: InputField["validation"]) {
  if (validation.kind === "type_only") return "Tipo informado pelo contrato";
  if (validation.kind === "e164") return "Telefone no formato internacional";
  if (validation.kind === "email") return "E-mail válido";
  if (validation.kind === "https_url") return "URL HTTPS válida";
  if (validation.kind === "keyword_map") return "Mapa de palavras-chave válido";
  if (validation.kind === "asset_reference") return "Referência de ativo válida";
  if (validation.kind === "color_palette") return "Paleta com papéis de cor válidos";
  if (validation.kind === "enum") return `Opções: ${validation.allowedValues.map(inputOptionLabel).join(", ")}`;
  if (validation.kind === "string_list") {
    const limits = [validation.minItems ? `mínimo ${validation.minItems}` : null, validation.maxItems ? `máximo ${validation.maxItems}` : null].filter(Boolean).join(", ");
    return validation.allowedValues ? `Opções: ${validation.allowedValues.map(inputOptionLabel).join(", ")}${limits ? `; ${limits}` : ""}` : limits || "Lista de textos válida";
  }
  if (validation.kind === "number_range") {
    const limits = [validation.minimum !== undefined ? `mínimo ${validation.minimum}` : null, validation.maximum !== undefined ? `máximo ${validation.maximum}` : null].filter(Boolean).join(", ");
    return `Faixa numérica${limits ? `: ${limits}` : ""}${validation.currency ? ` (${validation.currency})` : ""}`;
  }
  return "Validação do contrato";
}

function inputOptionLabel(value: string) {
  const labels: Record<string, string> = { form: "Formulário", whatsapp: "WhatsApp", phone: "Telefone", email: "E-mail", external_url: "URL externa", paid_search: "Mídia paga", organic: "Orgânico" };
  return labels[value] ?? humanize(value);
}

function inputProvenanceLabel(item: InputField["provenance"][number]) {
  const propertyLabels: Record<string, string> = { definition: "Definição", obligation: "Obrigação", allowedPlans: "Planos permitidos", validation: "Validação" };
  return `${propertyLabels[item.property] ?? humanize(item.property)}: ${inputLayerLabel(item.layer)}${item.taxon ? ` (${item.taxon.name})` : ""}`;
}

function evidenceReferenceLabel(value: string) {
  const labels: Record<string, string> = { "decision:lp-planning": "Decisão de planejamento da LP", "decision:e20-2-human": "Decisão humana E20.2", "technical:current-contracts": "Contratos técnicos atuais", "empirical:real-estate-research": "Pesquisa imobiliária", "context:real-estate-pilot": "Contexto do piloto imobiliário" };
  return labels[value] ?? value;
}

function researchSourceRelationLabel(value: string) { return value === "own" ? "Própria" : value === "direct_parent" ? "Pai direto" : humanize(value); }

function researchBlockLabel(value: string) {
  const labels: Record<string, string> = { pains: "Dores", desires: "Desejos", objections: "Objeções", proofs: "Provas", beliefs: "Crenças", fears: "Receios", positioning: "Posicionamento", search_intent: "Intenção de busca", commercial_keywords: "Palavras-chave comerciais", faq: "Perguntas frequentes" };
  return labels[value] ?? humanize(value);
}

function humanize(value: string) { return value.replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function yesNo(value: boolean) { return value ? "Sim" : "Não"; }

function unique(values: readonly string[]) { return [...new Set(values)]; }

function taxonName(taxons: readonly { id: string; name: string }[], id: string) { return taxons.find((taxon) => taxon.id === id)?.name ?? "Taxon de origem"; }
