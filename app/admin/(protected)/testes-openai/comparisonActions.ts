"use server";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  isValidResolvedOpenAiProductWorkload,
  readOpenAiAdministrativeConfigurations,
  readOpenAiModelCatalog,
  resolveOpenAiProductWorkload,
  type OpenAiManagedWorkloadEnvironment,
  type OpenAiModelCatalogModel,
  type ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";
import { runLandingPageDraftComparison } from "@/lp-builder/adapters/landingPageDraftComparisonAdapter";
import {
  LANDING_PAGE_DRAFT_COMPARISON_CASE_ID,
  LANDING_PAGE_DRAFT_COMPARISON_FIXTURE_VERSION,
  LANDING_PAGE_DRAFT_COMPARISON_MAX_CONFIGURATIONS,
  LANDING_PAGE_DRAFT_COMPARISON_MAX_FINALISTS,
  LANDING_PAGE_DRAFT_COMPARISON_MIN_CONFIGURATIONS,
  LANDING_PAGE_DRAFT_COMPARISON_WORKLOAD,
  landingPageDraftComparisonAlias,
  landingPageDraftComparisonConfigurationKey,
  modelCatalogComparisonRevision,
  normalizeLandingPageDraftComparisonSelections,
  shuffleLandingPageDraftComparisonConfigurations,
  type LandingPageDraftComparisonConfiguration,
  type LandingPageDraftComparisonResult,
  type LandingPageDraftComparisonRound,
  type LandingPageDraftComparisonSelection,
} from "@/lp-builder/landingPageDraftComparison";

const ROUND_TOKEN_DOMAIN = "lpf:e21.3.3:round:v1";
const ROUND_TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1_000;

export type LandingPageDraftComparisonActionFailure = Readonly<{
  ok: false;
  code:
    | "unauthorized"
    | "validation"
    | "read"
    | "configuration"
    | "catalog"
    | "round";
  message: string;
}>;

export type StartLandingPageDraftComparisonActionResult =
  | Readonly<{ ok: true; round: LandingPageDraftComparisonRound }>
  | LandingPageDraftComparisonActionFailure;

export type RepeatLandingPageDraftComparisonActionResult =
  | Readonly<{ ok: true; results: readonly LandingPageDraftComparisonResult[] }>
  | LandingPageDraftComparisonActionFailure;

type RoundTokenPayload = Readonly<{
  schemaVersion: 1;
  roundId: string;
  issuedAt: number;
  expiresAt: number;
  environment: OpenAiManagedWorkloadEnvironment;
  workload: typeof LANDING_PAGE_DRAFT_COMPARISON_WORKLOAD;
  fixtureId: typeof LANDING_PAGE_DRAFT_COMPARISON_CASE_ID;
  fixtureVersion: typeof LANDING_PAGE_DRAFT_COMPARISON_FIXTURE_VERSION;
  contextContractVersion: 4;
  presentationContractVersion: 1;
  configurations: readonly LandingPageDraftComparisonConfiguration[];
}>;

