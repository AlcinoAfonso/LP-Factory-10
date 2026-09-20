export const PENDING_SETUP_STAGES = [
  "identity",
  "business_understanding",
  "niche_confirmation",
  "ready_to_complete",
  "completed",
] as const;

export type PendingSetupStage = (typeof PENDING_SETUP_STAGES)[number];
export type PendingSetupResolutionOutcome = "official" | "operational_fallback";

export type PendingSetupMessage = Readonly<{
  id: string;
  ordinal: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}>;

export type PendingSetupConversation = Readonly<{
  id: string;
  accountId: string;
  userId: string;
  preferredName: string | null;
  businessContextText: string | null;
  stage: PendingSetupStage;
  resolutionOutcome: PendingSetupResolutionOutcome | null;
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
