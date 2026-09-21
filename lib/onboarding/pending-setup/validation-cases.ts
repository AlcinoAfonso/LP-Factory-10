import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  redactPotentialContactDetails,
  resolvePreferredNameFromAuth,
  validateBusinessContext,
  validatePreferredName,
} from "./policy";
import {
  appendBusinessContext,
  decidePendingSetupAiTurn,
  shouldFallbackFromClarification,
  shouldUseAutomaticOfficialPath,
} from "./turn-policy";
import {
  buildPendingSetupAiProjection,
  pendingSetupAiProjectionPolicy,
} from "./context-projection";
import { resolveNicheWithOpenAi } from "../niche-resolution/adapters/openAiResolver";
import type { TaxonMatchCandidate } from "../niche-resolution/contracts";

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
assert.deepEqual(validateBusinessContext("  Consultoria   para pequenas empresas  "), {
  ok: true,
  value: "Consultoria para pequenas empresas",
});
assert.equal(validateBusinessContext(" ").ok, false);
assert.equal(validateBusinessContext("x".repeat(4001)).ok, false);

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
const nicheOrchestrator = readFileSync(
  new URL("./adapters/pendingSetupNicheOrchestrator.ts", import.meta.url),
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
assert.match(page, /PendingSetupConversation/);
assert.doesNotMatch(page, /PendingSetupFirstSteps/);
assert.match(loader, /loadPendingSetupConversation/);
assert.match(loader, /accountStatus === "pending_setup"/);
assert.match(conversationAdapter, /\.eq\("account_id", input\.accountId\)/);
assert.match(conversationAdapter, /\.eq\("user_id", input\.userId\)/);
assert.match(conversationAdapter, /\.eq\("conversation_id", conversationId\)/);
assert.doesNotMatch(migration, /update\s+public\.account_pending_setup_messages/i);
assert.doesNotMatch(migration, /delete\s+from\s+public\.account_pending_setup_messages/i);
assert.match(pendingSetupActions, /completePendingSetupAction/);
assert.match(pendingSetupActions, /completePendingSetup/);
assert.ok(
  pendingSetupActions.indexOf("claimPendingSetupTurn({")
    < pendingSetupActions.indexOf("orchestratePendingSetupNicheTurn({"),
  "the turn must be claimed before matching or OpenAI effects",
);
assert.match(pendingSetupActions, /confirmOperationalNicheForPendingSetup/);
assert.match(pendingSetupActions, /fieldError:[\s\S]*Prefiro não informar/);
assert.doesNotMatch(pendingSetupActions, /entitlement/i);
assert.match(nicheOrchestrator, /if \(!matched\.ok\) \{[\s\S]*retryAfterTechnicalFailure\(\)/);
assert.match(nicheOrchestrator, /if \(!aiResult\.ok\) \{[\s\S]*retryAfterTechnicalFailure\(\)/);
assert.match(nicheOrchestrator, /confirmationKind: "operational_fallback"/);
assert.doesNotMatch(nicheOrchestrator, /confirmOperationalNicheForPendingSetup/);
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
assert.equal(shouldUseAutomaticOfficialPath(highDecision), true);
assert.equal(appendBusinessContext("consultoria", "para restaurantes"), "consultoria | para restaurantes");

const longHistory = Array.from({ length: 12 }, (_, index) => ({
  role: index % 2 === 0 ? "assistant" as const : "user" as const,
  content: `turno-${index} ${"x".repeat(500)}`,
}));
const projection = buildPendingSetupAiProjection({
  messages: longHistory,
  currentAnswer: "Contato ana@example.com, https://example.com, +55 (21) 97965-8483",
});
assert.ok(projection.length <= pendingSetupAiProjectionPolicy.maxProjectionLength);
assert.doesNotMatch(projection, /turno-[0-5]\b/);
assert.match(projection, /turno-11\b/);
assert.doesNotMatch(projection, /ana@example\.com|example\.com|97965/);
assert.match(projection, /\[email removido\]|\[url removida\]|\[telefone removido\]/);

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
const confirmation = decidePendingSetupAiTurn({
  output: ambiguousAi.output,
  allowedCandidates: [candidate],
});
assert.equal(confirmation.kind, "confirm_official");
assert.equal((confirmation.assistantContent.match(/\?/g) ?? []).length, 1);

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
  fetchImpl: async (_url, init) => new Promise<Response>((_resolve, reject) => {
    const rejectAsAborted = () => reject(new DOMException("Aborted", "AbortError"));
    if (init?.signal?.aborted) rejectAsAborted();
    else init?.signal?.addEventListener("abort", rejectAsAborted, { once: true });
  }),
});
assert.equal(timedOutAi.ok, false);
assert.equal(timedOutAi.reason, "AbortError");

const rejectedUnknownId = decidePendingSetupAiTurn({
  output: {
    uxMode: "confirm_single",
    message: "ignore",
    options: [{
      taxonId: "90000000-0000-4000-8000-000000000009",
      name: "Taxon inventado",
      slug: "taxon-inventado",
      confidence: "high",
      reason: "invented",
      isOfficial: true,
    }],
    needsAdminReview: false,
    needsUserConfirmation: true,
    shouldCreateOfficialLink: false,
    suggestedNewTaxonLabel: null,
    reason: "invalid_candidate",
  },
  allowedCandidates: [candidate],
});
assert.equal(rejectedUnknownId.kind, "unresolved_fallback");

assert.equal(shouldFallbackFromClarification({
  previousAssistantContents: ["Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Consultoria criativa, Criação artística ou Experiências sensoriais?"],
  nextAssistantContent: "Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Experiências sensoriais, Consultoria criativa ou Criação artística?",
}), true);
assert.equal(shouldFallbackFromClarification({
  previousAssistantContents: ["Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Consultoria criativa ou Criação artística?"],
  nextAssistantContent: "Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Consultoria financeira ou Criação artística?",
}), false);
assert.equal(shouldFallbackFromClarification({
  previousAssistantContents: [
    "Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Consultoria criativa ou Criação artística?",
    "Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Consultoria financeira ou Experiências sensoriais?",
  ],
  nextAssistantContent: "Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Serviços sensoriais ou Produção artística?",
}), true);

const pendingSetupConversationSource = readFileSync(
  new URL("../../../app/a/[account]/_components/PendingSetupConversation.tsx", import.meta.url),
  "utf8",
);
assert.equal((pendingSetupConversationSource.match(/!text-ink-700/g) ?? []).length, 2);
assert.equal((pendingSetupConversationSource.match(/!bg-transparent/g) ?? []).length, 2);

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

console.log("ok - E10.9 pending setup identity, persistence and adaptive-turn contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
