import assert from "node:assert/strict";

import type {
  AiNicheResolutionOutput,
  MatchBusinessTaxonsResult,
  TaxonMatchCandidate,
} from "../niche-resolution/contracts";
import {
  appendBusinessClarification,
  processPendingSetupBusinessTurn,
  type PendingSetupBusinessDependencies,
  validateBusinessDescription,
} from "./businessConversationCore";
import { validatePreferredName } from "./contracts";

assert.deepEqual(validatePreferredName("  Alcino   Afonso  "), {
  ok: true,
  value: "Alcino Afonso",
});
assert.equal(validatePreferredName("   ").ok, false);
assert.equal(validatePreferredName("x".repeat(81)).ok, false);

assert.deepEqual(validateBusinessDescription("  consultoria   financeira  "), {
  ok: true,
  value: "consultoria financeira",
});
assert.equal(validateBusinessDescription("x").ok, false);
assert.equal(validateBusinessDescription("x".repeat(501)).ok, false);
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

runBusinessConversationCases()
  .then(() => {
    console.log("ok - E10.9.3 identity and E10.9.4 business conversation contracts");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
