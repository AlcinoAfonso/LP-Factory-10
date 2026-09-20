import "server-only";

import { clientOpenAiCostContext } from "../../openai-costs";
import {
  getActionablePendingSetupNicheResolutionForAccount,
  getConfirmedOperationalNicheResolutionLabel,
  readPersistedNicheResolutionRawInputForAccount,
} from "../niche-resolution/adapters/accountNicheResolutionUserAdapter";
import {
  updateAccountNicheResolutionAiResult,
  upsertAccountNicheResolution,
} from "../niche-resolution/adapters/accountNicheResolutionAdapter";
import {
  getActivePrimaryAccountTaxon,
  linkAccountTaxonomyFromDeterministicDecision,
} from "../niche-resolution/adapters/accountTaxonomyAdapter";
import { matchBusinessTaxonsDeterministic } from "../niche-resolution/adapters/taxonMatchAdapter";
import { resolveNicheWithOpenAi } from "../niche-resolution/adapters/openAiResolver";
import { processPendingSetupBusinessTurn } from "./businessConversationCore";
import type { PendingSetupBusinessSnapshot } from "./contracts";

export async function processPendingSetupBusiness(input: {
  accountId: string;
  rawInput: unknown;
}) {
  return processPendingSetupBusinessTurn(input, {
    match: matchBusinessTaxonsDeterministic,
    persistResolution: upsertAccountNicheResolution,
    linkOfficial: linkAccountTaxonomyFromDeterministicDecision,
    resolveWithAi: async ({ rawInput, decision, candidates }) => {
      const result = await resolveNicheWithOpenAi({
        rawInput,
        decision,
        candidates,
        apiKey: process.env.OPENAI_API_KEY,
        financialContext: clientOpenAiCostContext(input.accountId, {
          kind: "niche_resolution",
          eventId: crypto.randomUUID(),
        }),
        executionOrigin: "runtime",
      });

      return result.ok
        ? { ok: true as const, model: result.model, output: result.output }
        : { ok: false as const, model: result.model, reason: result.reason };
    },
    persistAiResult: updateAccountNicheResolutionAiResult,
  });
}

export async function loadPendingSetupBusinessSnapshot(
  accountId: string,
): Promise<PendingSetupBusinessSnapshot> {
  const primary = await getActivePrimaryAccountTaxon({ accountId });
  if (primary) {
    const rawInput = await readPersistedNicheResolutionRawInputForAccount({ accountId });
    if (!rawInput) throw new Error("pending_setup_official_raw_input_missing");
    return { kind: "ready_official", rawInput, taxonName: primary.name };
  }

  const operationalDescription = await getConfirmedOperationalNicheResolutionLabel({
    accountId,
  });
  if (operationalDescription) {
    return { kind: "ready_fallback", description: operationalDescription };
  }

  const actionable = await getActionablePendingSetupNicheResolutionForAccount({
    accountId,
  });
  if (actionable) return { kind: "awaiting_confirmation", resolution: actionable };

  return { kind: "awaiting_business" };
}
