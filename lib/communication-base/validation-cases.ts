import assert from "node:assert/strict";

import { communicationSections, getCommunicationSection } from "./registry";
import { resolveCommunicationBaseAccess, type CommunicationBaseAccessDependencies } from "./access-policy";
import { parseSectionValue, projectCommunicationBase, withSection } from "./policy";

const keys = communicationSections.map((section) => section.key);
assert.equal(new Set(keys).size, keys.length, "section keys must be unique");
assert.equal(communicationSections.filter((section) => section.stage === 1).length, 7);
assert.equal(communicationSections.filter((section) => section.stage === 2).length, 7);

const business = getCommunicationSection("business_context");
const audience = getCommunicationSection("audience");
const faq = getCommunicationSection("faq");
assert.ok(business && audience && faq);
assert.equal(parseSectionValue(business, "  Atuo em Recife.  "), "Atuo em Recife.");
assert.equal(parseSectionValue(business, "x".repeat(4001)), null);
assert.equal(parseSectionValue(faq, [{ question: "Quem atende?", answer: "" }]), null);

const future = { future_section: { format: "text", value: "Preservar", origin: "user_confirmed" } };
const initial = withSection(future, "business_context", "Consultoria", "pending_setup_confirmed");
assert.ok(initial);
assert.deepEqual(initial.future_section, future.future_section);
assert.equal(withSection(initial, "offers", ["Oferta"], "pending_setup_confirmed"), null);
assert.equal(withSection(initial, "audience", "Público", "user_confirmed"), null);

const evolved = withSection(initial, "audience", "Público em Recife", "user_reviewed");
assert.ok(evolved);
assert.deepEqual(evolved.future_section, future.future_section);
assert.deepEqual(evolved.business_context, initial.business_context);

const projected = projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001",
  version: 3,
  sections_json: evolved,
  created_at: "2026-09-27T00:00:00Z",
  updated_at: "2026-09-27T00:00:00Z",
});
assert.ok(projected);
assert.equal(projected.sections.business_context?.origin, "pending_setup_confirmed");
assert.equal(projected.sections.audience?.origin, "user_reviewed");
assert.equal("future_section" in projected.sections, false);
assert.equal(projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001",
  version: 3,
  sections_json: { ...evolved, audience: { format: "text", value: "Público", origin: "user_confirmed" } },
  created_at: "2026-09-27T00:00:00Z",
  updated_at: "2026-09-27T00:00:00Z",
}), null, "stored stage 2 provenance must be rejected");
assert.equal(projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001",
  version: 3,
  sections_json: { ...evolved, offers: { format: "items", value: ["Oferta"], origin: "pending_setup_confirmed" } },
  created_at: "2026-09-27T00:00:00Z",
  updated_at: "2026-09-27T00:00:00Z",
}), null, "Pending Setup provenance applies only to business context");
assert.equal(projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001",
  version: 0,
  sections_json: evolved,
  created_at: "2026-09-27T00:00:00Z",
  updated_at: "2026-09-27T00:00:00Z",
}), null);

async function runAccessCases() {
  const validAccess = {
    blocked: false,
    account: { id: "00000000-0000-4000-8000-000000000001", status: "active" },
    member: { role: "owner", status: "active" },
  };
  type AccessSnapshot = Awaited<ReturnType<CommunicationBaseAccessDependencies["loadAccess"]>>;
  type EntitlementSnapshot = Awaited<ReturnType<CommunicationBaseAccessDependencies["readEntitlement"]>>;
  const eligible: EntitlementSnapshot = { ok: true, signal: { isCommerciallyEligible: true } };
  async function decideAccess(
    access: AccessSnapshot,
    entitlement: EntitlementSnapshot = eligible,
    requireEdit = false,
  ) {
    return resolveCommunicationBaseAccess("  EMPRESA  ", requireEdit, {
      enabled: true,
      loadAccess: async () => access,
      readEntitlement: async () => entitlement,
    });
  }

  let accessReads = 0;
  let entitlementReads = 0;
  const countingDependencies: CommunicationBaseAccessDependencies = {
    enabled: false,
    loadAccess: async () => { accessReads++; return validAccess; },
    readEntitlement: async () => { entitlementReads++; return eligible; },
  };
  assert.deepEqual(await resolveCommunicationBaseAccess("empresa", true, countingDependencies),
    { ok: false, error: "unavailable" });
  assert.equal(accessReads, 0, "disabled gate must not read account data");
  assert.equal(entitlementReads, 0, "disabled gate must not read entitlement");
  assert.deepEqual(await resolveCommunicationBaseAccess("../other", true,
    { ...countingDependencies, enabled: true }), { ok: false, error: "forbidden" });
  assert.equal(accessReads, 0, "invalid account path must not load access");

  assert.deepEqual(await decideAccess(validAccess, eligible, true), { ok: true, value: {
    accountId: validAccess.account.id,
    accountSubdomain: "empresa",
    role: "owner",
    canEdit: true,
  } });
  for (const role of ["admin", "editor"] as const) {
    const result = await decideAccess({ ...validAccess, member: { role, status: "active" } }, eligible, true);
    assert.equal(result.ok, true, `${role} should edit`);
  }
  const viewer = { ...validAccess, member: { role: "viewer", status: "active" } };
  assert.equal((await decideAccess(viewer)).ok, true, "viewer should read");
  assert.deepEqual(await decideAccess(viewer, eligible, true), { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess(null), { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess({ ...validAccess, blocked: true }), { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess({ ...validAccess, account: { ...validAccess.account, status: "inactive" } }),
    { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess({ ...validAccess, member: { role: "owner", status: "inactive" } }),
    { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess({ ...validAccess, member: { role: "unknown", status: "active" } }),
    { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess(validAccess, { ok: true, signal: { isCommerciallyEligible: false } }),
    { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess(validAccess, { ok: false }), { ok: false, error: "read_failed" });
  assert.deepEqual(await resolveCommunicationBaseAccess("empresa", true, {
    enabled: true,
    loadAccess: async () => { throw new Error("access read failed"); },
    readEntitlement: async () => eligible,
  }), { ok: false, error: "read_failed" });
  assert.deepEqual(await resolveCommunicationBaseAccess("empresa", true, {
    enabled: true,
    loadAccess: async () => validAccess,
    readEntitlement: async () => { throw new Error("entitlement read failed"); },
  }), { ok: false, error: "read_failed" });
}

runAccessCases().then(
  () => console.log("communication-base validation cases: ok"),
  (error: unknown) => { console.error(error); process.exitCode = 1; },
);