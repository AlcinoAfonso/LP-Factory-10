import type { AccountStatus, MemberRole, MemberStatus } from "@/lib/types/status";

import {
  MANAGEABLE_MEMBER_ROLES,
  type AccountMemberError,
  type AccountMemberInviteChannel,
  type AccountMemberResult,
  type AdminMemberOperation,
  type InviteCycleClassification,
  type ManageableMemberRole,
  type MemberTransition,
  type SelfServiceInviteOperation,
} from "./contracts";

export type AccountMemberInviteEligibilityDecision =
  | Readonly<{ allowed: true }>
  | Readonly<{
      allowed: false;
      error: Extract<AccountMemberError, "account_not_active" | "commercial_entitlement_required">;
    }>;

export type AccountMemberInviteDecisionEvent = Readonly<{
  event: "account_member_invite_decision";
  operation: "invite" | "resend";
  result: "allowed" | "denied" | "error";
  reason: string;
  account_id: string;
  actor_role: Extract<MemberRole, "owner" | "admin">;
  request_id: string | null;
  latency_ms: number;
}>;

export type PreservedAccountMemberOperation =
  | "list"
  | "change_role"
  | "deactivate"
  | "revoke"
  | "accept"
  | "decline";

export async function runPreservedAccountMemberOperation<T>(input: Readonly<{
  operation: PreservedAccountMemberOperation;
  execute: () => Promise<T>;
}>): Promise<T> {
  void input.operation;
  return input.execute();
}

export function decideAccountMemberInviteEligibility(input: Readonly<{
  accountStatus: AccountStatus;
  isCommerciallyEligible: boolean;
}>): AccountMemberInviteEligibilityDecision {
  if (input.accountStatus !== "active") {
    return { allowed: false, error: "account_not_active" };
  }
  if (!input.isCommerciallyEligible) {
    return { allowed: false, error: "commercial_entitlement_required" };
  }
  return { allowed: true };
}

export function createAccountMemberInviteDecisionRecorder(
  write: (event: AccountMemberInviteDecisionEvent) => void,
) {
  let recorded = false;
  return {
    record(event: AccountMemberInviteDecisionEvent) {
      if (recorded) return;
      recorded = true;
      try {
        write(event);
      } catch {
        // Decision logging must never alter the invitation outcome.
      }
    },
  } as const;
}

export async function runAccountMemberInviteWhenEligible<T>(input: Readonly<{
  decision: AccountMemberInviteEligibilityDecision;
  recordDecision: (result: "allowed" | "denied", reason: string) => void;
  onAllowed: () => Promise<AccountMemberResult<T>>;
}>): Promise<AccountMemberResult<T>> {
  if (!input.decision.allowed) {
    input.recordDecision("denied", input.decision.error);
    return { ok: false, error: input.decision.error };
  }
  input.recordDecision("allowed", "commercial_entitlement_confirmed");
  return input.onAllowed();
}

