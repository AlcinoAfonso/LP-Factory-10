import assert from "node:assert/strict";
import nodeModule from "node:module";
import { z } from "zod";
import type { CommunicationBase } from "../../communication-base/contracts";
import type { NicheContext } from "../niche-agent/runtime";
import { presentOffer } from "../niche-agent/dialogue";
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
  const commits: { proposal: string | null; summary: string | null; acceptedProposal?: string | null; keepProposal?: boolean }[] = [];
  let liveProposal: string | null = null;
  let liveSynthesis: { start: number; length: number; messageId: string } | null = null;
  let liveMessages: { id: string; role: "user" | "assistant"; content: string }[] = [];
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
      readNicheInterlocutorName: async () => "Armando",
      claimNicheConversation: async () => { claims++; return products && niche.confirmed && !replay ? null : { replay, version: 1,
        state: { official: { description: stale ? "Outro nicho" : niche.name, legacyTaxonId: taxonId, legacyUpdatedAt: revision },
          proposal: liveProposal, synthesis: liveSynthesis },
        summary: null, summaryUpdatedAt: revision }; },
      readNicheDialogueMessages: async () => liveMessages,
      commitNicheConversation: async (input: typeof commits[number]) => { commits.push(input); return true; },
      releaseAccountNicheTurn: async () => { releases++; return true; },
    };
    if (name.includes("communicationBaseAdapter")) return { readBusinessContextForNiche: async () =>
      ({ ok: true, value: { business_name: "Jardins do Vale", offers: "Jardinagem para condomínios." } }) };
    if (name.includes("accountNicheResolutionUserAdapter")) return {};
    if (name.includes("niche-agent/runtime")) return {
      conversationalMessage: z.strictObject({ account: z.string(), dialogueId: z.uuid().nullable(),
        version: z.number(), requestId: z.uuid(), content: z.string().min(1).max(4000) }),
      requestNicheAgent: async (_account: string, _dialogue: string, context: NicheContext) => {
        contexts.push(context);
        if (!provider) return null;
        if (context.message === "Maneiro, é isso aí.") return { reply: "Entendi.", offer: null, summary: null,
          preferredName: null, searchTopic: null, synthesis: {
            offer: null, accept: context.displayed?.id ?? null, clear: false, nicheReaction: "accept" as const } };
        if (context.message === "Quero abandonar essa proposta.") return { reply: "Vamos reconsiderar.", offer: null, summary: null,
          preferredName: null, searchTopic: null, synthesis: {
            offer: null, accept: null, clear: true, nicheReaction: "clear" as const } };
        if (context.fixedNiche) {
          const offer = { summary: "A descrição vigente é " + context.fixedNiche + ".", niche: context.fixedNiche, publicName: null };
          const shown = presentOffer(offer);
          return shown ? { reply: shown.reply, offer, summary: null, preferredName: null, searchTopic: null,
            synthesis: { offer: shown.range, accept: null, clear: false, nicheReaction: "continue" } } : null;
        }
        return { reply: "Vamos conferir o público.", offer: null, summary: null, preferredName: null, searchTopic: null,
          synthesis: { offer: null, accept: null, clear: false, nicheReaction: "continue" } };
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
  const baseState = await actions.loadBaseNicheConversationAction(turn.account);
  assert.equal(baseState?.interlocutorName, "Armando");
  assert.equal(baseState?.nicheName, "Jardinagem");
  assert.equal((await actions.converseBaseNicheAction(turn)).ok, true);
  assert.equal(contexts[0].interlocutorName, "Armando");
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
  replay = true;
  assert.equal((await actions.converseHomeNicheAction(turn)).ok, true, "product guard allows an exact replay of a committed turn");
  replay = false;
  niche = { ...niche, confirmed: false };
  assert.equal((await actions.converseBaseNicheAction(turn)).ok, false);
  const home = await actions.loadHomeNicheConversationAction(turn.account);
  assert.equal(home?.existingOnly, true);
  assert.equal((await actions.converseHomeNicheAction(turn)).ok, true);
  assert.equal(commits.at(-1)?.proposal, niche.name);
  stale = true;
  assert.equal((await actions.converseHomeNicheAction(turn)).ok, false);
  assert.equal(releases, 2);

  // Follow the same displayed offer through clarification, assent and explicit withdrawal.
  stale = false; products = false; niche = { ...niche, confirmed: true };
  const offer = { summary: "Cuidamos de jardins para condomínios.", niche: "Jardinagem para condomínios", publicName: null };
  const rendered = presentOffer(offer);
  assert.ok(rendered);
  const displayedId = crypto.randomUUID();
  liveProposal = offer.niche;
  liveSynthesis = { ...rendered.range, messageId: displayedId };
  liveMessages = [{ id: displayedId, role: "assistant", content: rendered.reply }];
  assert.equal((await actions.converseBaseNicheAction({ ...turn, requestId: crypto.randomUUID(), content: "Pode explicar o público?" })).ok, true);
  assert.equal(contexts.at(-1)?.displayed?.id, displayedId);
  assert.equal(commits.at(-1)?.keepProposal, true);
  liveMessages.push({ id: crypto.randomUUID(), role: "assistant", content: commits.at(-1)?.summary ?? "Os condomínios são o público principal." });
  assert.equal((await actions.converseBaseNicheAction({ ...turn, requestId: crypto.randomUUID(), content: "Maneiro, é isso aí." })).ok, true);
  assert.equal(contexts.at(-1)?.displayed?.id, displayedId);
  assert.equal(commits.at(-1)?.acceptedProposal, offer.niche);
  assert.equal(commits.at(-1)?.keepProposal, false);
  assert.equal((await actions.converseBaseNicheAction({ ...turn, requestId: crypto.randomUUID(), content: "Quero abandonar essa proposta." })).ok, true);
  assert.equal(commits.at(-1)?.keepProposal, false);
  assert.equal(commits.at(-1)?.proposal, null);
}

export async function validateNicheInterlocutorIdentity() {
  const accountId = crypto.randomUUID(), ownerId = crypto.randomUUID(), memberId = crypto.randomUUID();
  let actorId = ownerId, storedName: string | null = "Armando", declined = false, failed = false;
  let metadata: Record<string, unknown> = { name: "Nome do perfil" };
  let filters: Record<string, string> = {};
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) {
    if (name === "server-only") return {};
    if (name === "@/lib/supabase/server") return { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: actorId, email: "qa@example.com", user_metadata: metadata } }, error: null }) },
    }) };
    if (name === "@/lib/supabase/service") return { createServiceClient: () => ({
      from: (table: string) => {
        assert.equal(table, "account_pending_setup_conversations");
        const query: Record<string, string> = {};
        const builder = {
          select: (columns: string) => { assert.equal(columns, "preferred_name,preferred_name_declined"); return builder; },
          eq: (key: string, value: string) => { query[key] = value; return builder; },
          maybeSingle: async () => {
            filters = { ...query };
            return { data: !failed && query.account_id === accountId && query.user_id === ownerId &&
              query.stage === "completed" ? { preferred_name: storedName, preferred_name_declined: declined } : null,
              error: failed ? { code: "read_failed" } : null };
          },
        };
        return builder;
      },
    }) };
    if (name.includes("openai-costs/recorder")) return { closeOpenAiNicheDialogueOccurrence: async () => {} };
    if (name.includes("niche-agent/runtime")) return { dialogueState: z.object({}), turnText: z.object({
      role: z.string(), content: z.string(),
    }) };
    return original.call(this, name, parent, isMain);
  };
  const adapter = await import("./adapters/accountNicheDialogueAdapter").finally(() => { loader._load = original; });
  assert.equal(await adapter.readNicheInterlocutorName(accountId, ownerId), "Armando");
  assert.deepEqual(filters, { account_id: accountId, user_id: ownerId, stage: "completed" });
  declined = true;
  assert.equal(await adapter.readNicheInterlocutorName(accountId, ownerId), null, "explicit refusal overrides profile");
  declined = false; storedName = null; metadata = { full_name: "Nome do perfil" };
  assert.equal(await adapter.readNicheInterlocutorName(accountId, ownerId), "Nome do perfil");
  actorId = memberId; metadata = { preferred_name: "Marta" };
  assert.equal(await adapter.readNicheInterlocutorName(accountId, memberId), "Marta", "another member uses their own identity");
  assert.equal(await adapter.readNicheInterlocutorName(accountId, ownerId), null, "authentication mismatch denies name");
  failed = true;
  assert.equal(await adapter.readNicheInterlocutorName(accountId, memberId), null, "failed lookup omits name");
}