export async function startLandingPageDraftComparisonAction(
  input: unknown,
): Promise<StartLandingPageDraftComparisonActionResult> {
  const authorized = await authorize();
  if (!authorized.ok) return authorized;
  if (!isRecord(input)) return validationFailure("Entrada da comparação inválida.");
  const environment = parseEnvironment(input.environment);
  const selections = normalizeLandingPageDraftComparisonSelections(
    input.configurations,
  );
  if (!environment || !selections) {
    return validationFailure("Ambiente ou configurações inválidos.");
  }

  const authority = await readAuthority(environment);
  if (!authority.ok) return authority;
  const baselineKey = landingPageDraftComparisonConfigurationKey(
    authority.baseline,
  );
  if (
    selections.some(
      (selection) =>
        landingPageDraftComparisonConfigurationKey(selection) === baselineKey,
    )
  ) {
    return validationFailure("A baseline deve ser incluída uma única vez.");
  }
  const total = selections.length + 1;
  if (
    total < LANDING_PAGE_DRAFT_COMPARISON_MIN_CONFIGURATIONS ||
    total > LANDING_PAGE_DRAFT_COMPARISON_MAX_CONFIGURATIONS
  ) {
    return validationFailure("Selecione entre 2 e 6 configurações no total.");
  }

  const candidates = selections.map((selection) =>
    resolveCatalogCandidate(selection, authority.catalog, authority.baseline),
  );
  if (candidates.some((candidate) => candidate === null)) {
    return failure(
      "catalog",
      "Uma configuração selecionada não está elegível no catálogo vigente.",
    );
  }
  const configurations = [
    toBaselineConfiguration(authority.baseline),
    ...candidates.map((candidate) => candidate!.publicConfiguration),
  ];
  const resolved = [
    authority.baseline,
    ...candidates.map((candidate) => candidate!.resolvedWorkload),
  ];
  const pairs = shuffleLandingPageDraftComparisonConfigurations(
    configurations.map((configuration, index) => ({
      publicConfiguration: configuration,
      resolvedWorkload: resolved[index]!,
    })),
  );
  const roundId = randomUUID();
  const roundToken = signRoundToken({
    schemaVersion: 1,
    roundId,
    issuedAt: Date.now(),
    expiresAt: Date.now() + ROUND_TOKEN_LIFETIME_MS,
    environment,
    workload: LANDING_PAGE_DRAFT_COMPARISON_WORKLOAD,
    fixtureId: LANDING_PAGE_DRAFT_COMPARISON_CASE_ID,
    fixtureVersion: LANDING_PAGE_DRAFT_COMPARISON_FIXTURE_VERSION,
    contextContractVersion: 4,
    presentationContractVersion: 1,
    configurations: pairs.map((pair) => pair.publicConfiguration),
  });
  if (!roundToken) {
    return failure("configuration", "A credencial server-side está indisponível.");
  }

  const attempts = await runLandingPageDraftComparison({
    environment,
    configurations: pairs,
    roundId,
  });
  const results = attempts.map((attempt, index) => ({
    alias: landingPageDraftComparisonAlias(index)!,
    ...attempt,
  }));
  return {
    ok: true,
    round: {
      roundId,
      roundToken,
      environment,
      workload: LANDING_PAGE_DRAFT_COMPARISON_WORKLOAD,
      fixtureId: LANDING_PAGE_DRAFT_COMPARISON_CASE_ID,
      fixtureVersion: LANDING_PAGE_DRAFT_COMPARISON_FIXTURE_VERSION,
      contextContractVersion: 4,
      presentationContractVersion: 1,
      results,
    },
  };
}

