import {
  openAiImageQualities,
  openAiReasoningEfforts,
  type OpenAiAdministrativeActivation,
  type OpenAiAdministrativeCandidate,
  type OpenAiAdministrativeConfigurationReadResult,
  type OpenAiAdministrativeConfigurationUnit,
  type OpenAiAdministrativeConfigurationValue,
  type OpenAiAdministrativeRevision,
  type OpenAiImageQuality,
  type OpenAiImageWorkloadId,
  type OpenAiManagedWorkloadEnvironment,
  type OpenAiOperationalConfigurationReadResult,
  type OpenAiProductWorkloadId,
  type OpenAiReasoningEffort,
  type OpenAiWorkloadConfigurationOptions,
} from "../contracts";
import { listOpenAiWorkloadConfigurationOptions } from "../registry";

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
): value is OpenAiProductWorkloadId {
  return (
    value === "niche_resolution" ||
    value === "commercial_activation_draft_generation" ||
    value === "landing_page_draft_generation" ||
    value === "taxon_input_catalog_sufficiency_evaluation"
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

const managedEnvironments = ["production", "preview"] as const;
const preTaxonEvaluationManagedWorkloads = [
  "niche_resolution",
  "commercial_activation_draft_generation",
  "landing_page_draft_generation",
  "landing_page_draft_image_generation",
] as const;
const managedWorkloads = [
  "niche_resolution",
  "commercial_activation_draft_generation",
  "landing_page_draft_generation",
  "taxon_input_catalog_sufficiency_evaluation",
  "landing_page_draft_image_generation",
] as const;

const unitRowKeys = [
  "environment",
  "workload",
  "modality",
  "active_revision_id",
  "pending_revision_id",
  "candidate_model",
  "candidate_reasoning_effort",
  "candidate_quality",
  "candidate_saved_by",
  "candidate_saved_at",
  "configuration_version",
] as const;

const revisionRowKeys = [
  "id",
  "environment",
  "workload",
  "modality",
  "revision_number",
  "model",
  "reasoning_effort",
  "quality",
  "validated_by",
  "validated_at",
] as const;

const activationRowKeys = [
  "id",
  "environment",
  "workload",
  "modality",
  "activation_number",
  "event_type",
  "previous_revision_id",
  "target_revision_id",
  "actor_user_id",
  "created_at",
] as const;

type ManagedWorkload = OpenAiProductWorkloadId | OpenAiImageWorkloadId;

type ParsedRevision = OpenAiAdministrativeRevision &
  Readonly<{
    environment: OpenAiManagedWorkloadEnvironment;
    workload: ManagedWorkload;
    modality: "responses_text" | "image_generation";
  }>;

type ParsedActivation = OpenAiAdministrativeActivation &
  Readonly<{
    environment: OpenAiManagedWorkloadEnvironment;
    workload: ManagedWorkload;
    modality: "responses_text" | "image_generation";
  }>;

export function translateOpenAiAdministrativeConfigurationRows(
  unitRead: OperationalConfigurationQueryResult,
  revisionRead: OperationalConfigurationQueryResult,
  activationRead: OperationalConfigurationQueryResult,
): OpenAiAdministrativeConfigurationReadResult {
  if (unitRead.error || revisionRead.error || activationRead.error) {
    return administrativeFailure("READ_FAILED", "Administrative configuration read failed");
  }

  const units = exactRecords(unitRead.data, unitRowKeys);
  const revisions = exactRecords(revisionRead.data, revisionRowKeys);
  const activations = exactRecords(activationRead.data, activationRowKeys);
  const workloads = units?.length === 8
    ? preTaxonEvaluationManagedWorkloads
    : units?.length === 10
      ? managedWorkloads
      : null;
  if (!units || !revisions || !activations || !workloads) {
    return invalidAdministrativeConfiguration();
  }

  const projections = listOpenAiWorkloadConfigurationOptions();
  const unitsByKey = new Map<string, Record<string, unknown>>();
  for (const unit of units) {
    const environment = managedEnvironment(unit.environment);
    const workload = managedWorkload(unit.workload);
    const projection = workload ? projectionFor(projections, workload) : null;
    const modality = projection?.apiKind ?? null;
    const version = positiveInteger(unit.configuration_version);
    if (
      !environment ||
      !workload ||
      !projection ||
      unit.modality !== modality ||
      version === null
    ) {
      return invalidAdministrativeConfiguration();
    }
    const key = unitKey(environment, workload);
    if (unitsByKey.has(key)) return invalidAdministrativeConfiguration();
    unitsByKey.set(key, unit);
  }

  const revisionsById = new Map<string, ParsedRevision>();
  const revisionsByUnit = new Map<string, ParsedRevision[]>();
  const revisionNumbers = new Set<string>();
  for (const row of revisions) {
    const parsed = parseRevision(row, projections);
    if (!parsed || revisionsById.has(parsed.id)) {
      return invalidAdministrativeConfiguration();
    }
    const key = unitKey(parsed.environment, parsed.workload);
    const numberKey = `${key}:${parsed.number}`;
    if (!unitsByKey.has(key) || revisionNumbers.has(numberKey)) {
      return invalidAdministrativeConfiguration();
    }
    revisionsById.set(parsed.id, parsed);
    revisionNumbers.add(numberKey);
    const grouped = revisionsByUnit.get(key) ?? [];
    grouped.push(parsed);
    revisionsByUnit.set(key, grouped);
  }

  const activationIds = new Set<string>();
  const activationNumbers = new Set<string>();
  const activationsByUnit = new Map<string, ParsedActivation[]>();
  for (const row of activations) {
    const parsed = parseActivation(row, projections, revisionsById);
    if (!parsed || activationIds.has(parsed.id)) {
      return invalidAdministrativeConfiguration();
    }
    const key = unitKey(parsed.environment, parsed.workload);
    const numberKey = `${key}:${parsed.number}`;
    if (!unitsByKey.has(key) || activationNumbers.has(numberKey)) {
      return invalidAdministrativeConfiguration();
    }
    activationIds.add(parsed.id);
    activationNumbers.add(numberKey);
    const grouped = activationsByUnit.get(key) ?? [];
    grouped.push(parsed);
    activationsByUnit.set(key, grouped);
  }

  const result: OpenAiAdministrativeConfigurationUnit[] = [];
  for (const environment of managedEnvironments) {
    for (const workload of workloads) {
      const key = unitKey(environment, workload);
      const unit = unitsByKey.get(key);
      const projection = projectionFor(projections, workload);
      const unitRevisions = revisionsByUnit.get(key)?.sort((left, right) => left.number - right.number);
      const unitActivations = activationsByUnit.get(key)?.sort((left, right) => left.number - right.number);
      if (
        !unit ||
        !projection ||
        !unitRevisions?.length ||
        unitRevisions.some((revision, index) => revision.number !== index + 1) ||
        !unitActivations?.length
      ) {
        return invalidAdministrativeConfiguration();
      }

      const activeRevisionId = uuid(unit.active_revision_id);
      const pendingRevisionId = nullableUuid(unit.pending_revision_id);
      const activeRevision = activeRevisionId ? revisionsById.get(activeRevisionId) : null;
      const pendingRevision = pendingRevisionId ? revisionsById.get(pendingRevisionId) : null;
      const candidate = parseCandidate(unit, projection);
      if (
        !activeRevisionId ||
        !activeRevision ||
        !sameUnit(activeRevision, environment, workload) ||
        pendingRevisionId === undefined ||
        (pendingRevisionId !== null &&
          (!pendingRevision ||
            !sameUnit(pendingRevision, environment, workload) ||
            pendingRevisionId === activeRevisionId)) ||
        candidate === undefined ||
        (candidate !== null && pendingRevisionId !== null)
      ) {
        return invalidAdministrativeConfiguration();
      }

      if (!validActivationSequence(unitActivations, activeRevisionId, pendingRevisionId)) {
        return invalidAdministrativeConfiguration();
      }

      const activatedRevisionIds = new Set(unitActivations.map((activation) => activation.targetRevisionId));
      if (
        unitRevisions.some((revision) =>
          revision.id === pendingRevisionId
            ? activatedRevisionIds.has(revision.id)
            : !activatedRevisionIds.has(revision.id),
        )
      ) {
        return invalidAdministrativeConfiguration();
      }

      result.push({
        environment,
        workload,
        displayName: projection.displayName,
        apiKind: projection.apiKind,
        configurationVersion: positiveInteger(unit.configuration_version) as number,
        activeRevision: publicRevision(activeRevision),
        candidate,
        pendingRevision: pendingRevision ? publicRevision(pendingRevision) : null,
        historicalRevisions: unitRevisions
          .filter((revision) =>
            revision.id !== activeRevisionId && revision.id !== pendingRevisionId)
          .sort((left, right) => right.number - left.number)
          .map(publicRevision),
        activations: [...unitActivations]
          .sort((left, right) => right.number - left.number)
          .map(publicActivation),
      });
    }
  }

  return deepFreeze({ ok: true, value: result });
}

function parseRevision(
  row: Record<string, unknown>,
  projections: readonly OpenAiWorkloadConfigurationOptions[],
): ParsedRevision | null {
  const id = uuid(row.id);
  const environment = managedEnvironment(row.environment);
  const workload = managedWorkload(row.workload);
  const projection = workload ? projectionFor(projections, workload) : null;
  const number = positiveInteger(row.revision_number);
  const validatedByUserId = nullableUuid(row.validated_by);
  const validatedAt = timestamp(row.validated_at);
  if (
    !id ||
    !environment ||
    !workload ||
    !projection ||
    row.modality !== projection.apiKind ||
    number === null ||
    validatedByUserId === undefined ||
    (number === 1 ? validatedByUserId !== null : validatedByUserId === null) ||
    !validatedAt
  ) {
    return null;
  }
  const configuration = configurationValue(
    projection,
    row.model,
    row.reasoning_effort,
    row.quality,
  );
  return configuration
    ? {
        ...configuration,
        id,
        number,
        validatedByUserId,
        validatedAt,
        environment,
        workload,
        modality: projection.apiKind,
      }
    : null;
}

function parseActivation(
  row: Record<string, unknown>,
  projections: readonly OpenAiWorkloadConfigurationOptions[],
  revisionsById: ReadonlyMap<string, ParsedRevision>,
): ParsedActivation | null {
  const id = uuid(row.id);
  const environment = managedEnvironment(row.environment);
  const workload = managedWorkload(row.workload);
  const projection = workload ? projectionFor(projections, workload) : null;
  const number = positiveInteger(row.activation_number);
  const previousRevisionId = nullableUuid(row.previous_revision_id);
  const targetRevisionId = uuid(row.target_revision_id);
  const actorUserId = nullableUuid(row.actor_user_id);
  const createdAt = timestamp(row.created_at);
  const eventType = activationEventType(row.event_type);
  const previousRevision = previousRevisionId
    ? revisionsById.get(previousRevisionId)
    : null;
  const targetRevision = targetRevisionId
    ? revisionsById.get(targetRevisionId)
    : null;
  if (
    !id ||
    !environment ||
    !workload ||
    !projection ||
    row.modality !== projection.apiKind ||
    number === null ||
    previousRevisionId === undefined ||
    !targetRevisionId ||
    actorUserId === undefined ||
    !createdAt ||
    !eventType ||
    !targetRevision ||
    !sameUnit(targetRevision, environment, workload) ||
    (previousRevisionId !== null &&
      (!previousRevision || !sameUnit(previousRevision, environment, workload))) ||
    (eventType === "bootstrap"
      ? number !== 1 || previousRevisionId !== null || actorUserId !== null
      : number <= 1 ||
        previousRevisionId === null ||
        previousRevisionId === targetRevisionId ||
        actorUserId === null)
  ) {
    return null;
  }
  return {
    id,
    number,
    eventType,
    previousRevisionId,
    previousRevisionNumber: previousRevision?.number ?? null,
    targetRevisionId,
    targetRevisionNumber: targetRevision.number,
    actorUserId,
    createdAt,
    environment,
    workload,
    modality: projection.apiKind,
  };
}

function parseCandidate(
  row: Record<string, unknown>,
  projection: OpenAiWorkloadConfigurationOptions,
): OpenAiAdministrativeCandidate | null | undefined {
  const fields = [
    row.candidate_model,
    row.candidate_reasoning_effort,
    row.candidate_quality,
    row.candidate_saved_by,
    row.candidate_saved_at,
  ];
  if (fields.every((field) => field === null)) return null;

  const savedByUserId = uuid(row.candidate_saved_by);
  const savedAt = timestamp(row.candidate_saved_at);
  const configuration = configurationValue(
    projection,
    row.candidate_model,
    row.candidate_reasoning_effort,
    row.candidate_quality,
  );
  return savedByUserId && savedAt && configuration
    ? { ...configuration, savedByUserId, savedAt }
    : undefined;
}

function configurationValue(
  projection: OpenAiWorkloadConfigurationOptions,
  rawModel: unknown,
  rawReasoningEffort: unknown,
  rawQuality: unknown,
): OpenAiAdministrativeConfigurationValue | null {
  const model = nonEmptyString(rawModel);
  if (!model) return null;
  if (projection.apiKind === "responses_text") {
    const reasoningEffort = reasoningEffortValue(rawReasoningEffort);
    if (
      reasoningEffort === null ||
      rawQuality !== null ||
      !projection.options.some((option) =>
        option.model === model && option.reasoningEffort === reasoningEffort)
    ) {
      return null;
    }
    return { apiKind: "responses_text", model, reasoningEffort };
  }
  const quality = imageQuality(rawQuality);
  if (
    quality === null ||
    rawReasoningEffort !== null ||
    !projection.options.some((option) => option.model === model && option.quality === quality)
  ) {
    return null;
  }
  return { apiKind: "image_generation", model, quality };
}

function validActivationSequence(
  activations: readonly ParsedActivation[],
  activeRevisionId: string,
  pendingRevisionId: string | null,
): boolean {
  const priorTargets = new Set<string>();
  for (let index = 0; index < activations.length; index += 1) {
    const activation = activations[index];
    const previous = activations[index - 1];
    if (
      activation.number !== index + 1 ||
      (index === 0
        ? activation.eventType !== "bootstrap"
        : activation.eventType === "bootstrap" ||
          activation.previousRevisionId !== previous.targetRevisionId) ||
      (activation.eventType === "activate" &&
        priorTargets.has(activation.targetRevisionId)) ||
      (activation.eventType === "rollback" &&
        !priorTargets.has(activation.targetRevisionId))
    ) {
      return false;
    }
    priorTargets.add(activation.targetRevisionId);
  }
  return (
    activations[activations.length - 1]?.targetRevisionId === activeRevisionId &&
    !activations.some((activation) => activation.targetRevisionId === pendingRevisionId)
  );
}

function publicRevision(revision: ParsedRevision): OpenAiAdministrativeRevision {
  const {
    environment: _environment,
    workload: _workload,
    modality: _modality,
    ...value
  } = revision;
  return value;
}

function publicActivation(activation: ParsedActivation): OpenAiAdministrativeActivation {
  const {
    environment: _environment,
    workload: _workload,
    modality: _modality,
    ...value
  } = activation;
  return value;
}

function exactRecords(
  value: unknown,
  expectedKeys: readonly string[],
): Record<string, unknown>[] | null {
  if (!Array.isArray(value)) return null;
  const records: Record<string, unknown>[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate)) return null;
    const keys = Object.keys(candidate);
    if (
      keys.length !== expectedKeys.length ||
      !expectedKeys.every((key) => Object.hasOwn(candidate, key))
    ) {
      return null;
    }
    records.push(candidate);
  }
  return records;
}

