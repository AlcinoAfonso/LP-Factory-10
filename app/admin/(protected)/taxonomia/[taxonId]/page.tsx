import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTaxonManageForm } from "@/components/admin/AdminTaxonManageForm";
import { AdminTaxonResearchSelectionForm } from "@/components/admin/AdminTaxonResearchSelectionForm";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminTaxonDetail } from "@/lib/admin/adapters/adminReadOnlyAdapter";
import { resolveInputCatalogEvaluationRuntimeReadiness } from "@/conversion-content/adapters/inputCatalogEvaluationRuntimeGate";
import type { AdminOperationalDiagnosticItem } from "@/lib/admin/adapters/adminReadOnlyTypes";
import {
  addTaxonAliasAction,
  deleteTaxonAction,
  deleteTaxonAliasAction,
  selectEndCustomerResearchAction,
  updateTaxonAction,
  releaseTaxonAction,
  evaluateInputCatalogAction,
  confirmInputCatalogEvaluationAction,
  rejectInputCatalogCandidatesAndConfirmSufficientAction,
  acknowledgeInputCatalogGapAction,
} from "../actions";
import { AdminTaxonInputCatalogEvaluationRuntime } from "./_components/AdminTaxonInputCatalogEvaluation";
import { AdminTaxonFactualCoverage } from "./_components/AdminTaxonFactualCoverage";
import { CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION } from "@/conversion-content/landing-page/input-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminTaxonDetailPageProps = {
  params: Promise<{ taxonId: string }>;
};

