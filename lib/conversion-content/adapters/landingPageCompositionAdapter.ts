import "server-only";

import { createClient as createAuthenticatedClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  validateLandingPageComposition,
  type LandingPageCompositionDraft,
  type LandingPageCompositionGap,
  type LandingPageCompositionItem,
  type LandingPageCompositionProvenance,
  type LandingPageCompositionSourceSnapshots,
  type LandingPageCompositionStatus,
  type LandingPageCompositionTaxon,
  type ValidatedLandingPageComposition,
} from "../landing-page/composition";

const COMPOSITION_COLUMNS =
  "id,owner_taxon_id,version,status,root_snapshot_json,module_catalog_snapshot_json,research_snapshot_json,input_catalog_snapshot_json,items_json,gaps_json,provenance_json,validation_fingerprint,created_by,updated_by,activated_by,created_at,updated_at,activated_at,owner_taxon:business_taxons!landing_page_compositions_owner_taxon_id_fkey(id,parent_id,level,name,slug,is_active)";

export type LandingPageTaxonPolicyRecord = Readonly<{
  taxonId: string;
  inheritanceBlocked: boolean;
  ownCompositionAllowed: boolean;
  decisionReason: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}>;

export type LandingPageCompositionPersistenceRecord = Readonly<{
  id: string;
  ownerTaxon: LandingPageCompositionTaxon;
  version: number;
  status: LandingPageCompositionStatus;
  sourceSnapshots: LandingPageCompositionSourceSnapshots;
  items: readonly LandingPageCompositionItem[];
  gaps: readonly LandingPageCompositionGap[];
  provenance: LandingPageCompositionProvenance;
  validationFingerprint: string;
  createdBy: string;
  updatedBy: string;
  activatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
}>;

export async function getLandingPageTaxonPolicy(
  taxonId: string,
): Promise<LandingPageTaxonPolicyRecord | null> {
  if (!isUuid(taxonId)) return null;
  const { data, error } = await createServiceClient()
    .from("landing_page_taxon_policies")
    .select(
      "taxon_id,inheritance_blocked,own_composition_allowed,decision_reason,created_by,updated_by,created_at,updated_at",
    )
    .eq("taxon_id", taxonId)
    .maybeSingle();

  if (error) throw error;
  return normalizePolicy(data);
}

export async function setLandingPageTaxonPolicy(input: {
  taxonId: string;
  inheritanceBlocked: boolean;
  ownCompositionAllowed: boolean;
  decisionReason?: string | null;
  actorId: string;
}): Promise<LandingPageTaxonPolicyRecord> {
  if (!isUuid(input.taxonId) || !isUuid(input.actorId)) {
    throw new Error("invalid_landing_page_taxon_policy_identity");
  }

  const supabase = createServiceClient();
  const current = await getLandingPageTaxonPolicy(input.taxonId);
  const mutation = current
    ? supabase
        .from("landing_page_taxon_policies")
        .update({
          inheritance_blocked: input.inheritanceBlocked,
          own_composition_allowed: input.ownCompositionAllowed,
          decision_reason: normalizeOptionalText(input.decisionReason),
          updated_by: input.actorId,
        })
        .eq("taxon_id", input.taxonId)
    : supabase.from("landing_page_taxon_policies").insert({
        taxon_id: input.taxonId,
        inheritance_blocked: input.inheritanceBlocked,
        own_composition_allowed: input.ownCompositionAllowed,
        decision_reason: normalizeOptionalText(input.decisionReason),
        created_by: input.actorId,
        updated_by: input.actorId,
      });

  const { data, error } = await mutation
    .select(
      "taxon_id,inheritance_blocked,own_composition_allowed,decision_reason,created_by,updated_by,created_at,updated_at",
    )
    .single();
  if (error) throw error;

  const normalized = normalizePolicy(data);
  if (!normalized) throw new Error("invalid_landing_page_taxon_policy_row");
  return normalized;
}

export async function getLandingPageCompositionById(
  compositionId: string,
): Promise<LandingPageCompositionPersistenceRecord | null> {
  if (!isUuid(compositionId)) return null;
  const { data, error } = await createServiceClient()
    .from("landing_page_compositions")
    .select(COMPOSITION_COLUMNS)
    .eq("id", compositionId)
    .maybeSingle();

  if (error) throw error;
  return normalizeComposition(data);
}

