import assert from "node:assert/strict";

import type {
  AiNicheResolutionOutput,
  MatchBusinessTaxonsResult,
  TaxonMatchCandidate,
} from "../niche-resolution/contracts";
import {
  LEGACY_OPERATIONAL_CHOICE_LIMIT,
  PENDING_SETUP_OPERATIONAL_CHOICE_LIMIT,
  validateOperationalChoiceLabel,
} from "../niche-resolution/operationalChoice";
import {
  appendBusinessClarification,
  processPendingSetupBusinessTurn,
  type PendingSetupBusinessDependencies,
  validateBusinessDescription,
} from "./businessConversationCore";
import {
  reconcilePendingSetupTurnRetry,
  selectPendingSetupCompletionRetryTurn,
} from "./conversationHistoryCore";
import { resolveCompletedAccountPresentation } from "./completionCore";
import {
  type PendingSetupConversationTurn,
  presentPendingSetupBusinessTurn,
  validatePendingSetupTurnId,
  validatePreferredName,
} from "./contracts";

assert.deepEqual(validatePreferredName("  Alcino   Afonso  "), {
  ok: true,
  value: "Alcino Afonso",
});
assert.equal(validatePreferredName("   ").ok, false);
assert.equal(validatePreferredName("x".repeat(81)).ok, false);
assert.equal(
  validatePendingSetupTurnId("d9428888-122b-4c2e-941f-70a76fb55e37"),
  "d9428888-122b-4c2e-941f-70a76fb55e37",
);
assert.equal(validatePendingSetupTurnId("d9428888-122b-1c2e-941f-70a76fb55e37"), null);
assert.equal(validatePendingSetupTurnId("not-a-turn-id"), null);
const maximumFallbackDescription = "x".repeat(500);
assert.deepEqual(
  presentPendingSetupBusinessTurn({
    kind: "ready_fallback",
    description: maximumFallbackDescription,
  }),
  {
    state: "ready_fallback",
    message: `Entendimento operacional confirmado: ${maximumFallbackDescription}.`,
  },
);
assert.ok(
  presentPendingSetupBusinessTurn({
    kind: "ready_fallback",
    description: maximumFallbackDescription,
  })!.message.length <= 600,
);

assert.deepEqual(
  resolveCompletedAccountPresentation({
    completionMode: "official",
    hasActionableNicheResolution: true,
    hasPrimaryTaxon: true,
    personalizedBundleReady: true,
  }),
  { commercialMode: "personalized", showHistoricalNicheResolution: false },
);
assert.deepEqual(
  resolveCompletedAccountPresentation({
    completionMode: "fallback",
    hasActionableNicheResolution: true,
    hasPrimaryTaxon: false,
    personalizedBundleReady: false,
  }),
  { commercialMode: "generic", showHistoricalNicheResolution: false },
);
assert.deepEqual(
  resolveCompletedAccountPresentation({
    completionMode: null,
    hasActionableNicheResolution: true,
    hasPrimaryTaxon: false,
    personalizedBundleReady: false,
  }),
  { commercialMode: "generic", showHistoricalNicheResolution: true },
);
assert.deepEqual(
  resolveCompletedAccountPresentation({
    completionMode: "official",
    hasActionableNicheResolution: false,
    hasPrimaryTaxon: true,
    personalizedBundleReady: false,
  }),
  { commercialMode: "generic", showHistoricalNicheResolution: false },
);

