import type {
  CommercialActivationBundleResult,
  CommercialActivationContentTaxon,
  CommercialActivationHierarchicalResolutionResult,
} from "../contracts";

export type CommercialActivationTaxonReader = (
  taxonId: string,
) => Promise<CommercialActivationContentTaxon | null>;

export type CommercialActivationBundleReader = (
  input: { taxonId: string },
) => Promise<CommercialActivationBundleResult>;

export async function resolveCommercialActivationHierarchicalBundle(input: {
  taxonId: string;
  readTaxon: CommercialActivationTaxonReader;
  readBundle: CommercialActivationBundleReader;
}): Promise<CommercialActivationHierarchicalResolutionResult> {
  const originalTaxonId = input.taxonId.trim();

  if (!originalTaxonId) {
    return fallback("fallback_taxon_not_found", originalTaxonId);
  }

  const visited = new Set<string>();
  let currentTaxonId: string | null = originalTaxonId;

  while (currentTaxonId) {
    if (visited.has(currentTaxonId)) {
      return fallback("fallback_cycle_detected", originalTaxonId);
    }
    visited.add(currentTaxonId);

    let taxon: CommercialActivationContentTaxon | null;
    try {
      taxon = await input.readTaxon(currentTaxonId);
    } catch {
      return fallback("fallback_read_failed", originalTaxonId);
    }

    if (!taxon) {
      return currentTaxonId === originalTaxonId
        ? fallback("fallback_taxon_not_found", originalTaxonId)
        : fallback("fallback_no_ready_bundle", originalTaxonId);
    }

    if (!taxon.isActive) {
      return currentTaxonId === originalTaxonId
        ? fallback("fallback_taxon_inactive", originalTaxonId)
        : fallback("fallback_no_ready_bundle", originalTaxonId);
    }

    let bundleResult: CommercialActivationBundleResult;
    try {
      bundleResult = await input.readBundle({ taxonId: taxon.id });
    } catch {
      return fallback("fallback_read_failed", originalTaxonId);
    }

    if (bundleResult.status === "ready") {
      return {
        status: "ready",
        original_taxon_id: originalTaxonId,
        resolved_content_taxon_id: taxon.id,
        bundle: bundleResult.bundle,
      };
    }

    if (bundleResult.status === "read_failed") {
      return fallback("fallback_read_failed", originalTaxonId);
    }

    currentTaxonId = taxon.parentId;
  }

  return fallback("fallback_no_ready_bundle", originalTaxonId);
}

function fallback(
  status: Exclude<CommercialActivationHierarchicalResolutionResult["status"], "ready">,
  originalTaxonId: string,
): CommercialActivationHierarchicalResolutionResult {
  return {
    status,
    original_taxon_id: originalTaxonId,
    resolved_content_taxon_id: null,
    bundle: null,
  };
}
