import "server-only";
import { attendanceContactProjection, attendanceProjection, attendanceProposal, attendanceSummary, readAttendanceBusinessNameCandidate, type AttendanceOutput } from "./attendance-core";
import { ATTENDANCE_GREETING } from "./contracts";
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
    const reserved = await dependencies.load(input);
    if (!reserved || reserved.version !== claimed.version) throw new Error("reserved_turn_read_failed");
    if (!reserved.accountContext) throw new Error("account_context_read_failed");
    if (intent === "initialize") {
      const primary = await dependencies.primary(input.accountId);
      if (primary === undefined) throw new Error("primary_read_failed");
      const output: AttendanceOutput = { reply: ATTENDANCE_GREETING, preferredName: reserved.preferredName,
        preferredNameDeclined: reserved.preferredNameDeclined ?? false,
        businessNameCandidate: readAttendanceBusinessNameCandidate(reserved.accountContext.summary),
        requestWhatsapp: false, whatsappReference: null, whatsappDeclined: false, businessUnderstanding: "",
        confirmedUnderstanding: null, suggestions: [], sufficientUnderstanding: false, readyToComplete: false,
        closureReason: null, action: "ask", existingTaxonId: null };
      const written = await dependencies.commit({ ...fence, output, proposal: null, confirm: false,
        observedPrimaryTaxonId: primary, summary: reserved.accountContext.summary ?? attendanceSummary(output, null, null) });
      if (!written.ok) await dependencies.release(fence);
      return written;
    }
    // Independent SELECTs; the reserved conversation and commit fence remain ordered.
    const [catalog, currentPrimaryTaxonId, operational] = await Promise.all([
      dependencies.catalog(),
      dependencies.primary(input.accountId),
      dependencies.operational({ accountId: input.accountId, throwOnReadError: true }),
    ]);
    if (!catalog) throw new Error("catalog_unavailable");
    if (currentPrimaryTaxonId === undefined) throw new Error("primary_read_failed");
    const confirmation = intent === "confirm";
    const latestAnswer = input.content ?? reserved.messages.filter(message => message.role === "user").at(-1)?.content;
    const marketQuery = [latestAnswer, reserved.businessContextText].filter(Boolean).join("\n");
    const marketContext = await dependencies.market(marketQuery, catalog,
      currentPrimaryTaxonId ?? reserved.attendanceProposal?.taxonId ?? null);
    if (marketContext === null) throw new Error("market_context_read_failed");
    const context = { ...attendanceProjection(reserved, catalog), marketContext,
      clarificationRequested: intent === "clarify" && Boolean(conversation.attendanceProposal),
      confirmedOperationalUnderstanding: Boolean(operational),
      confirmedProposal: confirmation ? reserved.attendanceProposal ?? null : null, currentPrimaryTaxonId };
    if (confirmation && (!context.confirmedProposal || !reserved.businessContextText?.trim())) throw new Error("confirmation_proposal_missing");
    const answer = await dependencies.request({ accountId: input.accountId, context });
    if (!answer.ok || (confirmation && answer.output.action !== "confirm")) throw new Error("provider_unavailable");
    const output = confirmation || answer.output.businessUnderstanding === context.displayedUnderstanding
      ? { ...answer.output, businessUnderstanding: reserved.businessContextText! }
      : answer.output.closureReason && !answer.output.businessUnderstanding
        ? { ...answer.output, businessUnderstanding: reserved.businessContextText ?? "" } : answer.output;
    const body = output.reply.replace(/^\s*Prazer,\s*[^!\n]{1,100}!\s*/iu, "").trim();
    const greeting = output.preferredName && !context.greetedByName ? `Prazer, ${output.preferredName}!` : "";
    const reply = [greeting, body].filter(Boolean).join(" ");
    if (!reply) throw new Error("empty_attendance_reply");
    const written = await dependencies.commit({
      ...fence, output: { ...output, reply }, confirm: confirmation, observedPrimaryTaxonId: currentPrimaryTaxonId,
      proposal: confirmation ? null : attendanceProposal(output, catalog),
      summary: attendanceSummary(output, catalog.find(taxon => taxon.id === currentPrimaryTaxonId)?.name ?? null,
        context.confirmedProposal, reserved.accountContext.summary, attendanceContactProjection(reserved.messages).contacts),
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
