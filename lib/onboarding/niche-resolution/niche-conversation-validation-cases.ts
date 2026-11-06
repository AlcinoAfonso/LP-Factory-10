import assert from "node:assert/strict";
import nodeModule from "node:module";
import type { CommunicationBase } from "../../communication-base/contracts";
import { communicationSections } from "../../communication-base/registry";
import type { AttendanceContext } from "../pending-setup/attendance-core";
import type { ActivePrimaryAccountTaxon } from "./adapters/accountTaxonomyAdapter";

export async function validateNicheConversationActions() {
  const accountId = "10000000-0000-4000-8000-000000000001";
  const currentId = "10000000-0000-4000-8000-000000000002";
  const proposedId = "10000000-0000-4000-8000-000000000003";
  const originalTaxon: ActivePrimaryAccountTaxon = { taxonId: currentId, name: "Serviços", slug: "servicos", confirmed: true, confirmedAt: null, revision: "1" };
  let current: ActivePrimaryAccountTaxon | null = { ...originalTaxon };
  let products: boolean | null = false;
  let role = "owner";
  let status = "active";
  let gate = true;
  let summaryOk = true;
  let catalogOk = true;
  let baseOk = true;
  let providerOk = true;
  let afterProvider = () => {};
  const calls: AttendanceContext[] = [];
  const writes: unknown[] = [];
  const summary = JSON.stringify({ contextualUnderstanding: "Antes atendia em geral.", confirmedUnderstanding: null,
    classification: "Serviços", suggestions: [], pendingReason: null, whatsapp: "11999990000" });
  const base: CommunicationBase = { accountId, version: 1, createdAt: "t", updatedAt: "t", sections: {
    business_name: { format: "text", origin: "user_confirmed", value: "Empresa de jardins" },
    business_context: { format: "text", origin: "user_confirmed", value: "J".repeat(30000) },
    offers: { format: "text", origin: "user_confirmed", value: "Manutenção de jardins para condomínios." },
    preferences: { format: "text", origin: "user_confirmed", value: "Contato: qa@example.com." },
    about: { format: "text", origin: "user_reviewed", value: "Hipótese de copy, sem autoridade factual." },
  } };
  const snapshot = JSON.stringify({ base, summary });
  await validateNicheProjectionAdapter(base, accountId, currentId);
  const catalog = [
    { id: currentId, name: "Serviços", level: "segment", parentId: null, active: true, aliases: [] },
    { id: proposedId, name: "Jardinagem", level: "niche", parentId: currentId, active: true, aliases: [] },
  ];
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) {
    if (name === "server-only") return {};
    if (name === "next/cache") return { revalidatePath: () => {} };
    if (name.includes("getAccessContext")) return { getAccessContext: async ({ params }: { params: { account: string } }) =>
      params.account !== "qa-niche" ? null : { blocked: false, account: { id: accountId, status }, member: { role, status: "active", userId: accountId } } };
    if (name.includes("accountTaxonomyAdapter")) return {
      isAccountNicheEditingEnabled: () => gate,
      readActivePrimaryAccountTaxon: async () => ({ ok: true, taxon: current ? { ...current } : null }),
      readAccountNicheProductGuard: async () => products,
      confirmAccountNiche: async (input: { taxonId: string }) => {
        if (current && products && input.taxonId !== current.taxonId) return { ok: false, reason: "product_exists" };
        writes.push(input); return { ok: true };
      },
    };
    if (name.includes("pendingSetupAccountContextAdapter")) return { readAccountSummaryForNiche: async () => ({ ok: summaryOk, summary }) };
    if (name.includes("pendingSetupCatalogContextAdapter")) return { readAttendanceCatalog: async () => catalogOk ? catalog : null };
    if (name.includes("communicationBaseAdapter")) return { readBusinessContextForNiche: async (input: { accountId: string; actorUserId: string }) => {
      assert.deepEqual(input, { accountId, actorUserId: accountId });
      return { ok: baseOk, value: Object.fromEntries(["business_name", "business_context", "offers", "preferences"].map(key => [key, base.sections[key]!.value])) };
    } };
    if (name.includes("communicationCatalogAdapter")) return { readCommunicationDefinitions: async () => ({ ok: true, value: communicationSections }) };
    if (name.includes("accountNicheResolutionUserAdapter")) return {};
    if (name.includes("attendance-provider")) return { requestAttendance: async (input: { context: AttendanceContext }) => {
      calls.push(input.context); afterProvider();
      return providerOk ? { ok: true, output: { reply: "Jardinagem corresponde à atividade atual. Confirma?", action: "existing",
        existingTaxonId: proposedId, businessUnderstanding: "Jardins para condomínios." } } : { ok: false };
    } };
    return original.call(this, name, parent, isMain);
  };
  const actions = await import("../../../app/a/[account]/niche-resolution-actions").finally(() => { loader._load = original; });
  const turn = { account: "qa-niche", expectedTaxonId: currentId, understanding: "",
    messages: [{ role: "user" as const, content: "Agora ofereço jardinagem." }] };
  const initial = await actions.converseAccountNicheAction({ ...turn, messages: [] });
  assert.equal(initial.ok, true); assert.equal(calls.length, 1); assert.equal(writes.length, 0);
  assert.equal(calls[0].purpose, "account_niche"); assert.equal(calls[0].currentPrimaryTaxonId, currentId);
  assert.equal(calls[0].businessData?.business_context.length, 30000, "do not silently truncate stored business context");
  assert.match(calls[0].summary ?? "", /Antes atendia/);
  assert.equal((calls[0].summary ?? "").includes("11999990000"), false);
  assert.equal(calls[0].businessData?.preferences.includes("qa@example.com"), false);
  assert.equal("about" in calls[0].businessData!, false, "copy hypotheses must not become business facts");
  assert.equal((await actions.converseAccountNicheAction(turn)).ok, true);
  assert.equal(calls.at(-1)?.recent.at(-1)?.content, turn.messages[0].content);
  for (const invalid of [{ ...turn, expectedTaxonId: proposedId }, { ...turn, account: "another-account" },
    { ...turn, messages: [{ role: "user" as const, content: "x".repeat(4001) }] }]) {
    const count: number = calls.length; assert.equal((await actions.converseAccountNicheAction(invalid)).ok, false); assert.equal(calls.length, count);
  }
  for (const failure of ["products", "summary", "catalog", "base", "role", "pending", "gate", "guard"]) {
    products = failure === "products" ? true : failure === "guard" ? null : false;
    summaryOk = failure !== "summary"; catalogOk = failure !== "catalog"; baseOk = failure !== "base";
    role = failure === "role" ? "viewer" : "owner"; status = failure === "pending" ? "pending_setup" : "active"; gate = failure !== "gate";
    const count: number = calls.length; assert.equal((await actions.converseAccountNicheAction(turn)).ok, false, failure); assert.equal(calls.length, count, failure);
  }
  products = false; summaryOk = true; catalogOk = true; baseOk = true; role = "owner"; status = "active"; gate = true;
  providerOk = false; assert.equal((await actions.converseAccountNicheAction(turn)).ok, false); providerOk = true;
  afterProvider = () => { role = "viewer"; };
  assert.equal((await actions.converseAccountNicheAction(turn)).ok, false); role = "owner";
  afterProvider = () => { current = { ...originalTaxon, revision: "2" }; };
  assert.equal((await actions.converseAccountNicheAction(turn)).ok, false); current = { ...originalTaxon }; afterProvider = () => {};
  current = null; products = true;
  assert.equal((await actions.converseAccountNicheAction({ ...turn, expectedTaxonId: null })).ok, true, "initial definition is allowed even with a product");
  current = { ...originalTaxon }; products = false;
  const save = { account: "qa-niche", taxonId: proposedId, expectedTaxonId: currentId, confirmed: true };
  assert.equal((await actions.saveAccountNicheAction({ ...save, confirmed: false })).ok, false);
  assert.equal((await actions.saveAccountNicheAction({ ...save, taxonId: accountId })).ok, false);
  products = true; assert.equal((await actions.saveAccountNicheAction(save)).ok, false); products = false;
  assert.equal(writes.length, 0); assert.equal((await actions.saveAccountNicheAction(save)).ok, true); assert.equal(writes.length, 1);
  assert.deepEqual(writes[0], { accountId, actorUserId: accountId, taxonId: proposedId, expectedTaxonId: currentId });
  assert.equal(JSON.stringify({ base, summary }), snapshot, "conversation and confirmation never update Base or Summary");
  console.log("D14D niche conversation: existing agent/context, long text, roles, no products, read failures, concurrency and explicit confirmation passed.");
}