export default async function AdminTaxonDetailPage({ params }: AdminTaxonDetailPageProps) {
  const { taxonId } = await params;
  const taxon = await getAdminTaxonDetail(taxonId);

  if (!taxon) notFound();
  const inputCatalogEvaluationAvailable = taxon.factualRelease.status === "available";
  const selectedResearchVersion = taxon.endCustomerResearchSelection.status === "available"
    ? taxon.endCustomerResearchSelection.selectedVersion
    : null;
  const inputCatalogEvaluationRuntime = inputCatalogEvaluationAvailable
    ? await resolveInputCatalogEvaluationRuntimeReadiness()
    : null;

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-brand-700 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-brand-600/30"
        href="/admin/taxonomia"
      >
        Voltar para taxonomia
      </Link>

      <AdminPageHeader
        title={taxon.name}
        description="Cobertura factual corrente, decisões humanas e apoio opcional organizados em um único fluxo administrativo."
      />

      <section
        aria-labelledby="taxon-identity-title"
        className="rounded-lg border border-border bg-card p-5 shadow-card"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Identidade e estado
            </p>
            <h2 className="mt-1 text-lg font-semibold text-card-foreground" id="taxon-identity-title">
              {taxon.name}
            </h2>
          </div>
          <AdminStatusBadge tone={taxon.isActive ? "success" : "neutral"}>
            {taxon.isActive ? "Ativo" : "Inativo"}
          </AdminStatusBadge>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Nível" value={taxon.level} />
          <Detail label="Slug" value={taxon.slug} />
          <Detail label="Pai" value={taxon.parentName ?? "Universal"} />
          <Detail label="Aliases" value={String(taxon.aliasCount)} />
        </dl>
      </section>

      <AdminTaxonFactualCoverage
        release={taxon.factualRelease}
        releaseAction={releaseTaxonAction}
        taxonId={taxon.id}
      />

      <section aria-labelledby="taxon-human-actions-title" className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ações humanas
          </p>
          <h2 className="mt-1 text-lg font-semibold text-card-foreground" id="taxon-human-actions-title">
            Gestão administrativa
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Edite o taxon, seus aliases e a fonte factual sem depender da recomendação da IA.
          </p>
        </div>

        <AdminTaxonManageForm
          taxon={taxon}
          updateAction={updateTaxonAction}
          addAliasAction={addTaxonAliasAction}
          deleteAliasAction={deleteTaxonAliasAction}
          deleteAction={deleteTaxonAction}
        />

        {taxon.endCustomerResearchSelection.status === "disabled" ? null : (
          <AdminTaxonResearchSelectionForm
            action={selectEndCustomerResearchAction}
            isActive={taxon.isActive}
            selection={taxon.endCustomerResearchSelection}
            taxonId={taxon.id}
          />
        )}
      </section>

      {inputCatalogEvaluationAvailable && inputCatalogEvaluationRuntime?.ok ? (
        <AdminTaxonInputCatalogEvaluationRuntime
          acknowledgeGapAction={acknowledgeInputCatalogGapAction}
          confirmAction={confirmInputCatalogEvaluationAction}
          currentInputCatalogVersion={CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION}
          isActive={taxon.isActive}
          selectedResearchVersion={selectedResearchVersion}
          evaluateAction={evaluateInputCatalogAction}
          rejectCandidatesAndConfirmAction={rejectInputCatalogCandidatesAndConfirmSufficientAction}
          taxonId={taxon.id}
        />
      ) : null}

      {inputCatalogEvaluationAvailable && inputCatalogEvaluationRuntime && !inputCatalogEvaluationRuntime.ok ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Apoio opcional por IA
          </p>
          <h2 className="mt-1 text-lg font-semibold text-card-foreground">
            {taxon.isActive
              ? "Revisão factual voluntária do catálogo E20.2"
              : "Avaliação factual do catálogo E20.2"}
          </h2>
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {inputCatalogEvaluationRuntime.message}
            {taxon.isActive
              ? " O taxon permanece ativo; apenas as sugestões por IA estão indisponíveis."
              : " A liberação humana sem IA acima permanece disponível; apenas as sugestões por IA estão indisponíveis."}
          </p>
        </section>
      ) : null}

      <details className="rounded-lg border border-border bg-card shadow-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-5 py-4 text-sm font-semibold text-card-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30">
          Detalhes técnicos e operacionais
          <span aria-hidden="true" className="text-muted-foreground">+</span>
        </summary>
        <div className="space-y-5 border-t border-border p-5">
          <section aria-labelledby="taxon-operational-use-title">
            <h2 className="text-sm font-semibold text-card-foreground" id="taxon-operational-use-title">
              Uso operacional
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Identificador técnico" value={taxon.id} />
              <Detail label="Contas" value={String(taxon.usage.accountLinks)} />
              <Detail label="Resolução selecionada" value={String(taxon.usage.selectedResolutions)} />
              <Detail label="Sugestão IA" value={String(taxon.usage.aiSuggestedResolutions)} />
              <Detail label="Templates" value={String(taxon.usage.contentTemplateLinks)} />
              <Detail label="Pesquisas" value={String(taxon.usage.marketResearch)} />
            </dl>
          </section>

          <section aria-labelledby="taxon-operational-diagnostic-title">
            <h2 className="text-sm font-semibold text-card-foreground" id="taxon-operational-diagnostic-title">
              Diagnóstico operacional
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Estado, origem, bloqueio e próxima ação sem alterar os fluxos responsáveis.
            </p>
            <div className="mt-4 grid max-w-xl gap-4">
              <DiagnosticCard label="Página comercial" item={taxon.diagnostic.commercialPage} />
            </div>
          </section>

          <section aria-labelledby="taxon-direct-children-title">
            <h2 className="text-sm font-semibold text-card-foreground" id="taxon-direct-children-title">
              Filhos diretos
            </h2>
            {taxon.children.length === 0 ? (
              <EmptyState className="mt-4 text-left" title="Nenhum taxon filho direto" />
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {taxon.children.map((child) => (
                  <Link
                    className="min-h-11 rounded-md border border-border p-3 outline-none transition hover:border-brand-500 hover:bg-muted/60 focus-visible:ring-4 focus-visible:ring-brand-600/30"
                    href={`/admin/taxonomia/${child.id}`}
                    key={child.id}
                  >
                    <div className="font-medium text-foreground">{child.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{child.level} / {child.slug}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </details>
    </div>
  );
}

function DiagnosticCard({ label, item }: { label: string; item: AdminOperationalDiagnosticItem }) {
  return (
    <article className="rounded-md border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-2">
        <AdminStatusBadge tone={item.tone}>{item.label}</AdminStatusBadge>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <Detail label="Origem" value={item.origin ?? "—"} />
        <Detail label="Motivo" value={item.reason} />
        <Detail label="Próxima ação" value={item.nextAction} />
      </dl>
      {item.href ? (
        <Link
          className="mt-3 inline-flex min-h-11 items-center rounded-md font-medium text-brand-700 outline-none ring-brand-600/20 hover:underline focus-visible:ring-4"
          href={item.href}
        >
          {item.nextAction}
        </Link>
      ) : null}
    </article>
  );
}

function Detail({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words text-foreground">{children ?? value}</dd>
    </div>
  );
}