export async function repeatLandingPageDraftComparisonAction(
  input: unknown,
): Promise<RepeatLandingPageDraftComparisonActionResult> {
  const authorized = await authorize();
  if (!authorized.ok) return authorized;
  if (!isRecord(input) || typeof input.roundToken !== "string") {
    return validationFailure("Rodada de repetição inválida.");
  }
  const payload = verifyRoundToken(input.roundToken);
  if (!payload) return failure("round", "A rodada expirou ou não é autêntica.");
  const finalistKeys = parseFinalistKeys(input.finalistKeys);
  if (!finalistKeys) {
    return validationFailure("Escolha no máximo dois finalistas da rodada inicial.");
  }

  const authority = await readAuthority(payload.environment);
  if (!authority.ok) return authority;
  const baseline = payload.configurations.find((configuration) => configuration.baseline);
  if (
    !baseline ||
    baseline.key !== landingPageDraftComparisonConfigurationKey(authority.baseline) ||
    baseline.source !== authority.baseline.source ||
    baseline.revision !== authority.baseline.revision
  ) {
    return failure(
      "round",
      "A baseline ativa mudou desde a rodada inicial; inicie uma nova comparação.",
    );
  }

  const initialFinalists = finalistKeys.map((key) =>
    payload.configurations.find(
      (configuration) => !configuration.baseline && configuration.key === key,
    ),
  );
  if (initialFinalists.some((configuration) => !configuration)) {
    return failure("round", "Um finalista não pertence à rodada inicial.");
  }
  const candidates = initialFinalists.map((configuration) =>
    resolveCatalogCandidate(configuration!, authority.catalog, authority.baseline),
  );
  if (candidates.some((candidate) => candidate === null)) {
    return failure(
      "catalog",
      "Um finalista deixou de estar elegível no catálogo; nenhuma repetição foi iniciada.",
    );
  }

  const configurations = [
    {
      publicConfiguration: toBaselineConfiguration(authority.baseline),
      resolvedWorkload: authority.baseline,
    },
    ...candidates.map((candidate) => candidate!),
  ];
  const attempts = await runLandingPageDraftComparison({
    environment: payload.environment,
    configurations,
    roundId: payload.roundId,
  });
  const aliasByKey = new Map(
    payload.configurations.map((configuration, index) => [
      configuration.key,
      landingPageDraftComparisonAlias(index)!,
    ]),
  );
  return {
    ok: true,
    results: attempts.map((attempt) => ({
      alias: aliasByKey.get(attempt.configuration.key) ?? "Resultado repetido",
      ...attempt,
    })),
  };
}

async function authorize(): Promise<Readonly<{ ok: true }> | LandingPageDraftComparisonActionFailure> {
  const gate = await requirePlatformAdmin();
  return gate.allowed
    ? { ok: true }
    : failure("unauthorized", "Acesso administrativo não autorizado.");
}

async function readAuthority(environment: OpenAiManagedWorkloadEnvironment): Promise<
  | Readonly<{
      ok: true;
      baseline: ResolvedOpenAiProductWorkload;
      catalog: readonly OpenAiModelCatalogModel[];
    }>
  | LandingPageDraftComparisonActionFailure
> {
  const [administrative, catalog, resolved] = await Promise.all([
    readOpenAiAdministrativeConfigurations(),
    readOpenAiModelCatalog(),
    resolveOpenAiProductWorkload(
      LANDING_PAGE_DRAFT_COMPARISON_WORKLOAD,
      environment,
    ),
  ]);
  if (!administrative.ok || !catalog.ok || !resolved.ok) {
    return failure("read", "Baseline ativa ou catálogo não puderam ser confirmados.");
  }
  const unit = administrative.value.find(
    (candidate) =>
      candidate.environment === environment &&
      candidate.workload === LANDING_PAGE_DRAFT_COMPARISON_WORKLOAD,
  );
  if (
    !unit ||
    unit.activeRevision.apiKind !== "responses_text" ||
    resolved.value.model !== unit.activeRevision.model ||
    resolved.value.reasoningEffort !== unit.activeRevision.reasoningEffort ||
    resolved.value.revision !== String(unit.activeRevision.number)
  ) {
    return failure("configuration", "A baseline ativa está inconsistente.");
  }
  return { ok: true, baseline: resolved.value, catalog: catalog.value };
}

function resolveCatalogCandidate(
  selection: LandingPageDraftComparisonSelection,
  catalog: readonly OpenAiModelCatalogModel[],
  baseline: ResolvedOpenAiProductWorkload,
) {
  const model = catalog.find(
    (candidate) =>
      candidate.apiKind === "responses_text" &&
      candidate.model === selection.model &&
      candidate.availableForSelection,
  );
  const parameter = model?.parameters.find(
    (candidate) =>
      candidate.kind === "reasoning_effort" &&
      candidate.value === selection.reasoningEffort &&
      candidate.availableForSelection,
  );
  if (!model || !parameter) return null;
  const revision = modelCatalogComparisonRevision(model.version, parameter.version);
  if (!revision) return null;
  const resolvedWorkload: ResolvedOpenAiProductWorkload = {
    ...baseline,
    model: selection.model,
    reasoningEffort: selection.reasoningEffort,
    source: "model_catalog_comparison",
    revision,
  };
  if (!isValidResolvedOpenAiProductWorkload(resolvedWorkload)) return null;
  return {
    publicConfiguration: {
      key: landingPageDraftComparisonConfigurationKey(selection),
      ...selection,
      baseline: false,
      source: "model_catalog_comparison",
      revision,
      catalogModelVersion: model.version,
      catalogParameterVersion: parameter.version,
    },
    resolvedWorkload,
  } as const;
}