async function validateNicheProjectionAdapter(base: CommunicationBase, accountId: string, anotherUser: string) {
  let entitlement = "expired";
  let memberRole = "owner";
  let memberActive = true;
  let accountActive = true;
  let failedRead = false;
  let baseReads = 0;
  const selections: string[] = [];
  const projected: Record<string, unknown> = Object.fromEntries(["business_name", "business_context", "offers", "preferences"].map(key => [key, base.sections[key]]));
  function client(service: boolean) {
    return { from(table: string) {
      const filters: Record<string, unknown> = {};
      return {
        select(columns: string) { selections.push(columns); return this; },
        eq(key: string, value: unknown) { filters[key] = value; return this; },
        in(key: string, value: unknown) { filters[key] = value; return this; },
        limit() { return this; },
        async maybeSingle() {
          if (failedRead) return { data: null, error: { code: "read_failed" } };
          if (table === "account_users") {
            assert.equal(service, true); assert.equal(filters["accounts.status"], "active"); assert.equal(filters.status, "active");
            assert.deepEqual(filters.role, ["owner", "admin", "editor"]);
            const allowed = filters.account_id === accountId && filters.user_id === accountId &&
              memberActive && accountActive && ["owner", "admin", "editor"].includes(memberRole);
            return { data: allowed ? { account_id: accountId } : null, error: null };
          }
          assert.equal(table, "account_communication_bases"); assert.equal(filters.account_id, accountId); baseReads++;
          return { data: service ? projected : entitlement !== "active" ? null : {
            account_id: accountId, version: base.version, sections_json: base.sections, created_at: base.createdAt, updated_at: base.updatedAt,
          }, error: null };
        },
      };
    } };
  }
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) {
    if (name === "server-only") return {};
    if (name === "@/lib/supabase/service") return { createServiceClient: () => client(true) };
    if (name === "@/lib/supabase/server") return { createClient: async () => client(false) };
    return original.call(this, name, parent, isMain);
  };
  const adapter = await import("../../communication-base/adapters/communicationBaseAdapter").finally(() => { loader._load = original; });
  for (const state of ["expired", "canceled"]) {
    entitlement = state;
    assert.deepEqual(await adapter.readCommunicationBase(accountId), { ok: true, value: null }, "direct Base access still follows commercial RLS");
    const read = await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId });
    assert.equal(read.ok, true); if (!read.ok) throw Error("projection unavailable");
    assert.equal(read.value.business_context.length, 30000); assert.equal(read.value.offers, base.sections.offers!.value);
    assert.equal("about" in read.value, false); assert.equal("facts" in read.value, false);
    assert.equal(selections.at(-1), "business_name:sections_json->business_name,business_context:sections_json->business_context,offers:sections_json->offers,preferences:sections_json->preferences");
  }
  entitlement = "active";
  assert.equal((await adapter.readCommunicationBase(accountId)).ok, true);
  for (const role of ["owner", "admin", "editor"]) { memberRole = role;
    assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, true); }
  memberRole = "viewer"; const count = baseReads;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false); assert.equal(baseReads, count);
  memberRole = "owner"; memberActive = false;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false);
  memberActive = true; accountActive = false;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false);
  accountActive = true;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: anotherUser })).ok, false);
  failedRead = true;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false);
  failedRead = false; projected.offers = { format: "text", origin: "ai_generated", value: "Unconfirmed" };
  const unconfirmed = await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId });
  assert.equal(unconfirmed.ok && "offers" in unconfirmed.value, false);
  projected.offers = { format: "text", origin: "user_confirmed", value: [] };
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false);
  console.log("D14D niche projection: expired/canceled entitlement preserves context; direct Base RLS, narrow fields and active membership/roles preserved.");
}
