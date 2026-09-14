import "server-only";

import { createHash } from "node:crypto";

import { readFactualCoverageForTaxon } from "@/conversion-content/adapters/factualFieldsAdapter";
import { type FactualTaxonIdentity } from "@/conversion-content/landing-page/input-catalog";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  AdminTaxonFactualRelease,
  AdminTaxonLevel,
} from "./adminReadOnlyTypes";
import {
  executeAdminTaxonFactualReleaseCore,
  type AdminTaxonFactualReleaseCoreResult,
} from "./adminTaxonFactualReleaseCore";

type ReleaseAdminTaxonInput = Readonly<{
  taxonId: string;
  coverageFingerprint: string;
}>;

export type ReleaseAdminTaxonResult = AdminTaxonFactualReleaseCoreResult;

type ReadFactualReleaseSnapshotResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        identity: FactualTaxonIdentity;
        release: Extract<AdminTaxonFactualRelease, { status: "available" }>;
      }>;
    }>
  | Readonly<{
      ok: false;
      error: Extract<AdminTaxonFactualRelease, { status: "read_failed" }>;
    }>;

const VALID_TAXON_LEVELS: readonly AdminTaxonLevel[] = [
  "segment",
  "niche",
  "ultra_niche",
];

export async function readAdminTaxonFactualRelease(
  taxonId: string,
): Promise<AdminTaxonFactualRelease> {
  const snapshot = await readFactualReleaseSnapshot(taxonId);
  return snapshot.ok ? snapshot.value.release : snapshot.error;
}

async function readFactualReleaseSnapshot(
  taxonId: string,
): Promise<ReadFactualReleaseSnapshotResult> {
  if (!taxonId) {
    return { ok: false, error: readFailed("TAXON_NOT_FOUND", "O taxon não existe.") };
  }

  const supabase = createServiceClient();
  const identity = await readTaxonIdentity(supabase, taxonId);
  if (!identity.ok) return { ok: false, error: identity.error };

  const coverage = await readFactualCoverageForTaxon(taxonId, { allowInactiveSelected: true });
  if (!coverage.ok) {
    return {
      ok: false,
      error: readFailed("FACTUAL_COVERAGE_READ_FAILED", coverage.error.message),
    };
  }
  if (!sameTaxonIdentity(coverage.value.servedTaxon, identity.value)) {
    return {
      ok: false,
      error: readFailed(
        "TAXON_CHANGED",
        "O taxon mudou durante a leitura da cobertura. Recarregue a página.",
      ),
    };
  }

  const appliedLayers = coverage.value.appliedLayers.map((layer) => ({
    level: layer.level,
    taxonName: layer.taxon?.name ?? null,
    served: layer.taxon?.id === identity.value.id,
  }));
  const fields = coverage.value.fields.map((field) => ({
    fieldKey: field.fieldKey,
    purpose: field.purpose,
    ownership: field.originTaxon?.id === identity.value.id
      ? "own" as const
      : "inherited" as const,
    originLayer: field.originLayer,
    originTaxonName: field.originTaxon?.name ?? null,
    valueType: field.valueType,
    valueScope: field.valueScope,
    expectedValueOrigin: field.expectedValueOrigin,
    obligation: field.obligation,
    requiredWhen: field.requiredWhen ?? null,
    applicableWhen: field.applicableWhen ?? null,
    validation: field.validation,
  }));
  const fingerprintPayload = {
    taxon: identity.value,
    appliedLayers,
    fields: coverage.value.fields,
  };

  return {
    ok: true,
    value: {
      identity: identity.value,
      release: {
        status: "available",
        coverageFingerprint: createHash("sha256")
          .update(JSON.stringify(fingerprintPayload))
          .digest("hex"),
        isActive: identity.value.isActive,
        appliedLayers,
        fields,
      },
    },
  };
}

export async function releaseAdminTaxon(
  input: ReleaseAdminTaxonInput,
): Promise<ReleaseAdminTaxonResult> {
  const supabase = createServiceClient();
  return executeAdminTaxonFactualReleaseCore(input, {
    readSnapshot: async (taxonId) => {
      const snapshot = await readFactualReleaseSnapshot(taxonId);
      return snapshot.ok
        ? {
            ok: true,
            value: {
              coverageFingerprint: snapshot.value.release.coverageFingerprint,
              identity: snapshot.value.identity,
            },
          }
        : { ok: false, message: snapshot.error.message };
    },
    activate: (identity) => activateTaxonByIdentity(supabase, identity),
    verifyIdentity: async (taxonId) => {
      const verified = await readTaxonIdentity(supabase, taxonId);
      return verified.ok ? verified.value : null;
    },
  });
}

async function activateTaxonByIdentity(
  supabase: ReturnType<typeof createServiceClient>,
  identity: FactualTaxonIdentity,
): Promise<boolean> {
  let updateQuery: any = supabase
    .from("business_taxons")
    .update({ is_active: true })
    .eq("id", identity.id)
    .eq("name", identity.name)
    .eq("slug", identity.slug)
    .eq("level", identity.level)
    .eq("is_active", false);
  updateQuery = identity.parentId === null
    ? updateQuery.is("parent_id", null)
    : updateQuery.eq("parent_id", identity.parentId);
  const { data: updated, error: updateError } = await updateQuery
    .select("id")
    .maxAffected(1)
    .maybeSingle();
  return !updateError && Boolean(updated);
}

async function readTaxonIdentity(
  supabase: ReturnType<typeof createServiceClient>,
  taxonId: string,
): Promise<
  | Readonly<{ ok: true; value: FactualTaxonIdentity }>
  | Readonly<{ ok: false; error: Extract<AdminTaxonFactualRelease, { status: "read_failed" }> }>
> {
  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,parent_id,level,name,slug,is_active")
    .eq("id", taxonId)
    .limit(1)
    .maybeSingle();
  if (error) {
    return {
      ok: false,
      error: readFailed("DATABASE_READ_FAILED", "Não foi possível ler o taxon agora."),
    };
  }
  if (!isTaxonRow(data)) {
    return {
      ok: false,
      error: readFailed("TAXON_IDENTITY_INVALID", "A identidade do taxon é inválida."),
    };
  }
  return {
    ok: true,
    value: {
      id: data.id,
      parentId: data.parent_id,
      level: data.level,
      name: data.name,
      slug: data.slug,
      isActive: data.is_active,
    },
  };
}

function isTaxonRow(value: unknown): value is Readonly<{
  id: string;
  parent_id: string | null;
  level: AdminTaxonLevel;
  name: string;
  slug: string;
  is_active: boolean;
}> {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    (value.parent_id === null || typeof value.parent_id === "string") &&
    VALID_TAXON_LEVELS.includes(value.level as AdminTaxonLevel) &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.is_active === "boolean"
  );
}

function sameTaxonIdentity(
  left: FactualTaxonIdentity,
  right: FactualTaxonIdentity,
): boolean {
  return (
    left.id === right.id &&
    left.parentId === right.parentId &&
    left.level === right.level &&
    left.name === right.name &&
    left.slug === right.slug &&
    left.isActive === right.isActive
  );
}

function readFailed(
  errorCode: string,
  message: string,
): Extract<AdminTaxonFactualRelease, { status: "read_failed" }> {
  return { status: "read_failed", errorCode, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
