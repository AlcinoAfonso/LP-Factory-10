import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  listOpenAiWorkloadConfigurationOptions,
  listOpenAiWorkloadInventory,
  readOpenAiAdministrativeConfigurations,
  type OpenAiAdministrativeConfigurationReadResult,
} from "@/openai-workloads";
import { OpenAiConfigurationManager } from "./_components/OpenAiConfigurationManager";

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
  const configurationOptions = listOpenAiWorkloadConfigurationOptions();
  const readResult = await readConfigurationsSafely();
  const managedWorkloads = inventory.filter(
    (workload) => workload.configurationKind === "effective",
  );
  const supabaseInspect = inventory.find(
    (workload) => workload.id === "supabase_inspect",
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Governança OpenAI"
        title="Configurações dos workloads OpenAI"
        description="Gerencie cada ambiente por um ciclo explícito: salvar uma candidata, executar a prova, ativar a revisão validada e, quando necessário, restaurar uma revisão anterior. Nenhuma candidata altera o uso atual antes da ativação humana."
        meta={`${managedWorkloads.length} workloads gerenciados`}
      />

      {readResult.ok ? (
        <OpenAiConfigurationManager
          units={readResult.value}
          configurationOptions={configurationOptions}
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
            Não foi possível confirmar o estado atual das configurações. Por
            segurança, nenhum controle de alteração está disponível. Recarregue a
            página antes de tentar novamente.
          </p>
          <p className="mt-3 font-mono text-xs text-red-800">
            Código: {readResult.error.code}
          </p>
        </section>
      )}

      <section
        className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-6"
        aria-labelledby="supabase-inspect-title"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Referência operacional separada
            </p>
            <h2 id="supabase-inspect-title" className="mt-1 text-lg font-semibold text-foreground">
              Supabase Inspect
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Este workload pertence ao fluxo operacional externo e permanece
              somente para consulta. Ele não participa das configurações de
              Production ou Preview.
            </p>
          </div>
          <AdminStatusBadge tone="neutral">Somente leitura</AdminStatusBadge>
        </div>

        {supabaseInspect ? (
          <dl className="mt-5 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Modelo</dt>
              <dd className="mt-1 break-all font-mono text-xs text-foreground">
                {supabaseInspect.model}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                Esforço de raciocínio
              </dt>
              <dd className="mt-1 text-foreground">
                {effortLabels[supabaseInspect.reasoningEffort]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Fonte</dt>
              <dd className="mt-1 text-foreground">
                {sourceLabels[supabaseInspect.source]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Revisão</dt>
              <dd className="mt-1 font-mono text-xs text-foreground">
                {supabaseInspect.revision}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            A referência read-only não está presente no inventário público desta revisão.
          </p>
        )}
      </section>
    </div>
  );
}

async function readConfigurationsSafely(): Promise<OpenAiAdministrativeConfigurationReadResult> {
  try {
    return await readOpenAiAdministrativeConfigurations();
  } catch {
    return {
      ok: false,
      error: {
        code: "READ_FAILED",
        message: "Administrative configuration read failed",
      },
    };
  }
}
