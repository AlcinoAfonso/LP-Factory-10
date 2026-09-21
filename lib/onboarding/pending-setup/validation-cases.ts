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
  hasPendingSetupTerminalFallback,
  hasReachedPendingSetupOpenAiCallLimit,
  isPendingSetupTerminalFallbackMessage,
  PENDING_SETUP_MAX_OPENAI_CALLS,
  PENDING_SETUP_OPENAI_RETRY_MESSAGE,
  PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE,
  selectOperationalFallbackLabel,
  shouldFallbackFromRepeatedClarification,
  shouldUseTerminalFallbackAfterRejectedAiConfirmation,
  shouldUseAutomaticOfficialPath,
} from "./turn-policy";
import {
  buildPendingSetupAiProjection,
  pendingSetupAiProjectionPolicy,
} from "./context-projection";
import { resolvePendingSetupAiTurn } from "./niche-turn-core";
import {
  resolveNicheWithOpenAi,
  type ResolveAiNicheResolutionResult,
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
const nicheOrchestrator = readFileSync(
  new URL("./adapters/pendingSetupNicheOrchestrator.ts", import.meta.url),
  "utf8",
);
const nicheTurnCoreSource = readFileSync(
  new URL("./niche-turn-core.ts", import.meta.url),
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
assert.match(conversationAdapter, /claim_account_pending_setup_openai_call_v1/);
assert.match(conversationAdapter, /openai_call_count/);
assert.doesNotMatch(conversationAdapter, /openai_cost_executions/);
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
assert.ok(
  nicheOrchestrator.indexOf("if (shouldUseAutomaticOfficialPath(decision))")
    < nicheOrchestrator.indexOf("return resolvePendingSetupAiTurn({"),
  "deterministic resolution must run before the OpenAI turn core",
);
assert.match(nicheTurnCoreSource, /if \(!aiResult\.ok\) \{[\s\S]*retryAfterOpenAiFailure\(\)/);
assert.match(nicheTurnCoreSource, /confirmationKind: "operational_fallback"/);
assert.match(nicheTurnCoreSource, /currentOpenAiCallReachesLimit \|\| shouldFallbackFromRepeatedClarification/);
assert.match(nicheTurnCoreSource, /assistantContent: PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE/);
assert.match(nicheTurnCoreSource, /!persisted\) \{[\s\S]*currentOpenAiCallReachesLimit[\s\S]*prepareOperationalFallback/);
assert.ok(
  nicheTurnCoreSource.indexOf("await dependencies.reserveOpenAiCall()")
    < nicheTurnCoreSource.indexOf("await dependencies.resolveAi({"),
  "the persisted counter must be claimed before the provider call",
);
assert.match(pendingSetupActions, /assistantContent = resolution\.assistantContent/);
assert.match(pendingSetupActions, /resolution\.reason === "ai_resolution_write_failed"[\s\S]*PENDING_SETUP_OPENAI_RETRY_MESSAGE/);
assert.match(pendingSetupActions, /appendPendingSetupTurn\([\s\S]*assistantContent,/);
assert.match(pendingSetupActions, /intent === "clarify" && !isTerminalFallback/);
assert.match(pendingSetupActions, /shouldUseTerminalFallbackAfterRejection\) \{[\s\S]*PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE/);
assert.match(pendingSetupActions, /eventId: crypto\.randomUUID\(\)/);
assert.doesNotMatch(pendingSetupActions, /countPendingSetupOpenAiExecutions/);
assert.match(pendingSetupActions, /Tente confirmar novamente\./);
assert.doesNotMatch(pendingSetupActions, /Não consegui registrar essa escolha agora\. Tente novamente ou explique de outra forma\./);
assert.match(pendingSetupConversationSource, /!isTerminalFallback \? \(/);
assert.match(pendingSetupConversationSource, /hasPendingSetupTerminalFallback/);
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

assert.equal(shouldFallbackFromRepeatedClarification({
  previousAssistantContents: ["Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Consultoria criativa, Criação artística ou Experiências sensoriais?"],
  nextAssistantContent: "Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Experiências sensoriais, Consultoria criativa ou Criação artística?",
}), true);
assert.equal(shouldFallbackFromRepeatedClarification({
  previousAssistantContents: ["Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Consultoria criativa ou Criação artística?"],
  nextAssistantContent: "Para eu entender melhor, qual destas opções mais se aproxima do seu negócio: Consultoria financeira ou Criação artística?",
}), false);
assert.equal(PENDING_SETUP_MAX_OPENAI_CALLS, 3);
assert.equal(hasReachedPendingSetupOpenAiCallLimit(2), false);
assert.equal(hasReachedPendingSetupOpenAiCallLimit(3), true);
assert.equal(hasReachedPendingSetupOpenAiCallLimit(null), true);

const mixedAiResults: ResolveAiNicheResolutionResult[] = [
  {
    ok: true,
    status: "resolved",
    model: "test-model",
    schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
    output: {
      uxMode: "choose_from_options",
      message: "ignore",
      options: [{
        taxonId: null,
        name: "Consultoria criativa",
        slug: null,
        confidence: "low",
        reason: "semantic_option",
        isOfficial: false,
      }],
      needsAdminReview: true,
      needsUserConfirmation: true,
      shouldCreateOfficialLink: false,
      suggestedNewTaxonLabel: null,
      reason: "first_call",
    },
  },
  {
    ok: false,
    status: "failed",
    model: "test-model",
    schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
    reason: "AbortError",
  },
  {
    ok: true,
    status: "resolved",
    model: "test-model",
    schemaVersion: AI_NICHE_RESOLUTION_SCHEMA_VERSION,
    output: {
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
      reason: "third_call",
    },
  },
];
let injectedResolverCalls = 0;
let injectedReservationCalls = 0;
const callOrder: string[] = [];
const injectedResolver = async () => {
  callOrder.push("provider");
  const result = mixedAiResults[injectedResolverCalls];
  injectedResolverCalls += 1;
  if (!result) throw new Error("unexpected fourth OpenAI call");
  return result;
};
const aiTurnBase = {
  aiContextProjection: "contexto ambíguo",
  decision: ambiguousDecision,
  candidates: [candidate],
  previousAssistantContents: [] as string[],
  apiKey: "test-key",
  financialContext: {
    universe: "client" as const,
    attributionStatus: "attributed" as const,
    accountId: "20000000-0000-4000-8000-000000000001",
  },
};
const aiTurnDependencies = {
  resolveAi: injectedResolver,
  reserveOpenAiCall: async () => {
    injectedReservationCalls += 1;
    callOrder.push("reserve");
    return { ok: true as const, count: injectedReservationCalls };
  },
  persistAiOutput: async () => true,
  persistAiFailure: async () => undefined,
};
const firstMixedTurn = await resolvePendingSetupAiTurn({
  ...aiTurnBase,
  openAiCallCount: 0,
}, aiTurnDependencies);
assert.equal(firstMixedTurn.ok && firstMixedTurn.nextStage, "business_understanding");
const secondMixedTurn = await resolvePendingSetupAiTurn({
  ...aiTurnBase,
  openAiCallCount: 1,
}, aiTurnDependencies);
assert.equal(secondMixedTurn.ok && secondMixedTurn.assistantContent, PENDING_SETUP_OPENAI_RETRY_MESSAGE);
const thirdMixedTurn = await resolvePendingSetupAiTurn({
  ...aiTurnBase,
  openAiCallCount: 2,
}, aiTurnDependencies);
assert.equal(thirdMixedTurn.ok && thirdMixedTurn.confirmationKind, "official");
assert.equal(injectedResolverCalls, 3);
assert.equal(injectedReservationCalls, 3);
assert.deepEqual(callOrder, [
  "reserve", "provider",
  "reserve", "provider",
  "reserve", "provider",
]);

for (const scenario of ["reload", "append_failure", "retry"] as const) {
  const blockedTurn = await resolvePendingSetupAiTurn({
    ...aiTurnBase,
    aiContextProjection: scenario,
    openAiCallCount: 3,
  }, aiTurnDependencies);
  assert.equal(blockedTurn.ok && blockedTurn.confirmationKind, "operational_fallback");
  assert.equal(blockedTurn.ok && blockedTurn.assistantContent, PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE);
}
assert.equal(injectedResolverCalls, 3);
assert.equal(injectedReservationCalls, 3);

const rejectedReservation = await resolvePendingSetupAiTurn({
  ...aiTurnBase,
  openAiCallCount: 2,
}, {
  ...aiTurnDependencies,
  reserveOpenAiCall: async () => ({ ok: false, reason: "limit_reached" }),
});
assert.equal(rejectedReservation.ok && rejectedReservation.confirmationKind, "operational_fallback");
assert.equal(injectedResolverCalls, 3);

assert.equal(shouldUseTerminalFallbackAfterRejectedAiConfirmation({
  openAiCallCount: 3,
  confirmationKind: "official",
  intent: "clarify",
}), true);
assert.equal(shouldUseTerminalFallbackAfterRejectedAiConfirmation({
  openAiCallCount: 2,
  confirmationKind: "official",
  intent: "clarify",
}), false);
assert.equal(shouldUseTerminalFallbackAfterRejectedAiConfirmation({
  openAiCallCount: 3,
  confirmationKind: "operational_fallback",
  intent: "clarify",
}), false);
assert.equal(
  PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE,
  "Ainda não consegui identificar seu nicho com segurança. Vou preservar o que você me contou para seguirmos sem associar uma categoria incorreta.",
);
assert.equal(
  isPendingSetupTerminalFallbackMessage(PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE),
  true,
);
assert.equal(hasPendingSetupTerminalFallback({
  confirmationKind: "operational_fallback",
  assistantContents: [
    PENDING_SETUP_TERMINAL_FALLBACK_MESSAGE,
    "Não consegui registrar essa escolha agora. Tente confirmar novamente.",
  ],
}), true);
assert.equal(selectOperationalFallbackLabel([
  { role: "assistant", content: "Conte sobre seu negócio." },
  { role: "user", content: "  Crio mapas olfativos para memórias de famílias.  " },
  { role: "assistant", content: "Qual opção mais se aproxima?" },
  { role: "user", content: "Nenhuma das opções." },
], "Crio mapas olfativos para memórias de famílias. | Nenhuma das opções."),
"Crio mapas olfativos para memórias de famílias.");
assert.equal(selectOperationalFallbackLabel([], "  Descrição acumulada  "), "Descrição acumulada");

assert.equal((pendingSetupConversationSource.match(/variant="secondary"/g) ?? []).length, 2);

const buttonSource = readFileSync(
  new URL("../../../components/ui/button.tsx", import.meta.url),
  "utf8",
);
assert.match(buttonSource, /variant === "primary"/);
assert.match(buttonSource, /bg-transparent text-ink-800 shadow-none hover:bg-surface-app/);

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
