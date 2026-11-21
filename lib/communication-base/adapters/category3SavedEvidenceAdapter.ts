import "server-only";

import { createServiceClient } from "../../supabase/service";
import { category3DispatchFingerprint, category3SavedEvent, category3SavedTable, type Category3CostIdentity } from "../../openai-costs/category-3-costs";

export async function recordCategory3SavedEvidence(identity: Category3CostIdentity, dispatchedIds: readonly string[]) {
  const { generationId, accountId, environment } = identity;
  try {
    const dispatch = dispatchedIds.length ? category3DispatchFingerprint(new Set(dispatchedIds)) : undefined;
    await createServiceClient().from("audit_logs").insert({
      id: generationId,
      table_name: category3SavedTable,
      record_id: accountId,
      account_id: accountId,
      action: "update",
      event: category3SavedEvent,
      changes_json: { environment, ...(dispatch ? { dispatch } : {}) },
    }).abortSignal(AbortSignal.timeout(1000));
  } catch {
    // The save is already committed. The Admin remains uncertain if evidence is absent.
  }
}
