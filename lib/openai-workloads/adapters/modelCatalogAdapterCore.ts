import {
  openAiImageQualities,
  openAiReasoningEfforts,
  type OpenAiImageQuality,
  type OpenAiModelCatalogModel,
  type OpenAiModelCatalogReadResult,
  type OpenAiReasoningEffort,
  type OpenAiWorkloadConfigurationOptions,
  type OpenAiWorkloadPresentation,
} from "../contracts";

export const OPEN_AI_MODEL_CATALOG_PAGE_SIZE = 500;

export type OrderedPageRead = Readonly<{
  data: unknown;
  error: unknown;
  status?: number;
}>;

export async function readCompleteOrderedPages(
  readPage: (from: number, to: number) => Promise<OrderedPageRead>,
  pageSize = OPEN_AI_MODEL_CATALOG_PAGE_SIZE,
): Promise<Readonly<{ data: readonly unknown[]; error: unknown }>> {
  const accumulated: unknown[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await readPage(from, from + pageSize - 1);
    if (page.error) {
      const code = isRecord(page.error) ? page.error.code : null;
      if (
        accumulated.length > 0 &&
        (page.status === 416 || code === "PGRST103")
      ) {
        return { data: accumulated, error: null };
      }
      return { data: accumulated, error: page.error };
    }
    if (!Array.isArray(page.data)) {
      return { data: accumulated, error: new Error("partial_page") };
    }
    accumulated.push(...page.data);
    if (page.data.length < pageSize) {
      return { data: accumulated, error: null };
    }
  }
}

export function translateOpenAiModelCatalogRows(
  modelRead: Readonly<{ data: unknown; error: unknown }>,
  parameterRead: Readonly<{ data: unknown; error: unknown }>,
): OpenAiModelCatalogReadResult {
  if (modelRead.error || parameterRead.error) return readFailure();
  if (!Array.isArray(modelRead.data) || !Array.isArray(parameterRead.data)) {
    return invalidCatalog();
  }

  const parametersByModel = new Map<string, OpenAiModelCatalogModel["parameters"]>();
  const parameterKeys = new Set<string>();
  for (const raw of parameterRead.data) {
    if (!isRecord(raw)) return invalidCatalog();
    const apiKind = modality(raw.modality);
    const model = technicalValue(raw.model, 128);
    const kind = raw.parameter_kind;
    const value = technicalValue(raw.parameter_value, 32);
    const version = positiveInteger(raw.catalog_version);
    const updatedByUserId = nullableUuid(raw.updated_by);
    const createdAt = timestamp(raw.created_at);
    const updatedAt = timestamp(raw.updated_at);
    const availableForSelection = boolean(raw.available_for_selection);
    const validParameter =
      apiKind === "responses_text"
        ? kind === "reasoning_effort" &&
          openAiReasoningEfforts.includes(value as OpenAiReasoningEffort)
        : apiKind === "image_generation" &&
          kind === "quality" &&
          openAiImageQualities.includes(value as OpenAiImageQuality);
    if (
      !apiKind ||
      !model ||
      !value ||
      !validParameter ||
      version === null ||
      updatedByUserId === undefined ||
      !createdAt ||
      !updatedAt ||
      availableForSelection === null
    ) {
      return invalidCatalog();
    }
    const key = `${apiKind}:${model}`;
    const parameterKey = `${key}:${kind}:${value}`;
    if (parameterKeys.has(parameterKey)) return invalidCatalog();
    parameterKeys.add(parameterKey);
    const grouped = [...(parametersByModel.get(key) ?? [])];
    grouped.push({
      kind: kind as "reasoning_effort" | "quality",
      value: value as OpenAiReasoningEffort | OpenAiImageQuality,
      availableForSelection,
      version,
      updatedByUserId,
      createdAt,
      updatedAt,
    });
    parametersByModel.set(key, grouped);
  }

  const models: OpenAiModelCatalogModel[] = [];
  const modelKeys = new Set<string>();
  for (const raw of modelRead.data) {
    if (!isRecord(raw)) return invalidCatalog();
    const apiKind = modality(raw.modality);
    const model = technicalValue(raw.model, 128);
    const version = positiveInteger(raw.catalog_version);
    const updatedByUserId = nullableUuid(raw.updated_by);
    const createdAt = timestamp(raw.created_at);
    const updatedAt = timestamp(raw.updated_at);
    const availableForSelection = boolean(raw.available_for_selection);
    if (
      !apiKind ||
      !model ||
      version === null ||
      updatedByUserId === undefined ||
      !createdAt ||
      !updatedAt ||
      availableForSelection === null
    ) {
      return invalidCatalog();
    }
    const key = `${apiKind}:${model}`;
    const parameters = parametersByModel.get(key);
    if (modelKeys.has(key) || !parameters?.length) return invalidCatalog();
    modelKeys.add(key);
    models.push({
      apiKind,
      model,
      availableForSelection,
      version,
      updatedByUserId,
      createdAt,
      updatedAt,
      parameters: [...parameters].sort((left, right) =>
        left.value.localeCompare(right.value),
      ),
    });
  }

  if (
    models.length === 0 ||
    parametersByModel.size !== modelKeys.size ||
    [...parametersByModel.keys()].some((key) => !modelKeys.has(key))
  ) {
    return invalidCatalog();
  }
  return deepFreeze({
    ok: true,
    value: models.sort((left, right) =>
      `${left.apiKind}:${left.model}`.localeCompare(`${right.apiKind}:${right.model}`),
    ),
  });
}

