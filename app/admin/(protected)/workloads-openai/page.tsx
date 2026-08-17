import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  listOpenAiWorkloadInventory,
  resolveOpenAiWorkloadEnvironment,
} from "@/openai-workloads";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const classificationLabels = {
  product_runtime: "Produto / runtime",
  operational: "Operacional externo",
} as const;

const sourceLabels = {
  repo_catalog: "Catálogo do repositório",
  github_actions_default_reference: "Referência padrão do GitHub Actions",
} as const;

const effortLabels = {
  none: "Nenhum",
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  xhigh: "Extra-alto",
  max: "Máximo",
  not_applicable: "Não aplicável",
} as const;

const environmentLabels = {
  production: "Produção",
  preview: "Preview",
  development: "Desenvolvimento",
  unknown: "Não identificado",
} as const;

export default function OpenAiWorkloadsPage() {
  const workloads = listOpenAiWorkloadInventory();
  const environment = resolveOpenAiWorkloadEnvironment();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Governança OpenAI"
        title="Workloads OpenAI"
        description="Inventário read-only das configurações conhecidas pelo repositório. Esta página não consulta a OpenAI nem altera configurações."
        meta={`${workloads.length} workload${workloads.length === 1 ? "" : "s"}`}
      />

      {workloads.length === 0 ? (
        <section className="rounded-lg border border-border bg-card p-6 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">
            Nenhum workload inventariado
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            O catálogo do repositório não possui workloads OpenAI nesta revisão.
          </p>
        </section>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2" aria-label="Workloads OpenAI inventariados">
          {workloads.map((workload) => {
            const isEffective = workload.effectiveConfigurationVerified;

            return (
              <li
                key={workload.id}
                className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-card sm:p-5"
              >
                <article className="space-y-5">
                  <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-foreground">
                        {workload.displayName}
                      </h2>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {workload.id}
                      </p>
                    </div>
                    <AdminStatusBadge tone={isEffective ? "success" : "warning"}>
                      {isEffective ? "Efetiva verificada" : "Referência operacional"}
                    </AdminStatusBadge>
                  </header>

                  <dl className="grid gap-x-4 gap-y-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Classificação
                      </dt>
                      <dd className="mt-1 text-foreground">
                        {classificationLabels[workload.classification]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        {isEffective ? "Ambiente observado" : "Ambiente da execução"}
                      </dt>
                      <dd className="mt-1 text-foreground">
                        {isEffective
                          ? environmentLabels[environment]
                          : "Não verificado nesta página"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Modelo
                      </dt>
                      <dd className="mt-1 break-all font-mono text-xs text-foreground">
                        {workload.model}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Esforço de raciocínio
                      </dt>
                      <dd className="mt-1 text-foreground">
                        {effortLabels[workload.reasoningEffort]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Fonte
                      </dt>
                      <dd className="mt-1 text-foreground">
                        {sourceLabels[workload.source]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-muted-foreground">
                        Revisão
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-foreground">
                        {workload.revision}
                      </dd>
                    </div>
                  </dl>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Consumidor
                    </p>
                    <p className="mt-1 text-sm leading-6 text-foreground">
                      {workload.consumer}
                    </p>
                    {!isEffective ? (
                      <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                        A configuração efetiva de cada execução não é verificada por esta página.
                      </p>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