assert.deepEqual(validateBusinessDescription("  consultoria   financeira  "), {
  ok: true,
  value: "consultoria financeira",
});
assert.deepEqual(validateBusinessDescription(maximumFallbackDescription), {
  ok: true,
  value: maximumFallbackDescription,
});
assert.equal(validateBusinessDescription("x").ok, false);
assert.equal(validateBusinessDescription("x".repeat(501)).ok, false);
assert.deepEqual(
  validateOperationalChoiceLabel("x".repeat(500), PENDING_SETUP_OPERATIONAL_CHOICE_LIMIT),
  { ok: true, value: "x".repeat(500) },
);
assert.deepEqual(
  validateOperationalChoiceLabel("x".repeat(501), PENDING_SETUP_OPERATIONAL_CHOICE_LIMIT),
  { ok: false, reason: "rewrite_too_long" },
);
assert.deepEqual(
  validateOperationalChoiceLabel("x".repeat(121), LEGACY_OPERATIONAL_CHOICE_LIMIT),
  { ok: false, reason: "rewrite_too_long" },
);
assert.deepEqual(
  appendBusinessClarification("consultoria", "  para   médicos "),
  { ok: true, value: "consultoria. para médicos" },
);
assert.deepEqual(appendBusinessClarification("consultoria", "CONSULTORIA"), {
  ok: true,
  value: "CONSULTORIA",
});

const officialCandidate: TaxonMatchCandidate = {
  taxonId: "taxon-consultoria",
  name: "Consultoria financeira",
  slug: "consultoria-financeira",
  level: "niche",
  parentId: null,
  parentName: null,
  matchedAliases: [],
  matchSource: "taxon_name_exact",
  score: 0.99,
};

const aiConfirmation: AiNicheResolutionOutput = {
  uxMode: "choose_from_options",
  message: "Qual opção representa melhor seu negócio?",
  options: [
    {
      taxonId: officialCandidate.taxonId,
      name: officialCandidate.name,
      slug: officialCandidate.slug,
      confidence: "medium",
      reason: "official_candidate",
      isOfficial: true,
    },
  ],
  needsAdminReview: false,
  needsUserConfirmation: true,
  shouldCreateOfficialLink: false,
  suggestedNewTaxonLabel: null,
  reason: "ai_resolution_completed",
};

function dependenciesFor(
  match: MatchBusinessTaxonsResult,
  events: string[],
  overrides: Partial<PendingSetupBusinessDependencies> = {},
): PendingSetupBusinessDependencies {
  return {
    match: async () => {
      events.push("match");
      return match;
    },
    persistResolution: async () => {
      events.push("persist_resolution");
      return true;
    },
    linkOfficial: async ({ decision }) => {
      events.push("link_official");
      return { status: "saved", taxonId: decision.selectedCandidate!.taxonId };
    },
    resolveWithAi: async () => {
      events.push("resolve_ai");
      return { ok: true, model: "test-model", output: aiConfirmation };
    },
    persistAiResult: async () => {
      events.push("persist_ai_result");
      return true;
    },
    ...overrides,
  };
}

