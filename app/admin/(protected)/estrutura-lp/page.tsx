import Link from "next/link";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import {
  adminLandingPageStructureViews,
  normalizeAdminLandingPageStructureView,
  readAdminLandingPageStructure,
  type AdminLandingPageStructureView,
} from "@/lib/admin/adapters/adminLandingPageStructureAdapter";
import { cn } from "@/lib/utils";
import { parseEvaluationSuggestionHandoff } from "@/lib/admin/evaluationSuggestionHandoff";
import { AdminFactualFields } from "./_components/AdminFactualFields";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
type StructureRead = Awaited<ReturnType<typeof readAdminLandingPageStructure>>;
type RootData = Extract<StructureRead, { view: "parametros" }>["data"];

const viewLabels: Record<AdminLandingPageStructureView, string> = { parametros: "Parâmetros", entradas: "Entradas" };

export default async function AdminLandingPageStructurePage({ searchParams }: PageProps) {
  const rawParams = (await searchParams) ?? {};
  const query = Object.fromEntries(Object.entries(rawParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const view = normalizeAdminLandingPageStructureView(query.view);
  const structure = await readAdminLandingPageStructure(view, query);
  return (
    <div className="space-y-4">
      <AdminPageHeader eyebrow="Contrato estrutural corrente" title="Estrutura da LP" />
      <nav aria-label="Visões da estrutura da LP" className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
        {adminLandingPageStructureViews.map((candidate) => (
          <Link key={candidate} href={`/admin/estrutura-lp?view=${candidate}`} aria-current={candidate === view ? "page" : undefined}
            className={cn("min-h-11 shrink-0 border-b-2 px-3 py-2 text-sm font-medium outline-none transition focus-visible:rounded-sm focus-visible:ring-4 focus-visible:ring-brand-600/20", candidate === view ? "border-brand-600 text-brand-700" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground")}>
            {viewLabels[candidate]}
          </Link>
        ))}
      </nav>
      {structure.view === "parametros" ? <RootView data={structure.data} /> : null}
      {structure.view === "entradas" ? <AdminFactualFields data={structure.data} suggestion={query.taxon === structure.data.selectedTaxon?.id ? parseEvaluationSuggestionHandoff(query) : null} /> : null}
    </div>
  );
}

function RootView({ data }: { data: RootData }) {
  if (!data.result) return <EmptyState title="Contrato raiz indisponível" description="Nenhum contrato de parâmetros foi encontrado." />;
  if (!data.result.ok) return <FailureState title="Parâmetros indisponíveis" />;
  const root = data.result.value;
  return (
    <div className="space-y-4">
      <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-4">
        <input type="hidden" name="view" value="parametros" />
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Contrato raiz" name="rootVersion" defaultValue={String(root.rootVersion)}>
            {data.versions.map((version) => <option key={version} value={version}>Raiz {version}</option>)}
          </Select>
          <Select label="Preset" name="preset" defaultValue={root.resolvedPresetKey}>
            {Object.values(root.presets).map((preset) => <option key={preset.key} value={preset.key}>{humanize(preset.key)}</option>)}
          </Select>
          <button className="min-h-11 rounded-md bg-brand-600 px-4 text-sm font-medium text-white outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30" type="submit">Consultar</button>
        </div>
      </form>
      <Section title="Papéis semânticos" description="Faixas editoriais e limites canônicos preservados da E18.4.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(root.semanticRoles).map((role) => (
            <article key={role.key} className="rounded-md border border-border bg-background p-3">
              <h3 className="font-medium">{humanize(role.key)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Recomendado: {role.textRange.recommended.min}–{role.textRange.recommended.max} caracteres</p>
              <p className="text-sm text-muted-foreground">Máximo: {role.textRange.absoluteMax}</p>
            </article>
          ))}
        </div>
      </Section>
      <Section title="Critérios visuais" description="Baseline responsiva e acessível do contrato raiz.">
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Baseline" value="WCAG 2.2" />
          <Metric label="Viewport mínimo" value={`${root.visualCriteria.minViewportPx}px`} />
          <Metric label="Foco visível" value={root.visualCriteria.visibleFocusRequired ? "Obrigatório" : "Não exigido"} />
          <Metric label="Prioridade mobile" value={root.visualCriteria.mobileFirst ? "Sim" : "Não"} />
          <Metric label="Largura da página" value={root.resolvedPreset.maxPageWidth} />
          <Metric label="Largura de leitura" value={root.resolvedPreset.maxReadingWidth} />
        </dl>
      </Section>
    </div>
  );
}

function Select({ label, name, defaultValue, children }: { label: string; name: string; defaultValue: string; children: ReactNode }) {
  return <label className="min-w-48 space-y-1"><span className="block text-xs font-medium text-muted-foreground">{label}</span><select className="min-h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20" name={name} defaultValue={defaultValue}>{children}</select></label>;
}
function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-lg border border-border bg-card p-4"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p><div className="mt-3">{children}</div></section>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-border p-3"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>; }
function FailureState({ title }: { title: string }) { return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{title}. Nenhum fallback foi aplicado.</div>; }
function humanize(value: string) { return value.replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
