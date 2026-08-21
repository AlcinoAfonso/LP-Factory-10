import type {
  OpenAiImageQuality,
  OpenAiImageWorkloadDefinition,
  OpenAiProductWorkloadDefinition,
  OpenAiReasoningEffort,
  OpenAiWorkloadDefinition,
  OpenAiWorkloadConfigurationOptions,
  OpenAiWorkloadId,
  ResolvedOpenAiImageWorkload,
  ResolvedOpenAiProductWorkload,
} from "./contracts";

const revision = "v2";

const nicheResolutionAllowlist = textAllowlist();
const commercialActivationDraftGenerationAllowlist = textAllowlist();
const landingPageDraftGenerationAllowlist = textAllowlist();
const taxonInputCatalogSufficiencyEvaluationAllowlist = [
  { model: "gpt-5.6-terra", reasoningEffort: "low" },
] as const;
const landingPageDraftImageGenerationAllowlist = [
  { model: "gpt-image-2", quality: "low" },
  { model: "gpt-image-2", quality: "medium" },
  { model: "gpt-image-2", quality: "high" },
] as const;

export const openAiWorkloadRegistry = deepFreeze([
  {
    id: "niche_resolution",
    displayName: "Resolução de nicho",
    classification: "product_runtime",
    configurationKind: "effective",
    consumer: "Resolvedor IA opcional do onboarding",
    fallback: "Continuar o onboarding sem bloquear o fluxo",
    allowedConfigurations: nicheResolutionAllowlist,
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
    allowedConfigurations: commercialActivationDraftGenerationAllowlist,
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
    allowedConfigurations: landingPageDraftGenerationAllowlist,
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
    allowedConfigurations: taxonInputCatalogSufficiencyEvaluationAllowlist,
    configuration: {
      apiKind: "responses_text",
      model: "gpt-5.6-terra",
      reasoningEffort: "low",
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
    allowedConfigurations: landingPageDraftImageGenerationAllowlist,
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

const openAiWorkloadConfigurationOptions = deepFreeze(
  openAiWorkloadRegistry.reduce<OpenAiWorkloadConfigurationOptions[]>((options, workload) => {
    if (isTextDefinition(workload)) {
      options.push({
        workload: workload.id,
        displayName: workload.displayName,
        apiKind: "responses_text",
        options: workload.allowedConfigurations.map((option) => ({ ...option })),
      });
    }
    if (isImageDefinition(workload)) {
      options.push({
        workload: workload.id,
        displayName: workload.displayName,
        apiKind: "image_generation",
        options: workload.allowedConfigurations.map((option) => ({ ...option })),
      });
    }
    return options;
  }, []),
);

export function listOpenAiWorkloadConfigurationOptions(): readonly OpenAiWorkloadConfigurationOptions[] {
  return openAiWorkloadConfigurationOptions;
}

export function isAllowedOpenAiTextConfiguration(
  workload: OpenAiProductWorkloadDefinition,
  configuration: Readonly<{
    model: string;
    reasoningEffort: OpenAiReasoningEffort;
  }>,
) {
  return workload.allowedConfigurations.some(
    (allowed) =>
      allowed.model === configuration.model &&
      allowed.reasoningEffort === configuration.reasoningEffort,
  );
}

export function isAllowedOpenAiImageConfiguration(
  workload: OpenAiImageWorkloadDefinition,
  configuration: Readonly<{ model: string; quality: OpenAiImageQuality }>,
) {
  return workload.allowedConfigurations.some(
    (allowed) =>
      allowed.model === configuration.model &&
      allowed.quality === configuration.quality,
  );
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
    actual.effectiveConfigurationVerified === true &&
    validOrigin &&
    isAllowedOpenAiTextConfiguration(workload, actual)
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
    isAllowedOpenAiImageConfiguration(workload, actual)
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

    if (
      isTextDefinition(workload) &&
      !isAllowedOpenAiTextConfiguration(workload, workload.configuration)
    ) {
      throw new Error(`Baseline is outside the text allowlist: ${workloadId}`);
    }

    if (
      isImageDefinition(workload) &&
      !isAllowedOpenAiImageConfiguration(workload, workload.configuration)
    ) {
      throw new Error(`Baseline is outside the image allowlist: ${workloadId}`);
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

function textAllowlist() {
  return [
    { model: "gpt-5.4-mini", reasoningEffort: "none" },
    { model: "gpt-5.4-mini", reasoningEffort: "low" },
    { model: "gpt-5.4-mini", reasoningEffort: "medium" },
    { model: "gpt-5.4-mini", reasoningEffort: "high" },
    { model: "gpt-5.4-mini", reasoningEffort: "xhigh" },
    { model: "gpt-5.6-luna", reasoningEffort: "none" },
    { model: "gpt-5.6-luna", reasoningEffort: "low" },
    { model: "gpt-5.6-luna", reasoningEffort: "medium" },
    { model: "gpt-5.6-luna", reasoningEffort: "high" },
    { model: "gpt-5.6-luna", reasoningEffort: "xhigh" },
    { model: "gpt-5.6-luna", reasoningEffort: "max" },
  ] as const;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