async function runBusinessConversationCases(): Promise<void> {
{
  const events: string[] = [];
  const result = await processPendingSetupBusinessTurn(
    { accountId: "account-1", rawInput: officialCandidate.name },
    dependenciesFor({ ok: true, candidates: [officialCandidate] }, events),
  );
  assert.deepEqual(result, {
    ok: true,
    status: "ready_official",
    taxonId: officialCandidate.taxonId,
  });
  assert.deepEqual(events, ["match", "persist_resolution", "link_official"]);
}

{
  const events: string[] = [];
  const result = await processPendingSetupBusinessTurn(
    { accountId: "account-1", rawInput: officialCandidate.name },
    dependenciesFor(
      { ok: true, candidates: [officialCandidate] },
      events,
      {
        linkOfficial: async () => {
          events.push("link_official");
          return { status: "failed", taxonId: officialCandidate.taxonId };
        },
      },
    ),
  );
  assert.deepEqual(result, { ok: false, reason: "official_link_failed" });
  assert.deepEqual(events, ["match", "persist_resolution", "link_official"]);
}

{
  const events: string[] = [];
  const distantCandidate = {
    ...officialCandidate,
    taxonId: "taxon-contabilidade",
    name: "Contabilidade",
    slug: "contabilidade",
    score: 0.7,
  };
  const result = await processPendingSetupBusinessTurn(
    { accountId: "account-1", rawInput: officialCandidate.name },
    dependenciesFor(
      { ok: true, candidates: [officialCandidate, distantCandidate] },
      events,
    ),
  );
  assert.deepEqual(result, {
    ok: true,
    status: "awaiting_confirmation",
    mode: "choose_from_options",
  });
  assert.deepEqual(events, [
    "match",
    "persist_resolution",
    "resolve_ai",
    "persist_ai_result",
  ]);
}

{
  const events: string[] = [];
  const aliasCandidate = {
    ...officialCandidate,
    matchedAliases: ["consultoria de finanças"],
    matchSource: "alias_exact",
  };
  const result = await processPendingSetupBusinessTurn(
    { accountId: "account-1", rawInput: "consultoria de finanças" },
    dependenciesFor({ ok: true, candidates: [aliasCandidate] }, events),
  );
  assert.deepEqual(result, {
    ok: true,
    status: "awaiting_confirmation",
    mode: "confirm_single",
  });
  assert.deepEqual(events, ["match", "persist_resolution", "persist_ai_result"]);
}

{
  const events: string[] = [];
  const secondCandidate = {
    ...officialCandidate,
    taxonId: "taxon-contabilidade",
    name: "Contabilidade",
    slug: "contabilidade",
    score: 0.97,
  };
  const result = await processPendingSetupBusinessTurn(
    { accountId: "account-1", rawInput: "consultoria" },
    dependenciesFor(
      { ok: true, candidates: [officialCandidate, secondCandidate] },
      events,
    ),
  );
  assert.deepEqual(result, {
    ok: true,
    status: "awaiting_confirmation",
    mode: "choose_from_options",
  });
  assert.deepEqual(events, [
    "match",
    "persist_resolution",
    "resolve_ai",
    "persist_ai_result",
  ]);
}

{
  const events: string[] = [];
  const result = await processPendingSetupBusinessTurn(
    { accountId: "account-1", rawInput: "serviço artesanal" },
    dependenciesFor(
      { ok: false, error: { code: "RPC_FAILED", message: "unavailable" } },
      events,
    ),
  );
  assert.deepEqual(result, {
    ok: true,
    status: "awaiting_confirmation",
    mode: "fallback_review",
  });
  assert.deepEqual(events, ["match", "persist_resolution", "persist_ai_result"]);
}

{
  const events: string[] = [];
  const result = await processPendingSetupBusinessTurn(
    { accountId: "account-1", rawInput: "consultoria" },
    dependenciesFor(
      { ok: true, candidates: [] },
      events,
      {
        resolveWithAi: async () => {
          events.push("resolve_ai");
          return { ok: false, model: null, reason: "transport_failed" };
        },
      },
    ),
  );
  assert.deepEqual(result, {
    ok: true,
    status: "awaiting_confirmation",
    mode: "fallback_review",
  });
  assert.deepEqual(events, [
    "match",
    "persist_resolution",
    "resolve_ai",
    "persist_ai_result",
  ]);
}

{
  const events: string[] = [];
  const result = await processPendingSetupBusinessTurn(
    { accountId: "account-1", rawInput: "consultoria" },
    dependenciesFor(
      { ok: true, candidates: [officialCandidate] },
      events,
      {
        persistResolution: async () => {
          events.push("persist_resolution");
          return false;
        },
      },
    ),
  );
  assert.deepEqual(result, { ok: false, reason: "resolution_persist_failed" });
  assert.deepEqual(events, ["match", "persist_resolution"]);
}

{
  const events: string[] = [];
  const result = await processPendingSetupBusinessTurn(
    { accountId: "account-1", rawInput: "consultoria" },
    dependenciesFor(
      { ok: true, candidates: [] },
      events,
      {
        persistAiResult: async () => {
          events.push("persist_ai_result");
          return false;
        },
      },
    ),
  );
  assert.deepEqual(result, { ok: false, reason: "result_persist_failed" });
  assert.deepEqual(events, [
    "match",
    "persist_resolution",
    "resolve_ai",
    "persist_ai_result",
  ]);
}

}

