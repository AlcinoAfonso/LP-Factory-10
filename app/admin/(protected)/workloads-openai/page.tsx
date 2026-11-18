import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  listOpenAiWorkloadPresentations,
  readOpenAiAdministrativeConfigurations,
  readOpenAiModelCatalog,
  type OpenAiAdministrativeConfigurationReadResult,
  type OpenAiModelCatalogReadResult,
} from "@/openai-workloads";
import { projectOpenAiWorkloadConfigurationOptions } from "@/openai-workloads/adapters/modelCatalogAdapterCore";
import { OpenAiConfigurationManager } from "./_components/OpenAiConfigurationManager";
import { OpenAiModelCatalogManager } from "./_components/OpenAiModelCatalogManager";
import { OpenAiWorkloadsTabs } from "./_components/OpenAiWorkloadsTabs";
import { AgentBaseQaPanel } from "./_components/AgentBaseQaPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpenAiWorkloadsPage() {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    if (gate.redirect === "/auth/login") {
      redirect("/auth/login?next=%2Fadmin%2Fworkloads-openai");
    }
    redirect(gate.redirect);
  }

  const presentations = listOpenAiWorkloadPresentations();
  const [configurationRead, catalogRead] = await Promise.all([
    readConfigurationsSafely(),
    readCatalogSafely(),
  ]);
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
        meta={`${presentations.length} workloads técnicos`}
      />

      <OpenAiWorkloadsTabs
        models={
          <OpenAiModelCatalogManager
            models={catalogModels}
            readErrorCode={catalogRead.ok ? null : catalogRead.error.code}
          />
        }
        workloads={
          configurationRead.ok ? (
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
          )
        }
      />
      {process.env.VERCEL_ENV === "preview" ? <AgentBaseQaPanel /> : null}
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
