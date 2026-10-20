import type { AttendanceProposal } from "./attendance-core";
export const ATTENDANCE_GREETING = "Olá! Que prazer ter você aqui! Como posso te chamar?";
export function attendancePlainText(content: string): string {
  return content.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1");
}
// Present the current code-owned opening without rewriting the stored Dialogue.
export function attendanceMessageContent(message: Pick<PendingSetupMessage, "ordinal" | "role" | "content">): string {
  const content = message.ordinal === 1 && message.role === "assistant" &&
    ["Olá! Como prefere ser chamado?", "Como prefere ser chamado?"].includes(message.content)
    ? ATTENDANCE_GREETING : message.content;
  return message.role === "assistant" ? attendancePlainText(content) : content;
}
export function attendanceConfirmationQuestion(proposal: AttendanceProposal): string {
  return proposal.kind === "existing" ? "Esse entendimento e essa categoria correspondem ao seu negócio?" : "Esse entendimento descreve seu negócio?";
}
export function attendanceButtonContent(proposal: AttendanceProposal, intent: "confirm" | "clarify"): string {
  return [`Pergunta exibida: ${attendanceConfirmationQuestion(proposal)}`,
    ...(proposal.kind === "existing" ? [`Categoria proposta: ${proposal.taxonName}.`] : []),
    `Escolha pelo botão: ${intent === "confirm" ? "Sim, está correto" : "Quero explicar melhor"}.`].join("\n");
}
export const PENDING_SETUP_STAGES = [
  "identity",
  "business_understanding",
  "niche_confirmation",
  "ready_to_complete",
  "completed",
] as const;

export type PendingSetupStage = (typeof PENDING_SETUP_STAGES)[number];
export type PendingSetupResolutionOutcome = "official" | "operational_fallback";
export type PendingSetupConfirmationKind = PendingSetupResolutionOutcome;

export type PendingSetupMessage = Readonly<{
  id: string;
  ordinal: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}>;

export type PendingSetupAccountContext = Readonly<{
  summary: string | null;
  updatedAt: string;
}>;

export type PendingSetupConversation = Readonly<{
  id: string;
  accountId: string;
  userId: string;
  preferredName: string | null;
  businessDisplayName: string | null;
  businessNameCandidate?: string | null;
  whatsappRequested?: boolean;
  whatsappValue?: string | null;
  businessContextText: string | null;
  stage: PendingSetupStage;
  confirmationKind: PendingSetupConfirmationKind | null;
  resolutionOutcome: PendingSetupResolutionOutcome | null;
  attendanceEnabled?: boolean;
  preferredNameDeclined?: boolean;
  attendanceProposal?: AttendanceProposal | null;
  accountContext?: PendingSetupAccountContext;
  attendanceTurnIntent?: "initialize" | "message" | "confirm" | "clarify" | null;
  openAiCallCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  messages: readonly PendingSetupMessage[];
}>;

export type PendingSetupWriteResult =
  | Readonly<{ ok: true; version: number }>
  | Readonly<{
      ok: false;
      reason: "not_found" | "conflict" | "forbidden" | "invalid" | "write_failed";
    }>;

export type PendingSetupOpenAiCallClaimResult =
  | Readonly<{ ok: true; count: number }>
  | Readonly<{
      ok: false;
      reason: "limit_reached" | "conflict" | "forbidden" | "invalid" | "write_failed";
    }>;