async function runConversationHistoryRetryCases(): Promise<void> {
  const scenarios = [
    {
      name: "business description",
      turnKind: "business_description" as const,
      userMessage: "consultoria",
      business: {
        kind: "awaiting_confirmation" as const,
        resolution: {
          accountId: "account-1",
          uxMode: "fallback_review" as const,
          options: [],
          suggestedTaxon: null,
          rawInput: "consultoria",
        },
      },
    },
    {
      name: "clarification",
      turnKind: "clarification" as const,
      userMessage: "para clínicas",
      business: {
        kind: "awaiting_confirmation" as const,
        resolution: {
          accountId: "account-1",
          uxMode: "fallback_review" as const,
          options: [],
          suggestedTaxon: null,
          rawInput: "consultoria. para clínicas",
        },
      },
    },
    {
      name: "business description auto-link",
      turnKind: "business_description" as const,
      userMessage: "agência digital",
      business: {
        kind: "ready_official" as const,
        rawInput: "agência digital",
        taxonName: "Agência de marketing digital",
      },
    },
    {
      name: "official confirmation",
      turnKind: "official_confirmation" as const,
      userMessage: "Consultoria financeira",
      business: {
        kind: "ready_official" as const,
        rawInput: "consultoria para clínicas",
        taxonName: "Consultoria financeira",
      },
    },
    {
      name: "operational confirmation",
      turnKind: "operational_confirmation" as const,
      userMessage: "Consultoria artesanal",
      business: { kind: "ready_fallback" as const, description: "Consultoria artesanal" },
    },
    {
      name: "fallback confirmation",
      turnKind: "fallback_confirmation" as const,
      userMessage: "Serviço artesanal",
      business: { kind: "ready_fallback" as const, description: "Serviço artesanal" },
    },
  ];

  const retryableLatestTurn: PendingSetupConversationTurn = {
    id: "d9428888-122b-4c2e-941f-70a76fb55e30",
    userMessage: "agência digital",
    turnKind: "business_description",
    status: "failed",
    productState: "failure",
    productMessage: "Não foi possível concluir este turno.",
    createdAt: "2026-09-20T12:00:00.000Z",
    completedAt: "2026-09-20T12:00:01.000Z",
  };
  const readyOfficial = scenarios[2].business;
  assert.equal(
    selectPendingSetupCompletionRetryTurn([retryableLatestTurn], readyOfficial)?.id,
    retryableLatestTurn.id,
  );
  assert.equal(
    selectPendingSetupCompletionRetryTurn(
      [{ ...retryableLatestTurn, status: "completed" }],
      readyOfficial,
    ),
    null,
  );
  assert.equal(
    selectPendingSetupCompletionRetryTurn(
      [{ ...retryableLatestTurn, userMessage: "outro negócio" }],
      readyOfficial,
    ),
    null,
  );

  for (const [index, scenario] of scenarios.entries()) {
    const turn: PendingSetupConversationTurn = {
      id: `d9428888-122b-4c2e-941f-70a76fb55e3${index}`,
      userMessage: scenario.userMessage,
      turnKind: scenario.turnKind,
      status: "pending",
      productState: null,
      productMessage: null,
      createdAt: "2026-09-20T12:00:00.000Z",
      completedAt: null,
    };
    const finalizedTurnIds = new Set<string>();
    let completionAttempts = 0;
    const complete = async () => {
      completionAttempts += 1;
      if (completionAttempts === 1) return false;
      finalizedTurnIds.add(turn.id);
      return true;
    };

    assert.equal(
      await reconcilePendingSetupTurnRetry(turn, scenario.business, complete),
      "persist_failed",
      `${scenario.name}: first history completion must remain retryable`,
    );
    assert.equal(
      await reconcilePendingSetupTurnRetry(turn, scenario.business, complete),
      "completed",
      `${scenario.name}: retry must reconcile from canonical state`,
    );
    assert.equal(finalizedTurnIds.size, 1, `${scenario.name}: exactly one turn must finish`);
  }

  let prematureCompletion = false;
  const confirmationBeforeMutation: PendingSetupConversationTurn = {
    id: "d9428888-122b-4c2e-941f-70a76fb55e39",
    userMessage: "Consultoria financeira",
    turnKind: "official_confirmation",
    status: "pending",
    productState: null,
    productMessage: null,
    createdAt: "2026-09-20T12:00:00.000Z",
    completedAt: null,
  };
  assert.equal(
    await reconcilePendingSetupTurnRetry(
      confirmationBeforeMutation,
      scenarios[0].business,
      async () => {
        prematureCompletion = true;
        return true;
      },
    ),
    "not_ready",
  );
  assert.equal(prematureCompletion, false);

  const crossedStates = [
    {
      turn: { ...confirmationBeforeMutation, turnKind: "official_confirmation" as const },
      business: { kind: "ready_fallback" as const, description: "Consultoria" },
    },
    {
      turn: { ...confirmationBeforeMutation, turnKind: "operational_confirmation" as const },
      business: {
        kind: "ready_official" as const,
        rawInput: "consultoria",
        taxonName: "Consultoria",
      },
    },
    {
      turn: { ...confirmationBeforeMutation, turnKind: "fallback_confirmation" as const },
      business: {
        kind: "ready_official" as const,
        rawInput: "consultoria",
        taxonName: "Consultoria",
      },
    },
    {
      turn: { ...confirmationBeforeMutation, turnKind: "business_description" as const },
      business: { kind: "ready_fallback" as const, description: "Consultoria" },
    },
    {
      turn: { ...confirmationBeforeMutation, turnKind: "clarification" as const },
      business: { kind: "ready_fallback" as const, description: "Consultoria" },
    },
  ];
  for (const crossed of crossedStates) {
    assert.equal(
      await reconcilePendingSetupTurnRetry(crossed.turn, crossed.business, async () => true),
      "not_ready",
      `${crossed.turn.turnKind} must not consume another operation's canonical state`,
    );
  }

  const divergentSameKindStates = [
    {
      turn: { ...confirmationBeforeMutation, turnKind: "official_confirmation" as const },
      business: {
        kind: "ready_official" as const,
        rawInput: "consultoria financeira",
        taxonName: "Contabilidade",
      },
    },
    {
      turn: { ...confirmationBeforeMutation, turnKind: "operational_confirmation" as const },
      business: { kind: "ready_fallback" as const, description: "Contabilidade" },
    },
    {
      turn: { ...confirmationBeforeMutation, turnKind: "fallback_confirmation" as const },
      business: { kind: "ready_fallback" as const, description: "Contabilidade" },
    },
    {
      turn: {
        ...confirmationBeforeMutation,
        turnKind: "business_description" as const,
        userMessage: "consultoria financeira",
      },
      business: {
        kind: "ready_official" as const,
        rawInput: "contabilidade",
        taxonName: "Contabilidade",
      },
    },
    {
      turn: {
        ...confirmationBeforeMutation,
        turnKind: "clarification" as const,
        userMessage: "para clínicas",
      },
      business: {
        kind: "ready_official" as const,
        rawInput: "consultoria. para varejo",
        taxonName: "Consultoria",
      },
    },
  ];
  for (const divergent of divergentSameKindStates) {
    assert.equal(
      await reconcilePendingSetupTurnRetry(divergent.turn, divergent.business, async () => true),
      "not_ready",
      `${divergent.turn.turnKind} must correlate the same canonical mutation`,
    );
  }
}

Promise.all([runBusinessConversationCases(), runConversationHistoryRetryCases()])
  .then(() => {
    console.log("ok - E10.9.3 to E10.9.6 pending setup contracts");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
