import assert from "node:assert/strict";
import nodeModule from "node:module";
import { z } from "zod";
import type { CommunicationBase } from "../../communication-base/contracts";
import { fixedNicheTurn, type NicheContext } from "../niche-agent";
import type { OfficialAccountNiche } from "./official-niche-policy";

export async function validateNicheConversationActions() {
  const accountId = crypto.randomUUID(), dialogueId = crypto.randomUUID(), taxonId = crypto.randomUUID();
  const base: CommunicationBase = { accountId, version: 1, createdAt: "t", updatedAt: "t", sections: {
    business_name: { format: "text", origin: "user_confirmed", value: "Jardins do Vale" },
    business_context: { format: "text", origin: "user_confirmed", value: "J".repeat(30000) },
    offers: { format: "text", origin: "user_confirmed", value: "Jardinagem para condomínios." },
    preferences: { format: "text", origin: "user_confirmed", value: "Horário flexível." },
  } };
  await validateNicheProjectionAdapter(base, accountId, dialogueId);
  const revision = "2026-11-21T12:00:00+00:00";
  let niche: OfficialAccountNiche = { name: "Jardinagem", taxonId, revision: "legacy:" + taxonId + ":" + revision,
    textRevision: 0, legacyUpdatedAt: revision, confirmed: true, confirmedAt: null, confirmedBy: null };
  let role = "owner", products = false, enabled = true, provider = true, stale = false, replay = false;
  let claims = 0, releases = 0;
  const contexts: NicheContext[] = [];
  const commits: { proposal: string | null; summary: string | null }[] = [];
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) {
    if (name === "server-only") return {};
    if (name === "next/cache") return { revalidatePath: () => {} };
    if (name.includes("getAccessContext")) return { getAccessContext: async () =>
      ({ account: { id: accountId, status: "active" }, member: { role, status: "active", userId: accountId } }) };
    if (name.includes("accountOfficialNicheAdapter")) return { readAccountOfficialNiche: async () => ({ ok: true, niche }) };
    if (name.includes("accountTaxonomyAdapter")) return { isAccountNicheEditingEnabled: () => enabled, readAccountNicheProductGuard: async () => products };
    if (name.includes("accountNicheDialogueAdapter")) return {
      readNicheConversation: async () => ({ ok: true, dialogue: null }),
      claimNicheConversation: async () => { claims++; return { replay, version: 1,
        state: { official: { description: stale ? "Outro nicho" : niche.name, legacyTaxonId: taxonId, legacyUpdatedAt: revision } },
        summary: null, summaryUpdatedAt: revision }; },
      readNicheDialogueMessages: async () => [],
      commitNicheConversation: async (input: typeof commits[number]) => { commits.push(input); return true; },
      releaseAccountNicheTurn: async () => { releases++; return true; },
    };
    if (name.includes("communicationBaseAdapter")) return { readBusinessContextForNiche: async () =>
      ({ ok: true, value: { business_name: "Jardins do Vale", offers: "Jardinagem para condomínios." } }) };
    if (name.includes("accountNicheResolutionUserAdapter")) return {};
    if (name.includes("niche-agent/runtime")) return {
      conversationalMessage: z.strictObject({ account: z.string(), dialogueId: z.uuid().nullable(),
        version: z.number(), requestId: z.uuid(), content: z.string().min(1).max(4000) }),
      requestNicheAgent: async (_account: string, _dialogue: string, context: NicheContext, prior: string | null) => {
        contexts.push(context);
        return provider ? context.fixedNiche ? fixedNicheTurn(context, prior) : {
          reply: "Vamos conferir o público.", offer: null, summary: null, synthesis: { accept: null },
        } : null;
      },
    };
    return original.call(this, name, parent, isMain);
  };
  const actions = await import("../../../app/a/[account]/niche-resolution-actions").finally(() => { loader._load = original; });
  const turn = { account: "qa-niche", dialogueId, requestId: crypto.randomUUID(), version: 0, content: "Agora atendemos condomínios." };
  role = "viewer";
  assert.equal((await actions.converseBaseNicheAction(turn)).ok, false);
  assert.equal(claims, 0);
  role = "owner";
  enabled = false;
  assert.equal((await actions.converseHomeNicheAction(turn)).ok, false);
  assert.equal(claims, 0);
  enabled = true;
  assert.equal((await actions.converseBaseNicheAction(turn)).ok, true);
  assert.match(contexts[0].businessContext ?? "", /Jardinagem para condomínios/u);
  assert.equal(commits[0].summary, null);
  provider = false;
  const failed = await actions.converseBaseNicheAction(turn);
  assert.equal(failed.ok, false);
  assert.match(!failed.ok ? failed.message : "", /mensagem foi registrada/i);
  assert.equal(releases, 1);
  provider = true;
  replay = true;
  assert.equal((await actions.converseBaseNicheAction(turn)).ok, true);
  assert.equal(commits.length, 1, "replay does not write again");

  replay = false;
  products = true;
  assert.equal((await actions.converseHomeNicheAction(turn)).ok, false);
  niche = { ...niche, confirmed: false };
  assert.equal((await actions.converseBaseNicheAction(turn)).ok, false);
  const home = await actions.loadHomeNicheConversationAction(turn.account);
  assert.equal(home?.existingOnly, true);
  assert.equal((await actions.converseHomeNicheAction(turn)).ok, true);
  assert.equal(commits.at(-1)?.proposal, niche.name);
  stale = true;
  assert.equal((await actions.converseHomeNicheAction(turn)).ok, false);
  assert.equal(releases, 2);
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
