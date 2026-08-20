import {
  openAiImageQualities,
  openAiReasoningEfforts,
  type OpenAiImageQuality,
  type OpenAiOperationalConfigurationReadResult,
  type OpenAiReasoningEffort,
} from "../contracts";

export type OperationalConfigurationQueryResult = Readonly<{
  data: unknown;
  error: unknown;
}>;

export function translateOperationalConfigurationRows(
  input: Readonly<{ environment: "production" | "preview"; workload: string }>,
  unitRead: OperationalConfigurationQueryResult,
  revisionRead: OperationalConfigurationQueryResult,
): OpenAiOperationalConfigurationReadResult {
  if (unitRead.error || revisionRead.error) {
    return failure("READ_FAILED", "Operational configuration read failed");
  }

  const unit = exactlyOneRecord(unitRead.data);
  const revision = exactlyOneRecord(revisionRead.data);
  if (!unit || !revision) {
    return failure(
      "ACTIVE_CONFIGURATION_INVALID",
      "Operational configuration must have exactly one active revision",
    );
  }

  const activeRevisionId = nonEmptyString(unit.active_revision_id);
  const revisionId = nonEmptyString(revision.id);
  const model = nonEmptyString(revision.model);
  const revisionNumber = positiveInteger(revision.revision_number);
  const expectedModality =
    input.workload === "landing_page_draft_image_generation"
      ? "image_generation"
      : "responses_text";
  if (
    unit.environment !== input.environment ||
    unit.workload !== input.workload ||
    revision.environment !== input.environment ||
    revision.workload !== input.workload ||
    unit.modality !== expectedModality ||
    revision.modality !== expectedModality ||
    !activeRevisionId ||
    revisionId !== activeRevisionId ||
    !model ||
    revisionNumber === null
  ) {
    return failure(
      "ACTIVE_CONFIGURATION_INVALID",
      "Active operational configuration does not match its unit",
    );
  }

  if (input.workload === "landing_page_draft_image_generation") {
    const quality = imageQuality(revision.quality);
    if (quality === null || revision.reasoning_effort !== null) {
      return failure(
        "ACTIVE_CONFIGURATION_INVALID",
        "Active image configuration has an invalid shape",
      );
    }
    return success({
      environment: input.environment,
      workload: input.workload,
      apiKind: "image_generation",
      model,
      quality,
      revision: String(revisionNumber),
    });
  }

  if (!isTextWorkload(input.workload)) {
    return failure(
      "ACTIVE_CONFIGURATION_INVALID",
      "Operational configuration workload is not supported",
    );
  }

  const reasoningEffort = reasoningEffortValue(revision.reasoning_effort);
  if (reasoningEffort === null || revision.quality !== null) {
    return failure(
      "ACTIVE_CONFIGURATION_INVALID",
      "Active text configuration has an invalid shape",
    );
  }
  return success({
    environment: input.environment,
    workload: input.workload,
    apiKind: "responses_text",
    model,
    reasoningEffort,
    revision: String(revisionNumber),
  });
}

function exactlyOneRecord(value: unknown): Record<string, unknown> | null {
  return Array.isArray(value) && value.length === 1 && isRecord(value[0])
    ? value[0]
    : null;
}

function isTextWorkload(
  value: string,
): value is
  | "niche_resolution"
  | "commercial_activation_draft_generation"
  | "landing_page_draft_generation" {
  return (
    value === "niche_resolution" ||
    value === "commercial_activation_draft_generation" ||
    value === "landing_page_draft_generation"
  );
}

function reasoningEffortValue(value: unknown): OpenAiReasoningEffort | null {
  return openAiReasoningEfforts.includes(value as OpenAiReasoningEffort)
    ? (value as OpenAiReasoningEffort)
    : null;
}

function imageQuality(value: unknown): OpenAiImageQuality | null {
  return openAiImageQualities.includes(value as OpenAiImageQuality)
    ? (value as OpenAiImageQuality)
    : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function success(
  value: Extract<OpenAiOperationalConfigurationReadResult, { ok: true }>["value"],
): OpenAiOperationalConfigurationReadResult {
  return deepFreeze({ ok: true, value });
}

function failure(
  code: "READ_FAILED" | "ACTIVE_CONFIGURATION_INVALID",
  message: string,
): OpenAiOperationalConfigurationReadResult {
  return deepFreeze({ ok: false, error: { code, message } });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
