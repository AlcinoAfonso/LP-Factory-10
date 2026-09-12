import { createHash } from "node:crypto";

import {
  buildLandingPageInputCatalogTaxonChain,
  landingPageInputCatalogPlans,
  type LandingPageInputCatalogTaxonChain,
  type LandingPageInputCatalogTaxonIdentity,
  type ResolvedLandingPageInputCatalog,
} from "../input-catalog";
import type {
  FactualReviewCatalogChangeDecision,
  FactualReviewKind,
  NormalizeFactualReviewCatalogChangeDecisionResult,
  ResolveInheritedInputCatalogCoverageInput,
  ResolveInheritedInputCatalogCoverageResult,
} from "./contracts";
import { factualReviewDecisionLayers } from "./contracts";

export function deriveFactualReviewKind(isActive: boolean): FactualReviewKind {
  return isActive ? "revision" : "release";
}

export function isGenericTaxonActivation(
  currentIsActive: boolean,
  nextIsActive: boolean,
): boolean {
  return !currentIsActive && nextIsActive;
}

export function normalizeFactualReviewCatalogChangeDecision(
  value: unknown,
): NormalizeFactualReviewCatalogChangeDecisionResult {
  if (!isRecord(value)) return invalidDecision();
  const candidateCount = value.recommendationCandidateCount;
  const accepted = value.acceptedCandidates;
  const rejected = value.rejectedCandidateIndexes;
  const own = value.ownCandidate;
  if (
    !Number.isSafeInteger(candidateCount) ||
    Number(candidateCount) < 0 ||
    Number(candidateCount) > 100 ||
    !Array.isArray(accepted) ||
    !Array.isArray(rejected) ||
    accepted.length > Number(candidateCount) ||
    rejected.length > Number(candidateCount)
  ) {
    return invalidDecision();
  }

  const acceptedCandidates: Array<{ index: number; layer: (typeof factualReviewDecisionLayers)[number] }> = [];
  const coveredIndexes = new Set<number>();
  for (const candidate of accepted) {
    if (
      !isRecord(candidate) ||
      !Number.isSafeInteger(candidate.index) ||
      Number(candidate.index) < 0 ||
      Number(candidate.index) >= Number(candidateCount) ||
      !isDecisionLayer(candidate.layer) ||
      coveredIndexes.has(Number(candidate.index))
    ) {
      return invalidDecision();
    }
    coveredIndexes.add(Number(candidate.index));
    acceptedCandidates.push({ index: Number(candidate.index), layer: candidate.layer });
  }
  const rejectedCandidateIndexes: number[] = [];
  for (const index of rejected) {
    if (
      !Number.isSafeInteger(index) ||
      Number(index) < 0 ||
      Number(index) >= Number(candidateCount) ||
      coveredIndexes.has(Number(index))
    ) {
      return invalidDecision();
    }
    coveredIndexes.add(Number(index));
    rejectedCandidateIndexes.push(Number(index));
  }
  if (coveredIndexes.size !== Number(candidateCount)) return invalidDecision();

  let ownCandidate: FactualReviewCatalogChangeDecision["ownCandidate"] = null;
  if (own !== null) {
    if (
      !isRecord(own) ||
      typeof own.factualNeed !== "string" ||
      own.factualNeed.trim().length === 0 ||
      own.factualNeed.trim().length > 1000 ||
      !isDecisionLayer(own.layer)
    ) {
      return invalidDecision();
    }
    ownCandidate = Object.freeze({
      factualNeed: own.factualNeed.trim(),
      layer: own.layer,
    });
  }

  const recommendationSelection = acceptedCandidates.length === 0
    ? "zero"
    : acceptedCandidates.length === Number(candidateCount)
      ? "total"
      : "partial";
  if (value.recommendationSelection !== recommendationSelection) {
    return invalidDecision();
  }
  return {
    ok: true,
    value: Object.freeze({
      decisionKind:
        acceptedCandidates.length === 0 && ownCandidate === null
          ? "no_change"
          : "catalog_change",
      recommendationCandidateCount: Number(candidateCount),
      recommendationSelection,
      acceptedCandidates: Object.freeze(
        acceptedCandidates.sort((left, right) => left.index - right.index),
      ),
      rejectedCandidateIndexes: Object.freeze(rejectedCandidateIndexes.sort((a, b) => a - b)),
      ownCandidate,
    }),
  };
}