export function projectOpenAiWorkloadConfigurationOptions(
  catalog: readonly OpenAiModelCatalogModel[],
  presentations: readonly OpenAiWorkloadPresentation[],
): readonly OpenAiWorkloadConfigurationOptions[] {
  return deepFreeze(
    presentations.map((presentation) => {
      const apiKind = "responses_text" as const;
      const models = catalog.filter(
        (model) => model.apiKind === apiKind && model.availableForSelection,
      );
      return {
        workload: presentation.workload,
        displayName: presentation.name,
        apiKind,
        options: models.flatMap((model) =>
          model.parameters
            .filter(
              (parameter) =>
                parameter.kind === "reasoning_effort" &&
                parameter.availableForSelection,
            )
            .map((parameter) => ({
              model: model.model,
              reasoningEffort: parameter.value as OpenAiReasoningEffort,
            })),
        ),
      };
    }),
  );
}

export function isOpenAiModelCatalogConfigurationAvailable(
  catalog: readonly OpenAiModelCatalogModel[],
  input: Readonly<{
    apiKind: "responses_text" | "image_generation";
    model: string;
    reasoningEffort: OpenAiReasoningEffort | null;
    quality: OpenAiImageQuality | null;
  }>,
) {
  const model = catalog.find(
    (candidate) =>
      candidate.apiKind === input.apiKind && candidate.model === input.model,
  );
  const kind = input.apiKind === "responses_text" ? "reasoning_effort" : "quality";
  const value = input.reasoningEffort ?? input.quality;
  return Boolean(
    model?.availableForSelection &&
    value &&
    model.parameters.some(
      (parameter) =>
        parameter.kind === kind &&
        parameter.value === value &&
        parameter.availableForSelection,
    ),
  );
}

function modality(value: unknown) {
  return value === "responses_text" || value === "image_generation" ? value : null;
}

function technicalValue(value: unknown, maximum: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)
    ? normalized
    : null;
}

function positiveInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function boolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function nullableUuid(value: unknown): string | null | undefined {
  return value === null ? null : uuid(value) ?? undefined;
}

function uuid(value: unknown) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function timestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readFailure(): OpenAiModelCatalogReadResult {
  return deepFreeze({
    ok: false,
    error: { code: "READ_FAILED", message: "OpenAI model catalog read failed" },
  });
}

function invalidCatalog(): OpenAiModelCatalogReadResult {
  return deepFreeze({
    ok: false,
    error: { code: "MODEL_CATALOG_INVALID", message: "OpenAI model catalog is invalid" },
  });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
