import "server-only";
import { attendanceProjection, attendanceProposal } from "./attendance-core";
import { requestAttendance } from "./attendance-provider";
import { loadPendingSetupConversation } from "./adapters/pendingSetupConversationAdapter";
import { claimAttendanceTurn, commitAttendanceTurn, readAttendanceCatalog, releaseAttendanceTurn,
  type AttendanceTurnIdentity } from "./adapters/pendingSetupAttendanceAdapter";

const attendanceDependencies = {
  load: loadPendingSetupConversation, catalog: readAttendanceCatalog, claim: claimAttendanceTurn,
  request: requestAttendance, commit: commitAttendanceTurn, release: releaseAttendanceTurn,
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
    const confirmation = intent === "confirm";
    const context = { ...attendanceProjection(reserved, catalog),
      confirmedProposal: confirmation ? reserved.attendanceProposal ?? null : null };
    if (confirmation && !context.confirmedProposal) throw new Error("confirmation_proposal_missing");
    let answer = await dependencies.request({ accountId: input.accountId, context });
    if (answer.ok && answer.output.action === "research" && !confirmation) {
      answer = await dependencies.request({ accountId: input.accountId, context: { ...context, research: true } });
      // One focal research pass per turn; subsequent useful conversation is unrestricted.
      if (answer.ok && answer.output.action === "research") throw new Error("research_unresolved");
    }
    if (!answer.ok || (confirmation && answer.output.action !== "confirm")) throw new Error("provider_unavailable");
    const written = await dependencies.commit({
      ...fence, output: answer.output, confirm: confirmation,
      proposal: confirmation ? null : attendanceProposal(answer.output, answer.sources),
    });
    if (!written.ok) {
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