export async function validatePendingConfirmedName() {
  const accountId = crypto.randomUUID(), dialogueId = crypto.randomUUID(), assistantId = crypto.randomUUID();
  const version = 3;
  const acceptedName = "Jardins do Vale";
  const proposed = { summary: "Cuida de jardins de condomínios.", niche: "Jardinagem para condomínios", publicName: null };
  let state: Record<string, unknown> = { acceptedName };
  let proposal: unknown = null;
  let stage = "business_understanding";
  const completions: { whatsapp?: string | null }[] = [];
  let messages: { id: string; role: "assistant"; content: string }[] = [];
  const commits: { nameReaction: string; reply: string; proposal: unknown; synthesis: { offer: object | null }; stage: string }[] = [];
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) {
    if (name === "server-only") return {};
    if (name.includes("accountNicheResolutionUserAdapter")) return { getConfirmedOperationalNicheResolutionLabel: async () => null };
    if (name === "next/cache") return { revalidatePath: () => {} };
    if (name.includes("getAccessContext")) return { getAccessContext: async () =>
      ({ account: { id: accountId, status: "pending_setup" }, member: { role: "owner", status: "active", userId: accountId } }) };
    if (name.includes("accountOfficialNicheAdapter")) return {
      readAccountOfficialNiche: async () => ({ ok: true, niche: null }),
      getAccountOfficialNiche: async () => ({ confirmed: true }),
    };
    if (name.includes("accountTaxonomyAdapter")) return { readActivePrimaryAccountTaxon: async () => ({ ok: true, taxon: null }) };
    if (name.includes("pending-setup/config")) return { isE1011PassageEnabled: () => true, isE1012AttendanceEnabled: () => true };
    if (name.includes("pendingSetupConversationAdapter")) return {
      claimPendingNicheTurn: async () => ({ version, replay: false }),
      loadPendingSetupConversation: async () => ({ id: dialogueId, version, stage,
        businessDisplayName: stage === "ready_to_complete" ? acceptedName : null,
        accountContext: { summary: null, updatedAt: "1" },
        dialogueState: state, attendanceProposal: proposal, messages }),
      commitPendingNicheTurn: async (input: typeof commits[number]) => { commits.push(input); return true; },
      completePendingSetup: async (input: typeof completions[number]) => { completions.push(input); return { ok: true }; },
    };
    if (name.includes("niche-agent/runtime")) return {
      conversationalMessage: z.object({ account: z.string(), dialogueId: z.uuid(), version: z.number(), requestId: z.uuid(), content: z.string() }),
      requestNicheAgent: async (_account: string, _dialogue: string, context: NicheContext) => {
        if (context.message === "Pode explicar o nicho?") return { reply: "É a atividade principal e o público atendido.", offer: null,
          summary: null, preferredName: null, searchTopic: null,
          synthesis: { offer: null, accept: null, clear: false, nicheReaction: "continue" as const } };
        if (context.message === "Sim.") {
          return { reply: "Recebi sua confirmação.", offer: null,
            summary: JSON.stringify({ confirmedUnderstanding: proposed.summary }), preferredName: null, searchTopic: null,
            synthesis: { offer: null, accept: context.displayed?.id ?? null, clear: false, nicheReaction: "accept" as const } };
        }
        const shown = presentOffer(proposed);
        return shown ? { reply: shown.reply, offer: proposed, summary: null, preferredName: null, searchTopic: null,
          synthesis: { offer: shown.range, accept: null, clear: false, nicheReaction: "continue" as const } } : null;
      },
    };
    return original.call(this, name, parent, isMain);
  };
  const action = await import("../../../app/a/[account]/pending-setup-actions").finally(() => { loader._load = original; });
  const turn = { account: "qa-niche", dialogueId, requestId: crypto.randomUUID(), version, content: "Cuido de jardins, principalmente de condomínios." };
  assert.equal((await action.conversePendingSetupAction(turn)).ok, true);
  assert.equal(commits[0].nameReaction, "keep");
  proposal = commits[0].proposal;
  state = { acceptedName, synthesis: { ...commits[0].synthesis.offer, messageId: assistantId } };
  messages = [{ id: assistantId, role: "assistant", content: commits[0].reply }];
  assert.equal((await action.conversePendingSetupAction({ ...turn, requestId: crypto.randomUUID(), content: "Pode explicar o nicho?" })).ok, true);
  assert.equal(commits[1].stage, "niche_confirmation");
  assert.deepEqual(commits[1].proposal, proposal);
  messages.push({ id: crypto.randomUUID(), role: "assistant", content: commits[1].reply });
  assert.equal((await action.conversePendingSetupAction({ ...turn, requestId: crypto.randomUUID(), content: "Sim." })).ok, true);
  assert.equal(commits[2].stage, "ready_to_complete");
  assert.equal(commits[2].nameReaction, "keep");
  stage = "ready_to_complete";
  const complete = (phone?: string) => {
    const form = new FormData();
    form.set("account_subdomain", "qa-niche");
    form.set("conversation_id", dialogueId);
    form.set("expected_version", String(version));
    if (phone !== undefined) form.set("whatsapp_contact", phone);
    return action.completePendingSetupAction({ ok: true }, form);
  };
  assert.equal((await complete("(21) 99999-9876")).ok, true);
  assert.equal(completions.at(-1)?.whatsapp, "(21) 99999-9876");
  assert.equal((await complete()).ok, true);
  assert.equal(completions.at(-1)?.whatsapp, null);
  assert.equal((await complete("(21) 99")).ok, true, "incomplete number must not prevent completion");
  assert.equal(completions.at(-1)?.whatsapp, null);
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
