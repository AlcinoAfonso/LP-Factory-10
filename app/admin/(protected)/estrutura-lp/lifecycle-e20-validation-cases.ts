import assert from "node:assert/strict";

import { collectCompletePaginatedRows } from "../../../../lib/admin/adapters/adminInputCatalogLifecyclePagination";
import {
  fingerprintInputCatalogLifecycleContext,
  matchesInputCatalogLifecycleConfirmation,
} from "../../../../lib/admin/adapters/adminInputCatalogLifecycleValidation";
import {
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
} from "../../../../lib/conversion-content/landing-page/input-catalog";

export async function validateLifecycleE20Contracts(): Promise<void> {
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
    { identity: realEstateSegmentTaxon },
    { identity: realEstateBrokerNicheTaxon },
  ];
  const fingerprint = fingerprintInputCatalogLifecycleContext({ taxons });
  assert.match(fingerprint, /^[0-9a-f]{64}$/);
  assert.equal(
    fingerprintInputCatalogLifecycleContext({ taxons: [...taxons].reverse() }),
    fingerprint,
  );
  assert.equal(
    fingerprintInputCatalogLifecycleContext({
      taxons: taxons.map((taxon) =>
        taxon.identity.id === realEstateBrokerNicheTaxon.id
          ? { identity: { ...taxon.identity, isActive: !taxon.identity.isActive } }
          : taxon,
      ),
    }),
    fingerprint,
  );
  assert.notEqual(
    fingerprintInputCatalogLifecycleContext({
      taxons: taxons.map((taxon) =>
        taxon.identity.id === realEstateBrokerNicheTaxon.id
          ? { identity: { ...taxon.identity, name: "Corretores de imóveis" } }
          : taxon,
      ),
    }),
    fingerprint,
  );

  const contentFingerprint = "a".repeat(64);
  assert.equal(matchesInputCatalogLifecycleConfirmation({
    expectedRevision: 3,
    expectedContentFingerprint: contentFingerprint,
    expectedLifecycleContextFingerprint: fingerprint,
    currentRevision: 3,
    currentContentFingerprint: contentFingerprint,
    currentLifecycleContextFingerprint: fingerprint,
  }), true);
  assert.equal(matchesInputCatalogLifecycleConfirmation({
    expectedRevision: 3,
    expectedContentFingerprint: contentFingerprint,
    expectedLifecycleContextFingerprint: fingerprint,
    currentRevision: 3,
    currentContentFingerprint: contentFingerprint,
    currentLifecycleContextFingerprint: "b".repeat(64),
  }), false, "A change in ancestry reach must stale confirmation even when revision and content are unchanged");
}
