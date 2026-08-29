import {
  openAiImageQualities,
  openAiReasoningEfforts,
  openAiWebSearchContextSizes,
  type OpenAiImageWorkloadDefinition,
  type OpenAiProductWorkloadDefinition,
  type OpenAiWorkloadDefinition,
  type OpenAiWorkloadId,
  type OpenAiWorkloadPresentation,
  type ResolvedOpenAiImageWorkload,
  type ResolvedOpenAiProductWorkload,
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
    id: "landing_page_draft_generation",
    displayName: "Geração textual de landing page em draft",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "E19.4 — candidata estruturada da landing page",
    fallback: "Falhar a tentativa sem criar revisão",
    webSearch: null,
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.6-luna",
      reasoningEffort: "max",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "taxon_input_catalog_sufficiency_evaluation",
    displayName: "Avaliação de suficiência factual do catálogo por taxon",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "E20.6.5 — avaliação administrativa da suficiência factual E20.2",
    fallback: "Falhar fechado sem registrar suficiência",
    webSearch: null,
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.6-terra",
      reasoningEffort: "low",
      source: "repo_catalog",
      revision,
    },
  },
  {
    id: "landing_page_dynamic_market_research",
    displayName: "Pesquisa dinâmica de mercado para landing page",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "E20.7.4 — complemento consultivo de conhecimento de mercado",
    fallback: "Falhar a resolução técnica sem invalidar a oferta",
    webSearch: {
      externalWebAccess: true,
      searchContextSize: "medium",
      maxToolCalls: 2,
      contextWindowTokenBudget: 128000,
    },
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.6-luna",
      reasoningEffort: "low",
      source: "repo_catalog",
      revision: "v1",
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

const workloadPresentations = deepFreeze([
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
    workload: "landing_page_draft_generation",
    name: "Geração da Landing Page",
    roadmapReference: "E19.4",
    visualGroup: "landing_page",
  },
  {
    workload: "landing_page_draft_image_generation",
    name: "Geração da Landing Page",
    roadmapReference: "E19.4",
    visualGroup: "landing_page",
  },
  {
    workload: "taxon_input_catalog_sufficiency_evaluation",
    name: "Avaliação de suficiência factual do catálogo por taxon",
    roadmapReference: "E20.6.5",
    visualGroup: null,
  },
  {
    workload: "landing_page_dynamic_market_research",
    name: "Pesquisa dinâmica de mercado para landing page",
    roadmapReference: "E20.7.4",
    visualGroup: "landing_page",
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

export function isValidResolvedOpenAiImageWorkload(
  actual: ResolvedOpenAiImageWorkload,
) {
  const workload = (
    openAiWorkloadRegistry as readonly OpenAiWorkloadDefinition[]
  ).find((candidate) => candidate.id === actual.id);

  if (!workload || !isImageDefinition(workload)) return false;

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
    actual.size === workload.configuration.size &&
    actual.format === workload.configuration.format &&
    actual.compression === workload.configuration.compression &&
    actual.moderation === workload.configuration.moderation &&
    actual.reasoningEffort === "not_applicable" &&
    actual.effectiveConfigurationVerified === true &&
    validOrigin &&
    isTechnicalModel(actual.model) &&
    openAiImageQualities.includes(actual.quality)
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

function isImageDefinition(
  workload: OpenAiWorkloadDefinition,
): workload is OpenAiImageWorkloadDefinition {
  return (
    workload.configurationKind === "effective" &&
    workload.configuration.apiKind === "image_generation"
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
