import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import nodeModule from "node:module";
import { communicationSections } from "../communication-base/registry";
import type { AgentBasePilotSection } from "../communication-base/agent-base/pilot";
import type { AttendanceContext } from "../onboarding/pending-setup/attendance-core";
import { COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS } from "../conversion-content/contracts";
import { listOpenAiWorkloadInventory } from "../openai-workloads";
import { clientOpenAiCostContext } from "./active-contracts";
import { resolveOpenAiOccurrenceId } from "./recorder";
import { OPENAI_COST_INGESTION_PROTOCOL_VERSION } from "./ingestion";

export async function validateOccurrenceIntegrations() {
  const accountId = "10000000-0000-4000-8000-000000000001";
  const dialogueId = "10000000-0000-4000-8000-000000000002";
  const otherDialogue = "10000000-0000-4000-8000-000000000003";
  const executionId = "10000000-0000-4000-8000-000000000004";
  const inspectId = "10000000-0000-4000-8000-000000000005";
  const secret = "test-only";
  const definitions = communicationSections;
  const changes = {
    OPENAI_ACTIVE_COST_TRACKING_ENABLED: "true", VERCEL_ENV: "preview",
    E25_3_COMMUNICATION_RESOURCES_ENABLED: "true", OPENAI_API_KEY: secret,
    OPENAI_COST_INGESTION_ENABLED: "true", OPENAI_COST_INGESTION_ENVIRONMENT: "preview",
    OPENAI_COST_INGESTION_HMAC_SECRET: secret,
  };
  const prior = Object.fromEntries(Object.keys(changes).map(key => [key, process.env[key]]));
  Object.assign(process.env, changes);

  let commit: { data: unknown; error: unknown } = { data: null, error: null };
  let closureFails = false;
  let inspectExecutionExists = true;
  let foreignWorkloadExists = false;
  let version = 1;
  let sectionUnavailable = false;
  let saveOutcome = "uncertain";
  const accepted = new Set<string>();
  const closed = new Set<string>();
  const generationCalls: string[] = [];
  const closeCalls: Record<string, unknown>[] = [];
  const proofTurns = new Map<string, number>();
  const draftEvents: string[] = [];
  const draftIds: string[] = [];
  let artifactAttempt = 0;
  let draftProviderFails = false;
  const research = ["business_buyer", "end_customer"].flatMap(audience_scope =>
    COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS.map(research_block => ({ id: audience_scope + research_block, audience_scope, research_block })));
  const catalogInputs: Record<string, unknown> = {
    taxon_market_research: research,
    taxon_market_research_items: research.map(row => ({ research_id: row.id, item_text: "Referência técnica" })),
    plans: ["Starter", "Lite", "Pro", "Ultra"].map(name => ({ name, price_monthly: 10, max_lps: 1, max_conversions: 1, features: {} })),
  };
  const base = () => ({ accountId, version, createdAt: "t", updatedAt: "t",
    sections: { business_context: { format: "text", value: "Dados confirmados", origin: "user_confirmed" } },
  });
  const db = {
    async rpc(name: string, input: Record<string, unknown>) {
      if (name !== "close_openai_cost_occurrence_v1") return commit;
      closeCalls.push(input);
      if (draftIds.includes(String(input.p_occurrence_id))) draftEvents.push("close");
      if (closureFails) return { data: null, error: { code: "57014" } };
      closed.add(String(input.p_occurrence_id));
      return { data: "2026-11-21T12:00:00Z", error: null };
    },
    from(table: string) {
      const filters: Record<string, unknown> = {};
      return {
        select() { return this; },
        eq(key: string, value: unknown) { filters[key] = value; return this; },
        neq(key: string, value: unknown) { filters["not_" + key] = value; return this; },
        is(key: string, value: unknown) { filters[key] = value; return this; },
        limit() { return this; },
        async maybeSingle() {
          if (table === "account_dialogues") return { data: { version: 1, niche_state: {} }, error: null };
          assert.equal(table, "openai_cost_executions");
          assert.equal(filters.occurrence_id, inspectId);
          if (filters.not_workload) {
            assert.deepEqual(filters, { occurrence_id: inspectId, not_workload: "supabase_inspect" });
            return { data: foreignWorkloadExists ? { id: otherDialogue } : null, error: null };
          }
          assert.deepEqual(filters, {
            id: executionId, occurrence_id: inspectId, environment: "preview", workload: "supabase_inspect",
            execution_origin: "runtime", universe: "lp_factory", attribution_status: "attributed", account_id: null,
          });
          return { data: inspectExecutionExists ? { id: executionId } : null, error: null };
        },
      };
    },
  };
  const draftDb = { ...db, from(table: string) {
    return {
      select() { return this; }, eq() { return this; }, in() { return this; }, order() { return this; }, limit() { return this; },
      async maybeSingle() { return { data: table === "business_taxons" ? { id: accountId, name: "Nicho", slug: "nicho" } : null, error: null }; },
      insert() { return this; },
      async single() {
        assert.equal(table, "content_artifacts");
        draftEvents.push("persist");
        return ++artifactAttempt === 1 ? { data: null, error: { code: "23505" } }
          : { data: { id: executionId, artifact_version: 1 }, error: null };
      },
      then(resolve: (value: unknown) => void) { resolve({ data: catalogInputs[table], error: null }); },
    };
  } };

  const loader = nodeModule as unknown as { _load(name: string, parent: unknown, isMain: boolean): unknown };
  const original = loader._load;
  loader._load = function (name, parent, isMain) {
    if (name === "server-only") return {};
    if (name === "next/cache") return { revalidatePath: () => {} };
    if (name === "next/server") return { NextResponse: { json: Response.json } };
    const isDraft = (parent as { filename?: string } | undefined)?.filename?.endsWith("draft-generation.ts");
    if (name === "@/lib/supabase/service" || name.endsWith("/supabase/service")) return { createServiceClient: () => isDraft ? draftDb : db };
    if (isDraft && name.endsWith("/openai-workloads")) return {
      ...original.call(this, name, parent, isMain) as object,
      resolveOpenAiProductWorkload: async () => ({ ok: true, value: listOpenAiWorkloadInventory().find(item =>
        item.id === "commercial_activation_draft_generation") }),
    };
    if (isDraft && name === "./composition") return { ensureCommercialActivationCompositionForTaxon: async () => ({
      status: "ready", composition: { id: inspectId, version: 1, template: { id: dialogueId, version: 1 },
        items: [{ id: executionId, variantKey: "hero.default", module: { key: "hero" } }] },
    }) };
    if (isDraft && name === "./resolve") return { resolveCommercialActivationRenderModel: () => ({ status: "ready" }) };
    if (isDraft && name.endsWith("/commercialActivationOpenAiAdapter")) return {
      requestCommercialActivationOpenAi: async ({ economicEvent }: { economicEvent: { eventId: string; taxonId: string } }) => {
        assert.equal(economicEvent.taxonId, accountId);
        draftIds.push(economicEvent.eventId);
        draftEvents.push("provider");
        return draftProviderFails ? { ok: false, reason: "provider_unavailable" }
          : { ok: true, value: { hero: { primary_cta: { label: "Continuar" } }, plans: { plan_narratives: [] }, final_cta: { cta: { label: "Continuar" } } } };
      },
    };
    if (name.endsWith("/attendance-provider")) return {
      requestAttendance: async ({ occurrenceId, context }: { occurrenceId?: string; context: AttendanceContext }) => {
        if (!occurrenceId) return { ok: false };
        assert.equal(closed.has(occurrenceId), false);
        proofTurns.set(occurrenceId, (proofTurns.get(occurrenceId) ?? 0) + 1);
        if (context.officialNiche?.name !== "Corretor de imóveis" && context.officialNiche?.name !== "Faculdades")
          return { ok: false };
        return { ok: true, responseId: "resp_proof", latencyMs: 1, output: {
          action: "ask", closureReason: null, sufficientUnderstanding: true, readyToComplete: true,
          reply: "Resposta técnica", businessUnderstanding: "Entendimento", suggestions: [],
        } };
      },
    };
    if (name.endsWith("/communication-base/access")) return {
      requireCommunicationBaseAccess: async () => ({ ok: true, value: { accountId, accountSubdomain: "qa" } }),
    };
    if (name.endsWith("/communicationCatalogAdapter")) return {
      readCommunicationDefinitions: async () => ({ ok: true, value: definitions }),
    };
    if (name.endsWith("/communicationBaseAdapter")) return {
      readCommunicationBase: async () => ({ ok: true, value: base() }),
      saveGeneratedIntelligence: async () => saveOutcome === "saved" ? { ok: true, value: base() } : {
        ok: false, error: saveOutcome === "terminal" ? "conflict" : "write_failed",
        terminalGenerationFailure: saveOutcome === "terminal",
      },
    };
    if (name.startsWith("../../../../") && name.endsWith("/accountOfficialNicheAdapter")) return {
      readOfficialNicheContext: async () => ({
        ok: true, niche: { taxonId: null, name: "Nicho confirmado", revision: "text:1", confirmed: true },
      }),
    };
    if (name.endsWith("/agentBasePilotAdapter")) return {
      generateAgentBasePilotSection: async ({ generationId, key }: { generationId: string; key: string }) => {
        if (closed.has(generationId)) return { ok: false };
        generationCalls.push(generationId);
        if (sectionUnavailable) return { ok: false };
        accepted.add(generationId);
        const format = definitions.find(definition => definition.key === key)?.format;
        const value = format === "items" ? ["Item técnico"] : format === "faq"
          ? [{ question: "Pergunta?", answer: "Resposta." }] : "Texto técnico";
        return { ok: true, value: { key, value, researched: true, sources: [],
          basis: key === "about" ? "confirmed_business_fact" : "strategic_hypothesis" } };
      },
    };
    return original.call(this, name, parent, isMain);
  };
  try {
    const { completePendingSetup } = await import("../onboarding/pending-setup/adapters/pendingSetupConversationAdapter");
    const { commitNicheConversation } = await import("../onboarding/niche-resolution/adapters/accountNicheDialogueAdapter");
    const { confirmAccountNicheDialogue } = await import("../onboarding/niche-resolution/adapters/accountOfficialNicheAdapter");
    const pending = { accountId, userId: accountId, conversationId: dialogueId, expectedVersion: 1, resolutionOutcome: "official" as const };
    const active = { accountId, userId: accountId, dialogueId: otherDialogue, expectedVersion: 1, turnToken: accountId,
      reply: "Resposta", understanding: "", proposal: null, summary: null, observedSummary: null, observedSummaryUpdatedAt: "",
      acceptedProposal: null, keepProposal: false,
      synthesis: { accept: null, clear: false, offer: null, partial: false, nicheReaction: "continue" },
    } satisfies Parameters<typeof commitNicheConversation>[0];
    assert.equal((await completePendingSetup(pending)).ok, false);
    commit = { data: { confirmed: false }, error: null };
    assert.equal(await commitNicheConversation(active), true);
    assert.equal(closeCalls.length, 0);
    commit = { data: true, error: null };
    assert.equal((await completePendingSetup(pending)).ok, true);
    commit = { data: { confirmed: true }, error: null };
    assert.equal(await commitNicheConversation(active), true);
    commit = { data: null, error: { code: "40001" } };
    assert.equal((await confirmAccountNicheDialogue({ ...active, actorUserId: accountId })).ok, false);
    commit = { data: 2, error: null };
    closureFails = true;
    assert.equal((await confirmAccountNicheDialogue({ ...active, actorUserId: accountId })).ok, true);
    closureFails = false;
    assert.deepEqual(closeCalls.splice(0).map(call => call.p_occurrence_id),
      [dialogueId, otherDialogue, otherDialogue].map(eventId => resolveOpenAiOccurrenceId(
        clientOpenAiCostContext(accountId, { kind: "niche_resolution", eventId }), "preview",
      )));

    const { runAgentBasePilotAction, saveAgentBasePilotAction } = await import("../../app/a/[account]/base-comunicacao/actions");
    async function generate() {
      const sections: AgentBasePilotSection[] = [];
      let input = { account: "qa", version, sections, catalogState: "", nicheRevision: "" };
      for (const definition of definitions.filter(section => section.stage === 2)) {
        const result = await runAgentBasePilotAction({ ...input, previous: sections });
        assert.ok(result.ok, definition.key);
        assert.equal(result.section.key, definition.key);
        sections.push(result.section);
        input = { ...input, catalogState: result.catalogState, nicheRevision: result.nicheRevision };
      }
      assert.equal(sections.length, 7);
      assert.equal(new Set(sections.map(section => section.generationId)).size, 1);
      return input;
    }
    const saved = await generate();
    const savedId = saved.sections[0].generationId!;
    assert.equal(closeCalls.length, 0, "seven sections cannot prove a save");
    assert.equal((await saveAgentBasePilotAction(saved)).ok, false);
    assert.equal(closeCalls.length, 0, "a write error can be ambiguous");
    saveOutcome = "saved";
    assert.equal((await saveAgentBasePilotAction(saved)).ok, true);
    assert.ok(closed.has(savedId));
    const sentBefore = generationCalls.length;
    assert.equal((await runAgentBasePilotAction({ ...saved, previous: saved.sections.slice(0, 1) })).ok, false);
    assert.equal(generationCalls.length, sentBefore);

    closeCalls.length = 0;
    const failed = await generate();
    assert.notEqual(failed.sections[0].generationId, savedId);
    saveOutcome = "terminal";
    assert.equal((await saveAgentBasePilotAction(failed)).ok, false);
    assert.ok(closed.has(failed.sections[0].generationId!));
    const interrupted = await runAgentBasePilotAction({ account: "qa", version });
    assert.ok(interrupted.ok);
    const resume = { account: "qa", version, previous: [interrupted.section],
      catalogState: interrupted.catalogState, nicheRevision: interrupted.nicheRevision };
    sectionUnavailable = true;
    assert.equal((await runAgentBasePilotAction(resume)).ok, false);
    assert.equal(closed.has(interrupted.section.generationId!), false, "a failed section can still be retried");
    sectionUnavailable = false;
    assert.equal((await runAgentBasePilotAction(resume)).ok, true);
    version++;
    assert.equal((await runAgentBasePilotAction({ ...resume, previous: [{ ...interrupted.section, proof: "forged" }] })).ok, false);
    assert.equal(closed.has(interrupted.section.generationId!), false);
    assert.equal((await runAgentBasePilotAction(resume)).ok, false);
    assert.ok(closed.has(interrupted.section.generationId!));
    assert.ok(accepted.has(interrupted.section.generationId!));

    const { generateCommercialActivationDraftForTaxon } = await import("../conversion-content/commercial-activation/draft-generation");
    assert.equal((await generateCommercialActivationDraftForTaxon({ taxonSlug: "nicho" })).ok, true);
    assert.deepEqual(draftEvents, ["provider", "persist", "persist", "close"], "retry da gravação mantém uma única ocorrência");
    draftEvents.length = 0;
    draftProviderFails = true;
    assert.equal((await generateCommercialActivationDraftForTaxon({ taxonSlug: "nicho" })).ok, false);
    assert.deepEqual(draftEvents, ["provider", "close"]);
    assert.notEqual(draftIds[0], draftIds[1]);

    const configuration = listOpenAiWorkloadInventory().find(item => item.id === "pending_setup_conversation");
    assert.ok(configuration?.configurationKind === "effective");
    const { runOpenAiCandidateProof } = await import("../../app/admin/(protected)/workloads-openai/_proof");
    const beforeProof = closeCalls.length;
    assert.equal((await runOpenAiCandidateProof(configuration, "preview", secret, "proof-request")).ok, false);
    assert.equal([...proofTurns.values()].filter(turns => turns === 2).length, 2);
    assert.deepEqual(closeCalls.slice(beforeProof).map(call => call.p_occurrence_id).sort(), [...proofTurns.keys()].sort());
    assert.ok(closeCalls.slice(beforeProof).every(call => call.p_execution_origin === "administrative_proof"));

    const { POST } = await import("../../app/api/internal/openai-costs/route");
    const closeInspect = async (authenticated = true) => {
      const protocol = OPENAI_COST_INGESTION_PROTOCOL_VERSION;
      const timestamp = Date.now().toString();
      const body = JSON.stringify({ version: protocol, action: "closeOccurrence", payload: { executionId, occurrenceId: inspectId } });
      return POST(new Request("https://test.example/api/internal/openai-costs", {
        method: "POST", body, headers: { "content-type": "application/json", "x-openai-cost-protocol": protocol,
          "x-openai-cost-timestamp": timestamp,
          "x-openai-cost-signature": authenticated ? createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex") : "invalid",
        },
      }));
    };
    const beforeInspect = closeCalls.length;
    assert.equal((await closeInspect(false)).status, 401);
    inspectExecutionExists = false;
    assert.equal((await (await closeInspect()).json()).closed, false);
    inspectExecutionExists = true;
    foreignWorkloadExists = true;
    assert.equal((await (await closeInspect()).json()).closed, false);
    assert.equal(closeCalls.length, beforeInspect);
    foreignWorkloadExists = false;
    assert.equal((await (await closeInspect()).json()).closed, true);
    assert.equal((await (await closeInspect()).json()).closed, true, "signed replay uses the same occurrence");
    assert.deepEqual(closeCalls.at(-1), { p_occurrence_id: inspectId, p_environment: "preview",
      p_execution_origin: "runtime", p_account_id: null, p_universe: "lp_factory" });
  } finally {
    loader._load = original;
    for (const [key, value] of Object.entries(prior)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  console.log("PASS D10D terminal and resumable dialogues, signed Category 3 generation, and scoped Inspect ingress");
}