function toBaselineConfiguration(
  baseline: ResolvedOpenAiProductWorkload,
): LandingPageDraftComparisonConfiguration {
  return {
    key: landingPageDraftComparisonConfigurationKey(baseline),
    model: baseline.model,
    reasoningEffort: baseline.reasoningEffort,
    baseline: true,
    source: baseline.source,
    revision: baseline.revision,
    catalogModelVersion: null,
    catalogParameterVersion: null,
  };
}

function signRoundToken(payload: RoundTokenPayload) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", key)
    .update(`${ROUND_TOKEN_DOMAIN}.${encoded}`)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyRoundToken(token: string): RoundTokenPayload | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  const [encoded, signature, extra] = token.split(".");
  if (!key || !encoded || !signature || extra) return null;
  const expected = createHmac("sha256", key)
    .update(`${ROUND_TOKEN_DOMAIN}.${encoded}`)
    .digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!isRoundTokenPayload(value) || value.expiresAt < Date.now()) return null;
    return value;
  } catch {
    return null;
  }
}

function isRoundTokenPayload(value: unknown): value is RoundTokenPayload {
  if (!isRecord(value)) return false;
  const configurations = value.configurations;
  return (
    value.schemaVersion === 1 &&
    typeof value.roundId === "string" &&
    /^[0-9a-f-]{36}$/i.test(value.roundId) &&
    typeof value.issuedAt === "number" &&
    typeof value.expiresAt === "number" &&
    Boolean(parseEnvironment(value.environment)) &&
    value.workload === LANDING_PAGE_DRAFT_COMPARISON_WORKLOAD &&
    value.fixtureId === LANDING_PAGE_DRAFT_COMPARISON_CASE_ID &&
    value.fixtureVersion === LANDING_PAGE_DRAFT_COMPARISON_FIXTURE_VERSION &&
    value.contextContractVersion === 4 &&
    value.presentationContractVersion === 1 &&
    Array.isArray(configurations) &&
    configurations.length >= LANDING_PAGE_DRAFT_COMPARISON_MIN_CONFIGURATIONS &&
    configurations.length <= LANDING_PAGE_DRAFT_COMPARISON_MAX_CONFIGURATIONS &&
    configurations.filter(
      (configuration) => isRecord(configuration) && configuration.baseline === true,
    ).length === 1
  );
}

function parseFinalistKeys(value: unknown) {
  if (!Array.isArray(value) || value.length > LANDING_PAGE_DRAFT_COMPARISON_MAX_FINALISTS) {
    return null;
  }
  const keys = value.map((candidate) =>
    typeof candidate === "string" && candidate.length <= 180 ? candidate : null,
  );
  if (keys.some((candidate) => candidate === null)) return null;
  const unique = new Set(keys as string[]);
  return unique.size === keys.length ? [...unique] : null;
}

function parseEnvironment(value: unknown): OpenAiManagedWorkloadEnvironment | null {
  return value === "preview" || value === "production" ? value : null;
}

function validationFailure(message: string): LandingPageDraftComparisonActionFailure {
  return failure("validation", message);
}

function failure(
  code: LandingPageDraftComparisonActionFailure["code"],
  message: string,
): LandingPageDraftComparisonActionFailure {
  return { ok: false, code, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