export function normalizeMemberEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidMemberEmail(value: string): boolean {
  const email = normalizeMemberEmail(value);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isManageableMemberRole(value: string): value is ManageableMemberRole {
  return MANAGEABLE_MEMBER_ROLES.includes(value as ManageableMemberRole);
}

export function isSelfServiceInviteEligible(input: Readonly<{
  status: MemberStatus;
  channel: AccountMemberInviteChannel | null;
  hasActiveMembership: boolean;
}>): boolean {
  return (
    input.status === "pending" &&
    (input.channel === "in_app" ||
      (input.channel === "email" && input.hasActiveMembership))
  );
}

export function decideInviteChannel(input: Readonly<{
  existingChannel: AccountMemberInviteChannel | null;
  preparedIdempotently: boolean;
  isConfirmed: boolean;
}>): AccountMemberInviteChannel | null {
  if (!input.preparedIdempotently) return input.isConfirmed ? "in_app" : "email";
  if (input.existingChannel) return input.existingChannel;
  if (input.isConfirmed) return null;
  return "email";
}

export function selectLatestInviteChannels(
  currentCycleIds: ReadonlyMap<string, string>,
  orderedEvents: readonly Readonly<{
    memberId: string;
    cycleId: string;
    channel: AccountMemberInviteChannel;
  }>[],
): ReadonlyMap<string, AccountMemberInviteChannel> {
  const channels = new Map<string, AccountMemberInviteChannel>();
  for (const event of orderedEvents) {
    if (
      !channels.has(event.memberId) &&
      currentCycleIds.get(event.memberId) === event.cycleId
    ) {
      channels.set(event.memberId, event.channel);
    }
  }
  return channels;
}

export type InviteAuthRequestDecision =
  | "not_account_member_invite"
  | "feature_disabled"
  | "invalid_invite_state"
  | "verify_invite_state";

export function decideInviteAuthRequest(input: Readonly<{
  type: string;
  inviteState: string;
  featureEnabled: boolean;
}>): InviteAuthRequestDecision {
  if (input.type !== "invite") return "not_account_member_invite";
  if (!input.featureEnabled) return "feature_disabled";
  return input.inviteState ? "verify_invite_state" : "invalid_invite_state";
}

export function shouldDiscardInviteStateAfterActivationError(
  error: AccountMemberError,
): boolean {
  return error === "member_not_found" || error === "owner_protected" || error === "invalid_transition";
}

export function classifyInviteCycle(input: Readonly<{
  existingStatus: MemberStatus | null;
  isConfirmed: boolean;
}>): InviteCycleClassification {
  if (input.existingStatus === "active") return "already_member";
  if (input.existingStatus === "pending") {
    return input.isConfirmed ? "pending_confirmed" : "pending_unconfirmed";
  }
  if (input.existingStatus === "inactive" || input.existingStatus === "revoked") {
    return input.isConfirmed ? "restart_confirmed" : "restart_unconfirmed";
  }
  return input.isConfirmed ? "confirmed_user" : "new_user";
}

export function decideAdminMemberTransition(input: Readonly<{
  actorUserId: string;
  targetUserId: string;
  targetRole: MemberRole;
  targetStatus: MemberStatus;
  operation: AdminMemberOperation;
}>): AccountMemberResult<MemberTransition> {
  if (input.targetRole === "owner") return failure("owner_protected");
  if (input.actorUserId === input.targetUserId) return failure("actor_protected");

  if (input.operation.type === "change_role") {
    if (!isManageableMemberRole(input.operation.role)) return failure("invalid_role");
    if (input.targetStatus !== "active") return failure("invalid_transition");
    return success({
      nextRole: input.operation.role,
      nextStatus: "active",
      idempotent: input.targetRole === input.operation.role,
    });
  }

  if (input.operation.type === "deactivate") {
    if (input.targetStatus === "inactive") {
      return success({ nextRole: input.targetRole, nextStatus: "inactive", idempotent: true });
    }
    if (input.targetStatus !== "active") return failure("invalid_transition");
    return success({ nextRole: input.targetRole, nextStatus: "inactive", idempotent: false });
  }

  if (input.targetStatus === "revoked") {
    return success({ nextRole: input.targetRole, nextStatus: "revoked", idempotent: true });
  }
  if (input.targetStatus !== "pending") return failure("invalid_transition");
  return success({ nextRole: input.targetRole, nextStatus: "revoked", idempotent: false });
}

export function decideSelfServiceInviteTransition(input: Readonly<{
  actorUserId: string;
  targetUserId: string;
  targetRole: MemberRole;
  targetStatus: MemberStatus;
  operation: SelfServiceInviteOperation;
}>): AccountMemberResult<MemberTransition> {
  if (input.actorUserId !== input.targetUserId) return failure("member_not_found");
  if (input.targetRole === "owner") return failure("owner_protected");

  if (input.operation === "accept") {
    if (input.targetStatus === "active") {
      return success({ nextRole: input.targetRole, nextStatus: "active", idempotent: true });
    }
    if (input.targetStatus !== "pending") return failure("invalid_transition");
    return success({ nextRole: input.targetRole, nextStatus: "active", idempotent: false });
  }

  if (input.targetStatus === "revoked") {
    return success({ nextRole: input.targetRole, nextStatus: "revoked", idempotent: true });
  }
  if (input.targetStatus !== "pending") return failure("invalid_transition");
  return success({ nextRole: input.targetRole, nextStatus: "revoked", idempotent: false });
}

function success<T>(value: T): AccountMemberResult<T> {
  return { ok: true, value };
}

function failure(error: AccountMemberError): AccountMemberResult<never> {
  return { ok: false, error };
}
