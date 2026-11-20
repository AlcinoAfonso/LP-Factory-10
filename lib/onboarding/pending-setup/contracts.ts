import type { AttendanceProposal } from "./attendance-core";
import type { SynthesisReference } from "../niche-agent/dialogue";
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
  businessContextText: string | null;
  stage: PendingSetupStage;
  confirmationKind: PendingSetupConfirmationKind | null;
  resolutionOutcome: PendingSetupResolutionOutcome | null;
  attendanceEnabled?: boolean;
  preferredNameDeclined?: boolean;
  attendanceProposal?: AttendanceProposal | null;
  accountContext?: PendingSetupAccountContext;
  dialogueState?: Readonly<{
    requestId?: string | null;
    lastRequestId?: string | null;
    nameProposal?: string | null;
    acceptedName?: string | null;
    operationalAccepted?: boolean;
    synthesis?: SynthesisReference | null;
    synthesisAccepted?: boolean;
    synthesisPartialId?: string | null;
    nicheAccepted?: boolean;
  }>;
  attendanceTurnIntent?: "initialize" | "message" | "confirm" | "clarify" | null;
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
