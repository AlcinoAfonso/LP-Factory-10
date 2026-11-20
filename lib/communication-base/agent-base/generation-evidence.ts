import "server-only";

import { createServiceClient } from "../../supabase/service";
import type { AgentBaseEnvironment } from "../config";

export type Category3FunctionalOutcome = "saved" | "failed" | "interrupted";
export const CATEGORY_3_AUDIT_ENTITY = "category_3_generation";
export const CATEGORY_3_ATTEMPT_EVENT = "category_3_generation_attempt";

export async function recordCategory3Evidence(input: Readonly<{
  generationId: string;
  accountId: string;
  environment: AgentBaseEnvironment;
  evidence: { executionId: string } | { outcome: Category3FunctionalOutcome; executionIds: string[] };
}>) {
  const { generationId, accountId, environment, evidence } = input;
  const attempt = "executionId" in evidence;
  try {
    // Direct service-role insert. The row carries no actor, payload, or financial amount.
    const { error } = await createServiceClient().from("audit_logs").insert({
      ...(attempt ? { id: evidence.executionId } : {}),
      table_name: CATEGORY_3_AUDIT_ENTITY,
      record_id: generationId,
      account_id: accountId,
      action: "insert",
      event: attempt ? CATEGORY_3_ATTEMPT_EVENT : `category_3_generation_${evidence.outcome}`,
      changes_json: attempt ? { environment } : { environment, execution_ids: evidence.executionIds },
    }).abortSignal(AbortSignal.timeout(600));
    if (!error) return;
  } catch {
    // Evidence collection must preserve the functional result.
  }
  console.warn(JSON.stringify({ event: "category_3_generation_evidence_unavailable", generationId,
    environment, phase: attempt ? "attempt" : "outcome" }));
}
