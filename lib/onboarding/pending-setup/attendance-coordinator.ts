import "server-only";
import { attendanceProjection, attendanceProposal, attendanceSummary } from "./attendance-core";
import { requestAttendance } from "./attendance-provider";
import { loadPendingSetupConversation } from "./adapters/pendingSetupConversationAdapter";
import { claimAttendanceTurn, commitAttendanceTurn, releaseAttendanceTurn,
  readAttendancePrimary, discardAttendanceProposal,
  type AttendanceTurnIdentity } from "./adapters/pendingSetupAttendanceAdapter";

import { readAttendanceCatalog, readAttendanceMarketContext } from "./adapters/pendingSetupCatalogContextAdapter";
import { getConfirmedOperationalNicheResolutionLabel } from "../niche-resolution/adapters/accountNicheResolutionUserAdapter";

const attendanceDependencies = {
  load: loadPendingSetupConversation, catalog: readAttendanceCatalog, claim: claimAttendanceTurn,
  request: requestAttendance, commit: commitAttendanceTurn, release: releaseAttendanceTurn,
  primary: readAttendancePrimary, discard: discardAttendanceProposal,
  market: readAttendanceMarketContext, operational: getConfirmedOperationalNicheResolutionLabel,
};
export type AttendanceDependencies = typeof attendanceDependencies;

export async function conductAttendanceTurn(input: Readonly<{
  accountId: string; userId: string; conversationId: string; expectedVersion: number;
  content: string | null; intent: "initialize" | "message" | "confirm" | "clarify" | "resume";
}>, dependencies: AttendanceDependencies = attendanceDependencies) {
  const conversation = await dependencies.load(input);
  if (!conversation || conversation.id !== input.conversationId || conversation.version !== input.expectedVersion)
    return { ok: false as const, reason: "conflict" as const };
  if ((conversation.attendanceTurnIntent && input.intent !== "resume") ||
    (input.intent === "resume" && !conversation.attendanceTurnIntent))
    return { ok: false as const, reason: "invalid" as const };
  const intent = input.intent === "resume" ? conversation.attendanceTurnIntent! : input.intent;
  const turnToken = crypto.randomUUID();
  const identity: AttendanceTurnIdentity = { ...input, turnToken };
  const claimed = await dependencies.claim({ ...identity, content: input.content, intent });
  if (!claimed.ok) return claimed;
  const fence = { ...identity, expectedVersion: claimed.version };
  try {
    const catalog = await dependencies.catalog();
    if (!catalog) throw new Error("catalog_unavailable");
    const reserved = await dependencies.load(input);
    if (!reserved || reserved.version !== claimed.version) throw new Error("reserved_turn_read_failed");
    const currentPrimaryTaxonId = await dependencies.primary(input.accountId);
    if (currentPrimaryTaxonId === undefined) throw new Error("primary_read_failed");
    const confirmation = intent === "confirm";
    if (!reserved.accountContext) throw new Error("account_context_read_failed");
    const operational = await dependencies.operational({ accountId: input.accountId });
    const marketContext = await dependencies.market(reserved.businessContextText ?? input.content ?? "", catalog,
      currentPrimaryTaxonId ?? reserved.attendanceProposal?.taxonId ?? null);
    if (marketContext === null) throw new Error("market_context_read_failed");
    const context = { ...attendanceProjection(reserved, catalog), marketContext,
      confirmedOperationalUnderstanding: Boolean(operational),
      confirmedProposal: confirmation ? reserved.attendanceProposal ?? null : null, currentPrimaryTaxonId };
    if (confirmation && !context.confirmedProposal) throw new Error("confirmation_proposal_missing");
    const answer = await dependencies.request({ accountId: input.accountId, context });
    if (!answer.ok || (confirmation && answer.output.action !== "confirm")) throw new Error("provider_unavailable");
    const written = await dependencies.commit({
      ...fence, output: answer.output, confirm: confirmation, observedPrimaryTaxonId: currentPrimaryTaxonId,
      proposal: confirmation ? null : attendanceProposal(answer.output, catalog),
      summary: confirmation ? context.summary?.replace(/^Classificação confirmada:.*$/m,
        "Classificação confirmada: " + (context.confirmedProposal?.taxonName ?? "Não identificada."))
        ?? attendanceSummary(answer.output, null, context.confirmedProposal)
        : attendanceSummary(answer.output, catalog.find(taxon => taxon.id === currentPrimaryTaxonId)?.name ?? null, null),
    });
    if (!written.ok) {
      if (written.reason === "primary_conflict" || (confirmation && written.reason === "invalid")) {
        const recovered = await dependencies.discard(fence);
        if (recovered.ok) return { ok: true as const }; // Persisted pending state, never a success message.
      }
      await dependencies.release(fence);
      return written;
    }
    return { ok: true as const };
  } catch {
    const released = await dependencies.release(fence);
    console.error("pending_setup_attendance_failed", {
      outcome: "not_committed", release: released.ok ? "saved" : released.reason,
    });
    return { ok: false as const, reason: "unavailable" as const };
  }
}
