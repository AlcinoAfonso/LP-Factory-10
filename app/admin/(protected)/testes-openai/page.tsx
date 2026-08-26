import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  listOpenAiWorkloadPresentations,
  readOpenAiAdministrativeConfigurations,
  readOpenAiModelCatalog,
  type OpenAiAdministrativeConfigurationReadResult,
  type OpenAiModelCatalogReadResult,
  type OpenAiTextWorkloadConfigurationOptions,
} from "@/openai-workloads";
import { projectOpenAiWorkloadConfigurationOptions } from "@/openai-workloads/adapters/modelCatalogAdapterCore";
import { OpenAiLandingPageTextComparison } from "./_components/OpenAiLandingPageTextComparison";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

export default async function OpenAiTestsPage() {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    if (gate.redirect === "/auth/login") {
      redirect("/auth/login?next=%2Fadmin%2Ftestes-openai");
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
  const comparisonOptions = configurationOptions.find(
    (option): option is OpenAiTextWorkloadConfigurationOptions =>
      option.workload === "landing_page_draft_generation" &&
      option.apiKind === "responses_text",
  );
  const comparisonBaselines = configurationRead.ok
    ? configurationRead.value.flatMap((unit) =>
        unit.workload === "landing_page_draft_generation" &&
        unit.activeRevision.apiKind === "responses_text"
          ? [
              {
                environment: unit.environment,
                model: unit.activeRevision.model,
                reasoningEffort: unit.activeRevision.reasoningEffort,
                source: "supabase_operational" as const,
                revision: String(unit.activeRevision.number),
              },
            ]
          : [],
      )
    : [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="E21.3 · Evidência experimental"
        title="Testes OpenAI"
        description="Compare configurações de um workload com avaliação cega e revelação posterior. Esta superfície não cria candidata, não ativa configuração e não altera Production."
        meta="Resultados transitórios"
      />

      <OpenAiLandingPageTextComparison
        baselines={comparisonBaselines}
        options={comparisonOptions?.options ?? []}
        catalogAvailable={catalogModels !== null}
      />
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
