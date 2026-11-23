import { z } from "zod";
import type { SynthesisReference } from "../niche-agent/dialogue";
export const pendingSetupProposal = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("semantic"), taxonId: z.null(), taxonName: z.null(), nicheDescription: z.string().trim().min(1).max(120), expectedNicheRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) }),
  z.strictObject({ kind: z.literal("existing"), taxonId: z.uuid(), taxonName: z.string().trim().min(1).max(120) }),
  z.strictObject({ kind: z.literal("operational_fallback"), taxonId: z.null(), taxonName: z.null() }),
]);
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
  attendanceProposal?: z.output<typeof pendingSetupProposal> | null;
  accountContext?: PendingSetupAccountContext;
  dialogueState?: Readonly<{
    requestId?: string | null;
    lastRequestId?: string | null;
    nameProposal?: string | null;
    acceptedName?: string | null;
    synthesis?: SynthesisReference | null;
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
