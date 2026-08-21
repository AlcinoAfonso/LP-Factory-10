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
  recordInputCatalogReviewAction,
  reopenInputCatalogReviewAction,
  evaluateInputCatalogAction,
  confirmInputCatalogEvaluationAction,
  rejectInputCatalogCandidatesAndConfirmSufficientAction,
  acknowledgeInputCatalogGapAction,
} from "../actions";
import { AdminTaxonInputCatalogEvaluationRuntime } from "./_components/AdminTaxonInputCatalogEvaluation";
import { AdminTaxonInputCatalogReview } from "./_components/AdminTaxonInputCatalogReview";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminTaxonDetailPageProps = {
  params: Promise<{ taxonId: string }>;
};

export default async function AdminTaxonDetailPage({ params }: AdminTaxonDetailPageProps) {
  const { taxonId } = await params;
  const taxon = await getAdminTaxonDetail(taxonId);

  if (!taxon) notFound();
  const inputCatalogEvaluationRuntime = taxon.inputCatalogReview.status === "available"
    ? await resolveInputCatalogEvaluationRuntimeReadiness()
    : null;
  const inputCatalogLegacyMode = inputCatalogEvaluationRuntime === null
    ? "unavailable"
    : inputCatalogEvaluationRuntime.ok
      ? "runtime_active"
      : inputCatalogEvaluationRuntime.code === "ROLLOUT_GATE_OFF"
        ? "rollout_gate_off"
        : "operational_configuration_unproven";
  const legacyAvailable = inputCatalogLegacyMode === "rollout_gate_off";

  return (
    <div className="space-y-6">
      <Link className="text-sm font-medium text-brand-700 hover:underline" href="/admin/taxonomia">
        Voltar para taxonomia
      </Link>

      <AdminPageHeader
        title={taxon.name}
        description="Gestao controlada do taxon, com edicao basica, aliases e exclusao segura."
        meta={taxon.id}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Taxon</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label="Nivel" value={taxon.level} />
            <Detail label="Slug" value={taxon.slug} />
            <Detail label="Pai" value={taxon.parentName ?? "-"} />
            <Detail label="Aliases" value={String(taxon.aliasCount)} />
            <Detail label="Status">
              <AdminStatusBadge tone={taxon.isActive ? "success" : "neutral"}>
                {taxon.isActive ? "Ativo" : "Inativo"}
              </AdminStatusBadge>
            </Detail>
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-card-foreground">Uso operacional</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Contas" value={String(taxon.usage.accountLinks)} />
            <Detail label="Resolucao selecionada" value={String(taxon.usage.selectedResolutions)} />
            <Detail label="Sugestao IA" value={String(taxon.usage.aiSuggestedResolutions)} />
            <Detail label="Templates" value={String(taxon.usage.contentTemplateLinks)} />
            <Detail label="Pesquisas" value={String(taxon.usage.marketResearch)} />
            <Detail label="Filhos diretos" value={String(taxon.children.length)} />
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">Diagnóstico operacional</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estado, origem, bloqueio e proxima acao sem alterar os fluxos responsaveis.
          </p>
        </div>
        <div className="mt-4 grid max-w-xl gap-4">
          <DiagnosticCard label="Página comercial" item={taxon.diagnostic.commercialPage} />
        </div>
      </section>

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

      {taxon.inputCatalogReview.status === "disabled" ? null : (
        <AdminTaxonInputCatalogReview
          legacyMode={inputCatalogLegacyMode}
          recordAction={recordInputCatalogReviewAction}
          reopenAction={reopenInputCatalogReviewAction}
          review={
            !legacyAvailable && taxon.inputCatalogReview.status === "available"
              ? { ...taxon.inputCatalogReview, handoff: "" }
              : taxon.inputCatalogReview
          }
          taxonId={taxon.id}
        />
      )}

      {taxon.inputCatalogReview.status === "available" && inputCatalogEvaluationRuntime?.ok ? (
        <AdminTaxonInputCatalogEvaluationRuntime
          acknowledgeGapAction={acknowledgeInputCatalogGapAction}
          confirmAction={confirmInputCatalogEvaluationAction}
          currentReviewedVersion={taxon.inputCatalogReview.reviewedVersion}
          evaluateAction={evaluateInputCatalogAction}
          rejectCandidatesAndConfirmAction={rejectInputCatalogCandidatesAndConfirmSufficientAction}
          taxonId={taxon.id}
        />
      ) : null}

      {taxon.inputCatalogReview.status === "available" && inputCatalogEvaluationRuntime && !inputCatalogEvaluationRuntime.ok ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {inputCatalogEvaluationRuntime.code === "ROLLOUT_GATE_OFF"
              ? "Runtime OpenAI gate-off"
              : "Runtime OpenAI bloqueado"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-card-foreground">Avaliação factual do catálogo E20.2</h2>
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {inputCatalogEvaluationRuntime.message}
            {inputCatalogEvaluationRuntime.code === "ROLLOUT_GATE_OFF"
              ? " O handoff Codex acima permanece o caminho autorizado."
              : " Runtime e caminhos legados permanecem bloqueados até a configuração ser comprovada."}
          </p>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold text-card-foreground">Filhos diretos</h2>
        {taxon.children.length === 0 ? (
          <EmptyState className="mt-4 text-left" title="Nenhum taxon filho direto" />
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {taxon.children.map((child) => (
              <Link
                className="rounded-md border border-border p-3 transition hover:border-brand-500 hover:bg-muted/60"
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
        <Link className="mt-3 inline-flex font-medium text-brand-700 hover:underline" href={item.href}>
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
