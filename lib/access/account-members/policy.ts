import type { MemberRole, MemberStatus } from "@/lib/types/status";

import {
  MANAGEABLE_MEMBER_ROLES,
  type AccountMemberError,
  type AccountMemberResult,
  type AdminMemberOperation,
  type InviteCycleClassification,
  type ManageableMemberRole,
  type MemberTransition,
  type SelfServiceInviteOperation,
} from "./contracts";

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
