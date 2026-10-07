import {
  openAiReasoningEfforts,
  openAiWebSearchContextSizes,
  type OpenAiProductWorkloadDefinition,
  type OpenAiWorkloadDefinition,
  type OpenAiWorkloadId,
  type OpenAiWorkloadPresentation,
  type ResolvedOpenAiProductWorkload,
} from "./contracts";

const revision = "v2";

export const openAiWorkloadRegistry = deepFreeze([
  {
    id: "pending_setup_conversation",
    displayName: "Atendimento inicial por IA",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "Conversa inicial e classificação sob demanda do Pending Setup",
    fallback: "Preservar contexto e deixar classificação pendente sem sucesso falso",
    webSearch: {
      externalWebAccess: true,
      searchContextSize: "medium",
      maxToolCalls: 2,
      contextWindowTokenBudget: 128000,
    },
    configuration: {
      apiKind: "responses_text",
      model: "gpt-6-luna",
      reasoningEffort: "xhigh",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "niche_resolution",
    displayName: "Resolução de nicho",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "Resolvedor IA opcional do onboarding",
    fallback: "Continuar o onboarding sem bloquear o fluxo",
    webSearch: null,
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
    webSearch: null,
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.4-mini",
      reasoningEffort: "none",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "communication_base_stage1_assistance",
    displayName: "Assistência da Etapa 1 da Base de Comunicação",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "Assistência opcional explícita sobre conteúdo fornecido na Base",
    fallback: "Preservar preenchimento e edição manuais",
    webSearch: null,
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.4-mini",
      reasoningEffort: "none",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "communication_base_stage2_intelligence",
    displayName: "Inteligência da Etapa 2 da Base de Comunicação",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "Elaboração editável de inteligência e conteúdo comunicacional",
    fallback: "Falhar fechado sem gravar conteúdo parcial",
    webSearch: {
      externalWebAccess: true,
      searchContextSize: "medium",
      maxToolCalls: 2,
      contextWindowTokenBudget: 128000,
    },
    configuration: {
      apiKind: "responses_text",
      model: "gpt-6-luna",
      reasoningEffort: "max",
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

const workloadPresentations = deepFreeze([
  {
    workload: "pending_setup_conversation",
    name: "Atendimento inicial por IA",
    roadmapReference: "E10.12.4",
    visualGroup: null,
  },
  {
    workload: "niche_resolution",
    name: "Resolução de nicho",
    roadmapReference: "E10.5.6.5",
    visualGroup: null,
  },
  {
    workload: "commercial_activation_draft_generation",
    name: "Geração de draft de ativação comercial",
    roadmapReference: "E10.7.3",
    visualGroup: null,
  },
  {
    workload: "communication_base_stage1_assistance",
    name: "Assistência da Etapa 1 da Base de Comunicação",
    roadmapReference: "E25.1.4",
    visualGroup: null,
  },
  {
    workload: "communication_base_stage2_intelligence",
    name: "Inteligência da Etapa 2 da Base de Comunicação",
    roadmapReference: "E25.1.5",
    visualGroup: null,
  },
] satisfies readonly OpenAiWorkloadPresentation[]);

export function listOpenAiWorkloadPresentations(): readonly OpenAiWorkloadPresentation[] {
  return workloadPresentations;
}

export function isValidResolvedOpenAiProductWorkload(
  actual: ResolvedOpenAiProductWorkload,
) {
  const workload = (
    openAiWorkloadRegistry as readonly OpenAiWorkloadDefinition[]
  ).find(
    (candidate) => candidate.id === actual.id,
  );

  if (!workload || !isTextDefinition(workload)) return false;

  const validOrigin =
    (actual.source === "repo_catalog" &&
      actual.revision === workload.configuration.revision) ||
    (actual.source === "supabase_operational" &&
      /^[1-9]\d*$/.test(actual.revision));

  return (
    actual.displayName === workload.displayName &&
    actual.classification === workload.classification &&
    actual.configurationKind === workload.configurationKind &&
    actual.apiKind === workload.configuration.apiKind &&
    actual.consumer === workload.consumer &&
    actual.fallback === workload.fallback &&
    sameWebSearchPolicy(actual.webSearch, workload.webSearch) &&
    actual.effectiveConfigurationVerified === true &&
    validOrigin &&
    isTechnicalModel(actual.model) &&
    openAiReasoningEfforts.includes(actual.reasoningEffort)
  );
}

function sameWebSearchPolicy(
  actual: ResolvedOpenAiProductWorkload["webSearch"],
  expected: OpenAiProductWorkloadDefinition["webSearch"],
) {
  if (actual == null || expected == null) return actual == null && expected == null;
  return (
    actual.externalWebAccess === true &&
    expected.externalWebAccess === true &&
    actual.maxToolCalls === expected.maxToolCalls &&
    actual.contextWindowTokenBudget === expected.contextWindowTokenBudget &&
    openAiWebSearchContextSizes.includes(actual.searchContextSize) &&
    actual.searchContextSize === expected.searchContextSize
  );
}

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

    if (!isTechnicalModel(workload.configuration.model)) {
      throw new Error(`Invalid baseline model: ${workloadId}`);
    }

    if (
      workload.classification === "operational" &&
      workload.configurationKind !== "inventory_reference"
    ) {
      throw new Error(`Invalid inventory reference: ${workloadId}`);
    }
  }
}

function isTextDefinition(
  workload: OpenAiWorkloadDefinition,
): workload is OpenAiProductWorkloadDefinition {
  return (
    workload.configurationKind === "effective" &&
    workload.configuration.apiKind === "responses_text"
  );
}

function isTechnicalModel(value: string) {
  return value.length <= 128 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
