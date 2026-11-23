import { confirmedCostRecorder } from "../../openai-costs/fixtures/confirmed-recorder";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  redactPotentialContactDetails,
  resolvePreferredNameFromAuth,
  validateBusinessDisplayName,
  validatePreferredName,
} from "./policy";
import {
  resolveNicheWithOpenAi,
} from "../niche-resolution/adapters/openAiResolver";
import {
  AI_NICHE_RESOLUTION_SCHEMA_VERSION,
  type TaxonMatchCandidate,
} from "../niche-resolution/contracts";

async function main(): Promise<void> {

assert.equal(
  resolvePreferredNameFromAuth(
    { preferred_name: "  Ana   Maria ", full_name: "Nome ignorado" },
    "ana@example.com",
  ),
  "Ana Maria",
);
assert.equal(
  resolvePreferredNameFromAuth(
    { preferred_name: "ana", full_name: "Ana Maria", name: "Outro" },
    "ana@example.com",
  ),
  "Ana Maria",
);
assert.equal(resolvePreferredNameFromAuth({ name: "ana@example.com" }, "ana@example.com"), null);
assert.deepEqual(validatePreferredName("ana", "ana@example.com"), {
  ok: false,
  reason: "email_derived",
});
assert.deepEqual(validatePreferredName("Nome@Conta", null), {
  ok: false,
  reason: "invalid",
});
assert.deepEqual(validatePreferredName("A".repeat(81), null), {
  ok: false,
  reason: "too_long",
});
assert.deepEqual(validateBusinessDisplayName("  Studio   Aurora  "), { ok: true, value: "Studio Aurora" });
assert.equal(validateBusinessDisplayName(" ").ok, false);
assert.equal(validateBusinessDisplayName("x".repeat(121)).ok, false);
assert.equal(validateBusinessDisplayName("Nome\u0000público").ok, false);

const redacted = redactPotentialContactDetails(
  "Atendo por ana@example.com, https://example.com e +55 (21) 97965-8483.",
);
assert.doesNotMatch(redacted, /ana@example\.com|example\.com|97965/);
assert.match(redacted, /\[email removido\]|\[url removida\]|\[telefone removido\]/);

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/20260920223653_e10_9_pending_setup_conversation.sql",
    import.meta.url,
  ),
  "utf8",
);
const counterMigration = readFileSync(
  new URL(
    "../../../supabase/migrations/20260921170115_e10_9_pending_setup_openai_call_counter.sql",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../../app/a/[account]/page.tsx", import.meta.url),
  "utf8",
);
const loader = readFileSync(
  new URL("../../../app/a/[account]/account-journey-loader.ts", import.meta.url),
  "utf8",
);
const conversationAdapter = readFileSync(
  new URL("./adapters/pendingSetupConversationAdapter.ts", import.meta.url),
  "utf8",
);
const pendingSetupActions = readFileSync(
  new URL("../../../app/a/[account]/pending-setup-actions.ts", import.meta.url),
  "utf8",
);
const pendingSetupConversationSource = readFileSync(
  new URL("../../../app/a/[account]/_components/PendingSetupConversation.tsx", import.meta.url),
  "utf8",
);
const legacyComponent = new URL(
  "../../../app/a/[account]/_components/PendingSetupFirstSteps.tsx",
  import.meta.url,
);
const legacyValidation = new URL("../e10_4_setup_validation.ts", import.meta.url);
const sqlTest = new URL(
  "../../../supabase/tests/e10_9_pending_setup_conversation.test.sql",
  import.meta.url,
);

for (const requiredContract of [
  "account_pending_setup_conversations",
  "account_pending_setup_messages",
  "start_account_pending_setup_v1",
  "set_account_pending_setup_preferred_name_v1",
  "claim_account_pending_setup_turn_v1",
  "append_account_pending_setup_turn_v1",
  "complete_account_pending_setup_v1",
  "enable row level security",
  "to service_role",
]) {
  assert.match(migration, new RegExp(requiredContract));
}
assert.doesNotMatch(migration, /create policy/i);
assert.match(counterMigration, /openai_call_count smallint not null default 0/);
assert.match(counterMigration, /check \(openai_call_count between 0 and 3\)/);
assert.match(counterMigration, /claim_account_pending_setup_openai_call_v1/);
assert.match(counterMigration, /for update/);
assert.match(counterMigration, /pending_turn_token is distinct from p_turn_token/);
assert.match(counterMigration, /openai_call_count = openai_call_count \+ 1/);
assert.doesNotMatch(counterMigration, /version = version \+ 1/);
assert.match(counterMigration, /to service_role/);
assert.match(page, /PendingSetupConversation/);
assert.doesNotMatch(page, /PendingSetupFirstSteps/);
assert.match(loader, /loadPendingSetupConversation/);
assert.match(loader, /accountStatus === "pending_setup"/);
assert.match(conversationAdapter, /\.eq\("account_id", input\.accountId\)/);
assert.match(conversationAdapter, /\.eq\("user_id", input\.userId\)/);
assert.match(conversationAdapter, /\.eq\("conversation_id", conversationId\)/);
assert.doesNotMatch(conversationAdapter, /openai_cost_executions/);
assert.doesNotMatch(migration, /update\s+public\.account_pending_setup_messages/i);
assert.doesNotMatch(migration, /delete\s+from\s+public\.account_pending_setup_messages/i);
assert.match(pendingSetupActions, /completePendingSetupAction/);
assert.match(pendingSetupActions, /completePendingSetup/);
assert.match(pendingSetupActions, /whatsapp_contact/);
assert.doesNotMatch(pendingSetupActions, /entitlement/i);
assert.match(pendingSetupConversationSource, /name="business_display_name"/);
assert.ok(pendingSetupConversationSource.indexOf('name="whatsapp_contact"') >
  pendingSetupConversationSource.indexOf("{ready ? ("), "WhatsApp appears only in the completed business stage");
assert.match(pendingSetupConversationSource, /Ver página comercial/);
assert.match(conversationAdapter, /complete_account_pending_setup_v2/);
assert.match(conversationAdapter, /complete_account_pending_setup_attendance_v3/);
assert.equal(existsSync(legacyComponent), false);
assert.equal(existsSync(legacyValidation), false);
assert.equal(existsSync(sqlTest), true);

const candidate: TaxonMatchCandidate = {
  taxonId: "10000000-0000-4000-8000-000000000001",
  name: "Consultoria financeira",
  slug: "consultoria-financeira",
  level: "niche",
  parentId: null,
  parentName: null,
  matchedAliases: [],
  matchSource: "taxon_name_exact",
  score: 0.99,
};
const highDecision = {
  confidence: "high" as const,
  selectedCandidate: candidate,
  shouldUseDeterministicMatch: true,
  shouldEscalateToAi: false,
  aiEscalationMode: "none" as const,
  needsAdminReview: false,
  reason: "high_confidence_strong_match" as const,
};
let deterministicTransportCalls = 0;
const deterministicAi = await resolveNicheWithOpenAi({
  rawInput: "consultoria financeira",
  decision: highDecision,
  candidates: [candidate],
  apiKey: "test-key",
  financialContext: {
    universe: "client",
    attributionStatus: "attributed",
    accountId: "20000000-0000-4000-8000-000000000001",
  },
}, {
  environment: "development",
  costRecorder: confirmedCostRecorder,
  fetchImpl: async () => {
    deterministicTransportCalls += 1;
    return new Response();
  },
});
assert.equal(deterministicAi.status, "skipped_not_eligible");
assert.equal(deterministicTransportCalls, 0);

const ambiguousDecision = {
  ...highDecision,
  confidence: "medium" as const,
  shouldUseDeterministicMatch: false,
  shouldEscalateToAi: true,
  aiEscalationMode: "rerank_candidates" as const,
  needsAdminReview: true,
  reason: "medium_confidence_below_high_threshold" as const,
};
let ambiguousTransportCalls = 0;
let capturedRequest: Record<string, unknown> | null = null;
const ambiguousAi = await resolveNicheWithOpenAi({
  rawInput: "consultoria para ana@example.com https://example.com +55 (21) 97965-8483",
  decision: ambiguousDecision,
  candidates: [candidate],
  apiKey: "test-key",
  financialContext: {
    universe: "client",
    attributionStatus: "attributed",
    accountId: "20000000-0000-4000-8000-000000000001",
  },
}, {
  environment: "development",
  emitEvent: () => undefined,
  costRecorder: confirmedCostRecorder,
  fetchImpl: async (_url, init) => {
    ambiguousTransportCalls += 1;
    capturedRequest = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      id: "resp_pending_setup",
      output_text: JSON.stringify({
        uxMode: "confirm_single",
        message: "ignore",
        options: [{
          taxonId: candidate.taxonId,
          name: candidate.name,
          slug: candidate.slug,
          confidence: "medium",
          reason: "official_candidate",
          isOfficial: true,
        }],
        needsAdminReview: false,
        needsUserConfirmation: true,
        shouldCreateOfficialLink: false,
        suggestedNewTaxonLabel: null,
        reason: "ai_resolution_completed",
      }),
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  },
});
assert.equal(ambiguousTransportCalls, 1);
assert.equal(ambiguousAi.ok, true);
const blockedAi = await resolveNicheWithOpenAi({
  rawInput: "contexto ambíguo", decision: ambiguousDecision, candidates: [candidate], apiKey: "test-key",
  financialContext: { universe: "client", attributionStatus: "attributed", accountId: "20000000-0000-4000-8000-000000000001" },
}, {
  environment: "development", emitEvent: () => {},
  costRecorder: { ...confirmedCostRecorder, startOperation: async () => false },
  fetchImpl: async () => { ambiguousTransportCalls++; throw Error("unexpected paid transport"); },
});
assert.equal(blockedAi.ok, false);
if (!blockedAi.ok) assert.equal(blockedAi.reason, "financial_admission_unconfirmed");
assert.equal(ambiguousTransportCalls, 1);
const request = capturedRequest as unknown as {
  store?: boolean;
  background?: boolean;
  input?: Array<{ role?: string; content?: string }>;
};
assert.equal(request.store, false);
assert.equal(request.background, false);
assert.deepEqual(request.input?.map((item) => item.role), ["system", "developer", "user"]);
const userPrompt = request.input?.find((item) => item.role === "user")?.content ?? "";
assert.doesNotMatch(userPrompt, /ana@example\.com|example\.com|97965/);
assert.match(userPrompt, /\[email removido\]|\[url removida\]|\[telefone removido\]/);
if (!ambiguousAi.ok) throw new Error("expected mocked AI resolution");
const timedOutAi = await resolveNicheWithOpenAi({
  rawInput: "contexto ambíguo",
  decision: ambiguousDecision,
  candidates: [candidate],
  apiKey: "test-key",
  financialContext: {
    universe: "client",
    attributionStatus: "attributed",
    accountId: "20000000-0000-4000-8000-000000000001",
  },
}, {
  environment: "development",
  timeoutMs: 1,
  emitEvent: () => undefined,
  costRecorder: confirmedCostRecorder,
  fetchImpl: async (_url, init) => new Promise<Response>((_resolve, reject) => {
    const rejectAsAborted = () => reject(new DOMException("Aborted", "AbortError"));
    if (init?.signal?.aborted) rejectAsAborted();
    else init?.signal?.addEventListener("abort", rejectAsAborted, { once: true });
  }),
});
assert.equal(timedOutAi.ok, false);
assert.equal(timedOutAi.reason, "AbortError");

const resolverSource = readFileSync(
  new URL("../niche-resolution/adapters/openAiResolver.ts", import.meta.url),
  "utf8",
);
assert.doesNotMatch(resolverSource, /resolved_official/);
assert.match(resolverSource, /store:\s*false/);
assert.match(resolverSource, /background:\s*false/);
assert.match(resolverSource, /AbortController/);
assert.match(resolverSource, /role:\s*"developer"/);
assert.match(resolverSource, /role:\s*"user"/);

const accountTaxonomyAdapter = readFileSync(
  new URL("../niche-resolution/adapters/accountTaxonomyAdapter.ts", import.meta.url),
  "utf8",
);
assert.match(accountTaxonomyAdapter, /USER_CONFIRMED_AI_SOURCE_TYPE\s*=\s*"user_confirmed_ai"/);

console.log("ok - E10.9 pending setup identity, persistence and shared resolver contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
