import assert from "node:assert/strict";

import { collectCompletePaginatedRows } from "../../../../lib/admin/adapters/adminInputCatalogLifecyclePagination";
import {
  collectRequiredFactualReviewTaxonIds,
  fingerprintInputCatalogLifecycleContext,
  hasCompleteFactualReviewCoverage,
  planPublishedInputCatalogReviewReconciliation,
  snapshotInputCatalogLifecycleContext,
} from "../../../../lib/admin/adapters/adminInputCatalogLifecycleValidation";
import {
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
} from "../../../../lib/conversion-content/landing-page/input-catalog";

export async function validateLifecycleE20Contracts(): Promise<void> {
  assert.deepEqual(collectRequiredFactualReviewTaxonIds({
    activeReviewRequiredTaxonIds: [realEstateSegmentTaxon.id],
    unclosedReleaseTaxonIds: [realEstateBrokerNicheTaxon.id],
  }), [realEstateSegmentTaxon.id, realEstateBrokerNicheTaxon.id].sort());
  assert.equal(hasCompleteFactualReviewCoverage({
    requiredTaxonIds: [realEstateSegmentTaxon.id, realEstateBrokerNicheTaxon.id],
    evidenceTaxonIds: [realEstateBrokerNicheTaxon.id, realEstateSegmentTaxon.id],
  }), true);
  assert.equal(hasCompleteFactualReviewCoverage({
    requiredTaxonIds: [realEstateSegmentTaxon.id, realEstateBrokerNicheTaxon.id],
    evidenceTaxonIds: [realEstateSegmentTaxon.id],
  }), false);
  const rows = Array.from({ length: 1_207 }, (_, index) => ({ id: index }));
  const complete = await collectCompletePaginatedRows({
    pageSize: 500,
    readPage: async (offset, limit) => ({
      rows: rows.slice(offset, offset + limit),
      total: rows.length,
    }),
  });
  assert.equal(complete.ok, true);
  if (!complete.ok) throw new Error("Expected complete E20 taxon scan");
  assert.deepEqual(complete.rows, rows);

  const taxons = [
    {
      identity: realEstateSegmentTaxon,
      reviewedVersion: 6,
      selectedResearchVersion: 1,
    },
    {
      identity: realEstateBrokerNicheTaxon,
      reviewedVersion: 5,
      selectedResearchVersion: 2,
    },
  ];
  const fingerprint = fingerprintInputCatalogLifecycleContext({ taxons });
  assert.match(fingerprint, /^[0-9a-f]{64}$/);
  assert.equal(
    fingerprintInputCatalogLifecycleContext({ taxons: [...taxons].reverse() }),
    fingerprint,
  );
  assert.notEqual(
    fingerprintInputCatalogLifecycleContext({
      taxons: taxons.map((taxon) =>
        taxon.identity.id === realEstateBrokerNicheTaxon.id
          ? { ...taxon, reviewedVersion: 6 }
          : taxon,
      ),
    }),
    fingerprint,
  );
  const snapshot = snapshotInputCatalogLifecycleContext({
    taxons: [...taxons].reverse(),
    unclosedReleaseTaxonIds: [realEstateBrokerNicheTaxon.id],
  });
  assert.deepEqual(snapshot.taxons.map((taxon) => taxon.identity.id),
    taxons.map((taxon) => taxon.identity.id).sort());
  assert.deepEqual(snapshot.unclosedReleaseTaxonIds, [realEstateBrokerNicheTaxon.id]);

  const withEvidence = planPublishedInputCatalogReviewReconciliation({
    currentVersion: 6,
    impacts: [{ taxonId: realEstateBrokerNicheTaxon.id, reviewedVersion: 5 }],
    validEvidenceTaxonIds: new Set([realEstateBrokerNicheTaxon.id]),
  });
  assert.deepEqual(withEvidence.taxonIdsToAdvance, [realEstateBrokerNicheTaxon.id]);

  const withoutEvidence = planPublishedInputCatalogReviewReconciliation({
    currentVersion: 6,
    impacts: [{ taxonId: realEstateBrokerNicheTaxon.id, reviewedVersion: 5 }],
    validEvidenceTaxonIds: new Set(),
  });
  assert.deepEqual(withoutEvidence.taxonIdsToAdvance, []);
}
