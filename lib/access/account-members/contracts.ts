import type { MemberRole, MemberStatus } from "@/lib/types/status";

export const MANAGEABLE_MEMBER_ROLES = ["admin", "editor", "viewer"] as const;

export type ManageableMemberRole = Exclude<MemberRole, "owner">;

export type AccountMemberRecord = Readonly<{
  id: string;
  accountId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: string;
  invitedBy: string | null;
}>;

export type AccountMember = AccountMemberRecord &
  Readonly<{
    email: string;
  }>;

export type AuthUserSummary = Readonly<{
  id: string;
  email: string;
  isConfirmed: boolean;
}>;

export type AccountMemberError =
  | "invalid_email"
  | "invalid_role"
  | "member_not_found"
  | "already_member"
  | "owner_protected"
  | "actor_protected"
  | "invalid_transition"
  | "membership_conflict"
  | "auth_lookup_failed"
  | "auth_create_failed"
  | "auth_invite_failed"
  | "feature_disabled"
  | "external_config_missing"
  | "invite_state_unavailable"
  | "invalid_invite_state"
  | "read_failed"
  | "write_failed";

export type AccountMemberResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: AccountMemberError }>;

export type InviteCycleClassification =
  | "new_user"
  | "confirmed_user"
  | "already_member"
  | "pending_confirmed"
  | "pending_unconfirmed"
  | "restart_confirmed"
  | "restart_unconfirmed";

export type AdminMemberOperation =
  | Readonly<{ type: "change_role"; role: ManageableMemberRole }>
  | Readonly<{ type: "deactivate" }>
  | Readonly<{ type: "revoke" }>;

export type SelfServiceInviteOperation = "accept" | "decline";

export type MemberTransition = Readonly<{
  nextRole: MemberRole;
  nextStatus: MemberStatus;
  idempotent: boolean;
}>;

export type MemberMutationResult = Readonly<{
  member: AccountMemberRecord;
  idempotent: boolean;
}>;

export type AccountMemberInvitationResult = Readonly<{
  member: AccountMemberRecord;
}>;