export async function listLandingPageCompositions(
  ownerTaxonId: string,
): Promise<readonly LandingPageCompositionPersistenceRecord[]> {
  if (!isUuid(ownerTaxonId)) return [];
  const { data, error } = await createServiceClient()
    .from("landing_page_compositions")
    .select(COMPOSITION_COLUMNS)
    .eq("owner_taxon_id", ownerTaxonId)
    .order("version", { ascending: false })
    .order("id", { ascending: true });

  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("invalid_landing_page_composition_rows");
  const normalized = data.map(normalizeComposition);
  if (normalized.some((value) => value === null)) {
    throw new Error("invalid_landing_page_composition_row");
  }
  return normalized as LandingPageCompositionPersistenceRecord[];
}

export async function createLandingPageCompositionDraft(input: {
  validated: ValidatedLandingPageComposition;
  actorId: string;
}): Promise<LandingPageCompositionPersistenceRecord> {
  if (!isUuid(input.actorId)) {
    throw new Error("invalid_landing_page_composition_actor");
  }

  const composition = input.validated.composition;
  const { data, error } = await createServiceClient()
    .from("landing_page_compositions")
    .insert({
      owner_taxon_id: composition.ownerTaxon.id,
      version: composition.version,
      status: "draft",
      root_snapshot_json: composition.sourceSnapshots.root,
      module_catalog_snapshot_json: composition.sourceSnapshots.moduleCatalog,
      research_snapshot_json: composition.sourceSnapshots.research,
      input_catalog_snapshot_json: composition.sourceSnapshots.inputCatalog,
      items_json: composition.items,
      gaps_json: composition.gaps,
      provenance_json: composition.provenance,
      validation_fingerprint: input.validated.validationFingerprint,
      created_by: input.actorId,
      updated_by: input.actorId,
    })
    .select(COMPOSITION_COLUMNS)
    .single();

  if (error) throw error;
  const normalized = normalizeComposition(data);
  if (!normalized) throw new Error("invalid_landing_page_composition_row");
  return normalized;
}