function projectionFor(
  projections: readonly OpenAiWorkloadConfigurationOptions[],
  workload: ManagedWorkload,
): OpenAiWorkloadConfigurationOptions | null {
  return projections.find((projection) => projection.workload === workload) ?? null;
}

function managedEnvironment(value: unknown): OpenAiManagedWorkloadEnvironment | null {
  return value === "production" || value === "preview" ? value : null;
}

function managedWorkload(value: unknown): ManagedWorkload | null {
  return managedWorkloads.includes(value as ManagedWorkload)
    ? (value as ManagedWorkload)
    : null;
}

function activationEventType(
  value: unknown,
): OpenAiAdministrativeActivation["eventType"] | null {
  return value === "bootstrap" || value === "activate" || value === "rollback"
    ? value
    : null;
}

function uuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)
    ? normalized
    : null;
}

function nullableUuid(value: unknown): string | null | undefined {
  return value === null ? null : uuid(value) ?? undefined;
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function sameUnit(
  value: Readonly<{
    environment: OpenAiManagedWorkloadEnvironment;
    workload: ManagedWorkload;
  }>,
  environment: OpenAiManagedWorkloadEnvironment,
  workload: ManagedWorkload,
) {
  return value.environment === environment && value.workload === workload;
}

function unitKey(
  environment: OpenAiManagedWorkloadEnvironment,
  workload: ManagedWorkload,
) {
  return `${environment}:${workload}`;
}

function invalidAdministrativeConfiguration(): OpenAiAdministrativeConfigurationReadResult {
  return administrativeFailure(
    "ADMINISTRATIVE_CONFIGURATION_INVALID",
    "Administrative configuration is invalid",
  );
}

function administrativeFailure(
  code: "READ_FAILED" | "ADMINISTRATIVE_CONFIGURATION_INVALID",
  message: string,
): OpenAiAdministrativeConfigurationReadResult {
  return deepFreeze({ ok: false, error: { code, message } });
}