export function resolveInheritedInputCatalogCoverage(
  input: ResolveInheritedInputCatalogCoverageInput,
): ResolveInheritedInputCatalogCoverageResult {
  if (!Number.isSafeInteger(input.inputCatalogVersion) || input.inputCatalogVersion <= 0) {
    return failure(
      "INVALID_INPUT_CATALOG_VERSION",
      "A versão do catálogo de entrada precisa ser inteira e positiva.",
    );
  }

  const chain = buildAdministrativeTaxonChain(input.baseline.taxon, input.taxons);
  if (!chain.ok) return chain;

  const catalogs: ResolvedLandingPageInputCatalog[] = [];
  for (const plan of landingPageInputCatalogPlans) {
    const resolved = input.resolvePlan({
      version: input.inputCatalogVersion,
      plan,
      taxonChain: chain.value.operational,
      ultraNicheLayerAuthorized: true,
    });
    if (!resolved.ok) {
      return failure(
        "INPUT_CATALOG_RESOLUTION_FAILED",
        `A cobertura herdada do plano ${plan} não pôde ser resolvida: ${resolved.error.message}`,
      );
    }
    catalogs.push(resolved.value);
  }

  const contextIdentity = {
    taxon: input.baseline.taxon,
    selectedResearchVersion: input.baseline.selectedResearchVersion,
    reviewedInputCatalogVersion: input.baseline.reviewedInputCatalogVersion,
    chainSnapshot: buildCanonicalChainSnapshot(chain.value.factual),
    inputCatalogVersion: input.inputCatalogVersion,
  };
  const frozenCatalogs = Object.freeze(catalogs);

  return {
    ok: true,
    value: Object.freeze({
      inputCatalogVersion: input.inputCatalogVersion,
      taxonChain: chain.value.factual,
      chainSnapshot: contextIdentity.chainSnapshot,
      catalogs: frozenCatalogs,
      contextFingerprint: fingerprintCanonicalValue(contextIdentity),
      contentFingerprint: fingerprintCanonicalValue(frozenCatalogs),
    }),
  };
}

function buildCanonicalChainSnapshot(
  chain: LandingPageInputCatalogTaxonChain,
): readonly LandingPageInputCatalogTaxonIdentity[] {
  return Object.freeze(
    [chain.segment, chain.niche, chain.ultraNiche]
      .filter((taxon): taxon is LandingPageInputCatalogTaxonIdentity => taxon !== undefined)
      .map((taxon) => Object.freeze({ ...taxon })),
  );
}

function buildAdministrativeTaxonChain(
  selected: LandingPageInputCatalogTaxonIdentity,
  taxons: readonly LandingPageInputCatalogTaxonIdentity[],
):
  | Readonly<{
      ok: true;
      value: Readonly<{
        factual: LandingPageInputCatalogTaxonChain;
        operational: LandingPageInputCatalogTaxonChain;
      }>;
    }>
  | Extract<ResolveInheritedInputCatalogCoverageResult, { ok: false }> {
  const selectedForResolution = Object.freeze({ ...selected, isActive: true });
  const taxonsForResolution = taxons.map((taxon) =>
    taxon.id === selected.id ? selectedForResolution : taxon,
  );
  const operational = buildLandingPageInputCatalogTaxonChain(
    selectedForResolution,
    taxonsForResolution,
  );
  if (!operational.ok) {
    return failure("INVALID_TAXON_CHAIN", operational.error.message);
  }

  return {
    ok: true,
    value: {
      operational: operational.value,
      factual: replaceSelectedTaxonActivity(operational.value, selected),
    },
  };
}

function replaceSelectedTaxonActivity(
  chain: LandingPageInputCatalogTaxonChain,
  selected: LandingPageInputCatalogTaxonIdentity,
): LandingPageInputCatalogTaxonChain {
  return Object.freeze({
    segment: chain.segment.id === selected.id ? selected : chain.segment,
    ...(chain.niche
      ? { niche: chain.niche.id === selected.id ? selected : chain.niche }
      : {}),
    ...(chain.ultraNiche
      ? { ultraNiche: chain.ultraNiche.id === selected.id ? selected : chain.ultraNiche }
      : {}),
  });
}

function fingerprintCanonicalValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${
    Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(",")}}`;
}

function isDecisionLayer(value: unknown): value is (typeof factualReviewDecisionLayers)[number] {
  return typeof value === "string" && factualReviewDecisionLayers.includes(
    value as (typeof factualReviewDecisionLayers)[number],
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidDecision(): NormalizeFactualReviewCatalogChangeDecisionResult {
  return {
    ok: false,
    error: {
      code: "INVALID_FACTUAL_REVIEW_DECISION",
      message: "A decisão factual precisa cobrir cada recomendação e explicitar a camada aceita.",
    },
  };
}

function failure(
  code: Extract<ResolveInheritedInputCatalogCoverageResult, { ok: false }>["error"]["code"],
  message: string,
): Extract<ResolveInheritedInputCatalogCoverageResult, { ok: false }> {
  return { ok: false, error: { code, message } };
}