export async function updateLandingPageCompositionDraft(input: {
  compositionId: string;
  expectedUpdatedAt: string;
  validated: ValidatedLandingPageComposition;
  actorId: string;
}): Promise<LandingPageCompositionPersistenceRecord | null> {
  if (!isUuid(input.compositionId) || !isUuid(input.actorId)) {
    throw new Error("invalid_landing_page_composition_identity");
  }

  const composition = input.validated.composition;
  const { data, error } = await createServiceClient()
    .from("landing_page_compositions")
    .update({
      root_snapshot_json: composition.sourceSnapshots.root,
      module_catalog_snapshot_json: composition.sourceSnapshots.moduleCatalog,
      research_snapshot_json: composition.sourceSnapshots.research,
      input_catalog_snapshot_json: composition.sourceSnapshots.inputCatalog,
      items_json: composition.items,
      gaps_json: composition.gaps,
      provenance_json: composition.provenance,
      validation_fingerprint: input.validated.validationFingerprint,
      updated_by: input.actorId,
    })
    .eq("id", input.compositionId)
    .eq("owner_taxon_id", composition.ownerTaxon.id)
    .eq("version", composition.version)
    .eq("status", "draft")
    .eq("updated_at", input.expectedUpdatedAt)
    .select(COMPOSITION_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  return normalizeComposition(data);
}

export async function activateLandingPageComposition(input: {
  compositionId: string;
  expectedUpdatedAt: string;
  validated: ValidatedLandingPageComposition;
}): Promise<LandingPageCompositionPersistenceRecord> {
  if (
    !isUuid(input.compositionId) ||
    !isDateString(input.expectedUpdatedAt) ||
    !input.validated.activationReady ||
    !/^[0-9a-f]{64}$/i.test(input.validated.validationFingerprint)
  ) {
    throw new Error("invalid_landing_page_composition_activation");
  }

  const supabase = await createAuthenticatedClient();
  const { data, error } = await supabase.rpc(
    "activate_landing_page_composition",
    {
      p_composition_id: input.compositionId,
      p_expected_fingerprint: input.validated.validationFingerprint,
      p_expected_updated_at: input.expectedUpdatedAt,
    },
  );

  if (error) throw error;
  const normalized = normalizeComposition({
    ...asRecord(data),
    owner_taxon: input.validated.composition.ownerTaxon,
  });
  if (
    !normalized ||
    normalized.status !== "active" ||
    normalized.id !== input.compositionId ||
    normalized.validationFingerprint !== input.validated.validationFingerprint
  ) {
    throw new Error("invalid_landing_page_composition_activation_result");
  }
  return normalized;
}

function normalizePolicy(value: unknown): LandingPageTaxonPolicyRecord | null {
  if (!isRecord(value)) return null;
  if (
    !isUuid(value.taxon_id) ||
    typeof value.inheritance_blocked !== "boolean" ||
    typeof value.own_composition_allowed !== "boolean" ||
    (value.decision_reason !== null && typeof value.decision_reason !== "string") ||
    !isUuid(value.created_by) ||
    !isUuid(value.updated_by) ||
    !isDateString(value.created_at) ||
    !isDateString(value.updated_at)
  ) {
    return null;
  }

  return {
    taxonId: value.taxon_id,
    inheritanceBlocked: value.inheritance_blocked,
    ownCompositionAllowed: value.own_composition_allowed,
    decisionReason: value.decision_reason,
    createdBy: value.created_by,
    updatedBy: value.updated_by,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function normalizeComposition(
  value: unknown,
): LandingPageCompositionPersistenceRecord | null {
  if (!isRecord(value)) return null;
  const ownerTaxon = normalizeTaxon(value.owner_taxon);
  if (
    !isUuid(value.id) ||
    !ownerTaxon ||
    value.owner_taxon_id !== ownerTaxon.id ||
    !Number.isInteger(value.version) ||
    !isCompositionStatus(value.status) ||
    typeof value.validation_fingerprint !== "string" ||
    !isUuid(value.created_by) ||
    !isUuid(value.updated_by) ||
    (value.activated_by !== null && !isUuid(value.activated_by)) ||
    !isDateString(value.created_at) ||
    !isDateString(value.updated_at) ||
    (value.activated_at !== null && !isDateString(value.activated_at))
  ) {
    return null;
  }

  const candidate: LandingPageCompositionDraft = {
    ownerTaxon,
    version: value.version as number,
    status: "draft",
    sourceSnapshots: {
      root: value.root_snapshot_json as LandingPageCompositionSourceSnapshots["root"],
      moduleCatalog:
        value.module_catalog_snapshot_json as LandingPageCompositionSourceSnapshots["moduleCatalog"],
      research:
        value.research_snapshot_json as LandingPageCompositionSourceSnapshots["research"],
      inputCatalog:
        value.input_catalog_snapshot_json as LandingPageCompositionSourceSnapshots["inputCatalog"],
    },
    items: value.items_json as readonly LandingPageCompositionItem[],
    gaps: value.gaps_json as readonly LandingPageCompositionGap[],
    provenance: value.provenance_json as LandingPageCompositionProvenance,
  };
  const validation = validateLandingPageComposition({
    mode: "draft",
    funnelProfileKey: "bofu",
    ownerPolicy:
      ownerTaxon.level === "ultra_niche"
        ? { ownCompositionAllowed: true }
        : undefined,
    composition: candidate,
  });
  if (!validation.ok) return null;

  return {
    id: value.id,
    ownerTaxon,
    version: value.version as number,
    status: value.status,
    sourceSnapshots: validation.value.composition.sourceSnapshots,
    items: validation.value.composition.items,
    gaps: validation.value.composition.gaps,
    provenance: validation.value.composition.provenance,
    validationFingerprint: value.validation_fingerprint,
    createdBy: value.created_by,
    updatedBy: value.updated_by,
    activatedBy: value.activated_by,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
    activatedAt: value.activated_at,
  };
}

function normalizeTaxon(value: unknown): LandingPageCompositionTaxon | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row)) return null;
  if (
    !isUuid(row.id) ||
    typeof row.name !== "string" ||
    typeof row.slug !== "string" ||
    !isTaxonLevel(row.level) ||
    typeof row.is_active !== "boolean" ||
    (row.parent_id !== null && !isUuid(row.parent_id))
  ) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    level: row.level,
    isActive: row.is_active,
    parentId: row.parent_id,
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error("invalid_landing_page_composition_rpc_result");
  }
  return value;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isTaxonLevel(
  value: unknown,
): value is LandingPageCompositionTaxon["level"] {
  return value === "segment" || value === "niche" || value === "ultra_niche";
}

function isCompositionStatus(
  value: unknown,
): value is LandingPageCompositionStatus {
  return value === "draft" || value === "active" || value === "archived";
}
