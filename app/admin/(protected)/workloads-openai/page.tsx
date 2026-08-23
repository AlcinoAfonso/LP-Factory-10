import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  listOpenAiWorkloadPresentations,
  listOpenAiWorkloadInventory,
  readOpenAiAdministrativeConfigurations,
  readOpenAiModelCatalog,
  type OpenAiAdministrativeConfigurationReadResult,
  type OpenAiModelCatalogReadResult,
} from "@/openai-workloads";
import { projectOpenAiWorkloadConfigurationOptions } from "@/openai-workloads/adapters/modelCatalogAdapterCore";
import { OpenAiConfigurationManager } from "./_components/OpenAiConfigurationManager";
import { OpenAiModelCatalogManager } from "./_components/OpenAiModelCatalogManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const effortLabels = {
  none: "Nenhum",
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  xhigh: "Extra-alto",
  max: "Máximo",
  not_applicable: "Não aplicável",
} as const;

const sourceLabels = {
  repo_catalog: "Catálogo do repositório",
  github_actions_default_reference: "Referência padrão do GitHub Actions",
} as const;

export default async function OpenAiWorkloadsPage() {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    if (gate.redirect === "/auth/login") {
      redirect("/auth/login?next=%2Fadmin%2Fworkloads-openai");
    }
    redirect(gate.redirect);
  }

  const inventory = listOpenAiWorkloadInventory();
  const presentations = listOpenAiWorkloadPresentations();
  const [configurationRead, catalogRead] = await Promise.all([
    readConfigurationsSafely(),
    readCatalogSafely(),
  ]);
  const managedWorkloads = inventory.filter(
    (workload) => workload.configurationKind === "effective",
  );
  const supabaseInspect = inventory.find((workload) => workload.id === "supabase_inspect");
  const catalogModels = catalogRead.ok ? catalogRead.value : null;
  const configurationOptions = catalogModels
    ? projectOpenAiWorkloadConfigurationOptions(catalogModels, presentations)
    : [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Governança OpenAI"
        title="Workloads OpenAI"
        description="Gerencie o catálogo global de novas escolhas e, separadamente, o lifecycle ativo de cada workload em Preview e Production. Nenhuma candidata altera o runtime antes da ativação humana."
        meta={`${managedWorkloads.length} workloads técnicos`}
      />

      <OpenAiModelCatalogManager
        models={catalogModels}
        readErrorCode={catalogRead.ok ? null : catalogRead.error.code}
      />

      {configurationRead.ok ? (
        <OpenAiConfigurationManager
          units={configurationRead.value}
          presentations={presentations}
          configurationOptions={configurationOptions}
          catalogAvailable={catalogModels !== null}
        />
      ) : (
        <section
          className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900 shadow-card sm:p-6"
          role="alert"
          aria-labelledby="openai-read-failure-title"
        >
          <h2 id="openai-read-failure-title" className="text-base font-semibold">
            Leitura administrativa indisponível
          </h2>
          <p className="mt-2 text-sm leading-6">
            Não foi possível confirmar o estado atual das configurações. Por segurança,
            nenhum controle de alteração do lifecycle está disponível. Recarregue a página
            antes de tentar novamente.
          </p>
          <p className="mt-3 font-mono text-xs text-red-800">Código: {configurationRead.error.code}</p>
        </section>
      )}

      <details className="rounded-lg border border-border bg-card shadow-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:px-5">
          <span>Referência operacional · Supabase Inspect</span>
          <AdminStatusBadge tone="neutral">Somente leitura</AdminStatusBadge>
        </summary>
        <div className="border-t border-border p-4 sm:p-5">
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Este workload pertence ao fluxo operacional externo e não participa das
            configurações mutáveis de Preview ou Production.
          </p>
          {supabaseInspect ? (
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">Modelo</dt>
                <dd className="mt-1 break-all font-mono text-xs text-foreground">{supabaseInspect.model}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">Esforço</dt>
                <dd className="mt-1 text-foreground">{effortLabels[supabaseInspect.reasoningEffort]}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">Fonte</dt>
                <dd className="mt-1 text-foreground">{sourceLabels[supabaseInspect.source]}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-muted-foreground">Revisão</dt>
                <dd className="mt-1 font-mono text-xs text-foreground">{supabaseInspect.revision}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
              A referência read-only não está presente no inventário público desta revisão.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

async function readConfigurationsSafely(): Promise<OpenAiAdministrativeConfigurationReadResult> {
  try {
    return await readOpenAiAdministrativeConfigurations();
  } catch {
    return {
      ok: false,
      error: { code: "READ_FAILED", message: "Administrative configuration read failed" },
    };
  }
}

async function readCatalogSafely(): Promise<OpenAiModelCatalogReadResult> {
  try {
    return await readOpenAiModelCatalog();
  } catch {
    return {
      ok: false,
      error: { code: "READ_FAILED", message: "Model catalog read failed" },
    };
  }
}
