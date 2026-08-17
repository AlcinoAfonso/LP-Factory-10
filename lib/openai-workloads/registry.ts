import type {
  OpenAiWorkloadDefinition,
  OpenAiWorkloadId,
} from "./contracts";

const revision = "v2";

export const openAiWorkloadRegistry = deepFreeze([
  {
    id: "niche_resolution",
    displayName: "Resolução de nicho",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "Resolvedor IA opcional do onboarding",
    fallback: "Continuar o onboarding sem bloquear o fluxo",
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.4-mini",
      reasoningEffort: "none",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "landing_page_generation_profile_proposal",
    displayName: "Proposta de perfil de geração",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "Proposta administrativa opcional do perfil de orientação",
    fallback: "Manter a edição manual funcional",
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.4-mini",
      reasoningEffort: "none",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "commercial_activation_draft_generation",
    displayName: "Geração de draft de ativação comercial",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "Geração administrativa de draft comercial",
    fallback: "Não publicar nem substituir o conteúdo vigente",
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.4-mini",
      reasoningEffort: "none",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "landing_page_draft_generation",
    displayName: "Geração textual de landing page em draft",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "E19.4 — candidata estruturada da landing page",
    fallback: "Falhar a tentativa sem criar revisão",
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.6-luna",
      reasoningEffort: "max",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "landing_page_draft_image_generation",
    displayName: "Geração da imagem principal da landing page em draft",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "E19.4 — mídia principal da candidata validada",
    fallback: "Falhar a tentativa sem criar revisão",
    configuration: {
      apiKind: "image_generation",
      model: "gpt-image-2",
      size: "1536x1024",
      quality: "medium",
      format: "webp",
      compression: 80,
      moderation: "auto",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "supabase_inspect",
    displayName: "Supabase Inspect",
    classification: "operational",
    configurationKind: "inventory_reference",
    consumer: "Workflow operacional separado do Core",
    fallback: "Restringir a falha à execução do workflow",
    configuration: {
      model: "gpt-4.1-mini",
      reasoningEffort: "not_applicable",
      source: "github_actions_default_reference",
      revision,
    },
  },
] satisfies readonly OpenAiWorkloadDefinition[]);

assertValidRegistry(openAiWorkloadRegistry);

function assertValidRegistry(registry: readonly OpenAiWorkloadDefinition[]) {
  const ids = new Set<OpenAiWorkloadId>();

  for (const workload of registry) {
    const workloadId: OpenAiWorkloadId = workload.id;

    if (ids.has(workloadId)) {
      throw new Error(`Duplicate OpenAI workload identifier: ${workloadId}`);
    }
    ids.add(workloadId);

    if (
      workload.classification === "product_runtime" &&
      workload.configurationKind !== "effective"
    ) {
      throw new Error(`Invalid effective configuration: ${workloadId}`);
    }

    if (
      workload.classification === "product_runtime" &&
      !("apiKind" in workload.configuration)
    ) {
      throw new Error(`Missing API kind: ${workloadId}`);
    }

    if (
      workload.classification === "operational" &&
      workload.configurationKind !== "inventory_reference"
    ) {
      throw new Error(`Invalid inventory reference: ${workloadId}`);
    }
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
