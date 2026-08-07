import type {
  LandingPageGenerationProfilePriority,
  LandingPageGenerationProfileStatus,
} from "./contracts";

export type GenerationProfileRecommendationInput = Readonly<{
  moduleKey: string;
  moduleVersion: number;
  variantKey?: string;
  variantVersion?: number;
  priority: LandingPageGenerationProfilePriority;
  recommendedOrder: number;
  itemGuidance?: string;
}>;

export type GenerationProfileDraftInput = Readonly<{
  ownerTaxonId: string;
  profileId?: string;
  expectedUpdatedAt?: string;
  generationGuidance?: string;
  recommendations: readonly GenerationProfileRecommendationInput[];
  origin: "manual" | "ai";
  requestId?: string;
  proposalFingerprint?: string;
  gapAnalysisCompleted?: true;
  gapDecision?: GenerationProfileGapDecision;
  gapItemKeys?: readonly string[];
  gapImpactSummary?: string;
  researchVersions?: Readonly<{ endCustomer: number; businessBuyer: number }>;
}>;

export type GenerationProfileEditorContent = Readonly<{
  generationGuidance: string;
  recommendations: readonly GenerationProfileRecommendationInput[];
}>;

export type GenerationProfileStructuralRecommendation = Readonly<{
  moduleKey: string;
  moduleVersion: number;
  variantKey?: string;
  variantVersion?: number;
  priority: LandingPageGenerationProfilePriority;
  recommendedOrder: number;
}>;

export type GenerationProfileCoverageIdentity = Readonly<{
  moduleKey: string;
  moduleVersion: number;
  variantKey?: string;
  variantVersion?: number;
}>;

export type GenerationProfileCoverage = Readonly<{
  coverageId: string;
  audienceScope: "business_buyer" | "end_customer";
  itemKey: string;
  sectionName: string;
  sourcePriority: 1 | 2 | 3;
  sourceOrder: number;
  status: "covered" | "partial" | "missing";
  compatibleIdentities: readonly GenerationProfileCoverageIdentity[];
  selectedIdentities: readonly GenerationProfileCoverageIdentity[];
  reason?: string;
  impact?: string;
}>;

export type GenerationProfileGap = Readonly<{
  coverageId: string;
  audienceScope: "business_buyer" | "end_customer";
  itemKey: string;
  sectionName: string;
  sourcePriority: 1 | 2 | 3;
  sourceOrder: number;
  status: "partial" | "missing";
  reason: string;
  impact: string;
}>;

export type GenerationProfileGapDecision =
  | "wait_for_modules"
  | "proceed_with_available";

export type GenerationProfileProposalCorrelation = Readonly<{
  requestId: string;
  fingerprint: string;
}>;

export type GenerationProfileRecommendationDiff = Readonly<{
  moduleKey: string;
  status: "kept" | "added" | "changed" | "removed";
  changes: readonly ("module_version" | "variant" | "priority" | "order")[];
}>;

export type GenerationProfileReplacement = Readonly<{
  fromModuleKey: string;
  toModuleKey: string;
  recommendedOrder: number;
}>;

export type GenerationProfileProposalDiff = Readonly<{
  recommendations: readonly GenerationProfileRecommendationDiff[];
  replacements: readonly GenerationProfileReplacement[];
  gaps: Readonly<{
    added: readonly GenerationProfileGap[];
    resolved: readonly GenerationProfileGap[];
  }>;
}>;

export type AdminGenerationProfileTaxon = Readonly<{
  id: string;
  name: string;
  slug: string;
  level: "segment" | "niche" | "ultra_niche";
  parentId: string | null;
}>;

export type AdminGenerationProfile = Readonly<{
  id: string;
  ownerTaxonId: string;
  version: number;
  status: LandingPageGenerationProfileStatus;
  generationGuidance?: string;
  recommendations: readonly GenerationProfileRecommendationInput[];
  lastGapDecision?: GenerationProfileGapDecision;
  createdAt: string;
  updatedAt: string;
}>;

export type AdminGenerationProfileListItem = Readonly<{
  taxon: AdminGenerationProfileTaxon;
  resolvedState: "active_own" | "active_inherited" | "absent" | "unavailable";
  activeVersion: number | null;
  draftVersion: number | null;
  ownerTaxonId: string | null;
  ownerTaxonName: string | null;
}>;

export type AdminGenerationProfileResolvedSummary = Readonly<{
  state: AdminGenerationProfileListItem["resolvedState"];
  activeVersion: number | null;
  ownerTaxonId: string | null;
  ownerTaxonName: string | null;
}>;

type AdminGenerationProfilePresentationTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger";

export function composeAdminGenerationProfileListItem(input: {
  taxon: AdminGenerationProfileTaxon;
  draftVersion: number | null;
  resolved: AdminGenerationProfileResolvedSummary;
}): AdminGenerationProfileListItem {
  return {
    taxon: input.taxon,
    resolvedState: input.resolved.state,
    activeVersion: input.resolved.activeVersion,
    draftVersion: input.draftVersion,
    ownerTaxonId: input.resolved.ownerTaxonId,
    ownerTaxonName: input.resolved.ownerTaxonName,
  };
}

export function getAdminGenerationProfileEditorTaxonId(
  item: AdminGenerationProfileListItem,
): string {
  if (item.draftVersion !== null) return item.taxon.id;
  if (item.resolvedState === "active_inherited" && item.ownerTaxonId) {
    return item.ownerTaxonId;
  }
  return item.taxon.id;
}

export function getAdminGenerationProfilePresentation(
  item: AdminGenerationProfileListItem,
): Readonly<{
  active: Readonly<{ label: string; tone: AdminGenerationProfilePresentationTone }>;
  draft: Readonly<{ label: string; tone: AdminGenerationProfilePresentationTone }>;
  action: Readonly<{ label: string; href: string }>;
  assistanceTaxonId: string;
}> {
  const active = {
    active_own: {
      label: `Ativo — próprio${item.activeVersion ? ` v${item.activeVersion}` : ""}`,
      tone: "success" as const,
    },
    active_inherited: {
      label: `Ativo — herdado${item.activeVersion ? ` v${item.activeVersion}` : ""}`,
      tone: "success" as const,
    },
    absent: { label: "Ausente", tone: "neutral" as const },
    unavailable: { label: "Indisponível", tone: "danger" as const },
  }[item.resolvedState];
  const draft = item.draftVersion !== null
    ? { label: `Rascunho — próprio v${item.draftVersion}`, tone: "warning" as const }
    : { label: "Sem rascunho", tone: "neutral" as const };
  const assistanceTaxonId = getAdminGenerationProfileEditorTaxonId(item);
  const actionLabel = item.draftVersion !== null
    ? "Continuar"
    : item.resolvedState === "active_own"
      ? "Gerenciar"
      : item.resolvedState === "active_inherited"
        ? "Ver perfil"
        : item.resolvedState === "absent"
          ? "Criar perfil"
          : "Revisar perfis";
  const canOpenEditor =
    item.draftVersion !== null ||
    item.resolvedState === "active_own" ||
    item.resolvedState === "active_inherited" ||
    ((item.taxon.level === "segment" || item.taxon.level === "niche") &&
      item.resolvedState === "absent");

  return {
    active,
    draft,
    action: {
      label: actionLabel,
      href: canOpenEditor
        ? `/admin/perfis-de-orientacao/${assistanceTaxonId}`
        : "/admin/perfis-de-orientacao",
    },
    assistanceTaxonId,
  };
}

export type GenerationProfileMutationErrorCode =
  | "invalid_data"
  | "unauthorized"
  | "not_found"
  | "stale_snapshot"
  | "invalid_state"
  | "lifecycle_unavailable"
  | "technical_failure";

export type GenerationProfileMutationResult =
  | Readonly<{ ok: true; profileId: string; version: number; updatedAt: string }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: GenerationProfileMutationErrorCode;
        message: string;
      }>;
    }>;

export type GenerationProfileProposalErrorCode =
  | "missing_information"
  | "invalid_data"
  | "technical_failure";

export type GenerationProfileProposal = Readonly<{
  coverage: readonly GenerationProfileCoverage[];
  recommendations: readonly GenerationProfileStructuralRecommendation[];
  gaps: readonly GenerationProfileGap[];
  diff: GenerationProfileProposalDiff;
  researchVersions: Readonly<{ endCustomer: number; businessBuyer: number }>;
  requestId: string;
  fingerprint: string;
}>;

export type GenerationProfileProposalResult =
  | Readonly<{ ok: true; value: GenerationProfileProposal }>
  | Readonly<{
      ok: false;
      requestId: string;
      error: Readonly<{
        code: GenerationProfileProposalErrorCode;
        message: string;
      }>;
    }>;

export type GenerationProfileLifecycleReadiness = Readonly<{
  ready: boolean;
  reason: string;
}>;
