import "server-only";

import type {
  AccountMembersManagerContext,
  AccountMemberUserContext,
} from "@/lib/access/guards";

import {
  applyAdminMemberOperation,
  applySelfServiceInviteOperation,
  getAccountSubdomain,
  getSelfServiceInviteMembership,
  listAccountMemberships,
  preparePendingMembership,
} from "./adapters/accountMembersAdapter";
import {
  createUnconfirmedAuthUser,
  findAuthUserByEmail,
  getAuthEmailsByUserIds,
  sendAuthInvite,
} from "./adapters/authAdminAdapter";
import { getAccountMembersConfirmUrl, isAccountMembersEnabled } from "./config";
import type {
  AccountMember,
  AccountMemberInvitationResult,
  AccountMemberRecord,
  AccountMemberResult,
  ManageableMemberRole,
} from "./contracts";
import { createSignedInviteState } from "./invite-state";
import { isManageableMemberRole, isValidMemberEmail, normalizeMemberEmail } from "./policy";

export type {
  AccountMember,
  AccountMemberError,
  AccountMemberInvitationResult,
  AccountMemberRecord,
  AccountMemberResult,
  AdminMemberOperation,
  AuthUserSummary,
  InviteCycleClassification,
  ManageableMemberRole,
  MemberMutationResult,
  SelfServiceInviteOperation,
} from "./contracts";

export async function listAccountMembers(
  context: AccountMembersManagerContext,
): Promise<AccountMemberResult<readonly AccountMember[]>> {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" };

  const memberships = await listAccountMemberships(context.accountId);
  if (!memberships.ok) return memberships;

  const emails = await getAuthEmailsByUserIds(memberships.value.map((member) => member.userId));
  if (!emails.ok) return emails;

  const members = memberships.value.map((member) => {
    const email = emails.value.get(member.userId);
    return email ? { ...member, email } : null;
  });

  if (members.some((member) => member === null)) {
    return { ok: false, error: "auth_lookup_failed" };
  }

  return {
    ok: true,
    value: members.filter((member): member is AccountMember => member !== null),
  };
}

export async function inviteAccountMember(
  context: AccountMembersManagerContext,
  input: Readonly<{ email: string; role: ManageableMemberRole }>,
): Promise<AccountMemberResult<AccountMemberInvitationResult>> {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" };

  const email = normalizeMemberEmail(input.email);
  if (!isValidMemberEmail(email)) return { ok: false, error: "invalid_email" };
  if (!isManageableMemberRole(input.role)) return { ok: false, error: "invalid_role" };

  const resolved = await findAuthUserByEmail(email);
  if (!resolved.ok) return resolved;

  let user = resolved.value;
  if (!user) {
    const created = await createUnconfirmedAuthUser(email);
    if (!created.ok) return created;
    user = created.value;
  }

  const prepared = await preparePendingMembership({
    accountId: context.accountId,
    userId: user.id,
    role: input.role,
    invitedBy: context.actorUserId,
  });
  if (!prepared.ok) return prepared;

  if (!user.isConfirmed) {
    const inviteState = createSignedInviteState({
      accountUserId: prepared.value.member.id,
      accountId: context.accountId,
      userId: user.id,
    });
    if (!inviteState.ok) return inviteState;

    const redirectTo = getAccountMembersConfirmUrl();
    if (!redirectTo.ok) return redirectTo;

    const delivery = await sendAuthInvite({
      email,
      inviteState: inviteState.value,
      redirectTo: redirectTo.value,
    });
    if (!delivery.ok) return delivery;
  }

  return { ok: true, value: { member: prepared.value.member } };
}

export async function mutateAccountMember(
  context: AccountMembersManagerContext,
  input: Readonly<{
    memberId: string;
    operation: import("./contracts").AdminMemberOperation;
  }>,
) {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" } as const;

  return applyAdminMemberOperation({
    accountId: context.accountId,
    memberId: input.memberId,
    actorUserId: context.actorUserId,
    operation: input.operation,
  });
}

export async function respondToAccountMemberInvite(
  context: AccountMemberUserContext,
  input: Readonly<{
    accountId: string;
    memberId: string;
    operation: import("./contracts").SelfServiceInviteOperation;
  }>,
) {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" } as const;

  return applySelfServiceInviteOperation({
    accountId: input.accountId,
    memberId: input.memberId,
    actorUserId: context.actorUserId,
    operation: input.operation,
  });
}

export async function validateAccountMemberInvite(
  context: AccountMemberUserContext,
  input: Readonly<{ accountId: string; memberId: string }>,
): Promise<AccountMemberResult<AccountMemberRecord>> {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" };

  const membership = await getSelfServiceInviteMembership({
    accountId: input.accountId,
    memberId: input.memberId,
    actorUserId: context.actorUserId,
  });
  if (!membership.ok) return membership;
  return membership.value.status === "pending" || membership.value.status === "active"
    ? membership
    : { ok: false, error: "invalid_transition" };
}

export async function getAccountMemberInviteDestination(
  context: AccountMemberUserContext,
  accountId: string,
): Promise<AccountMemberResult<string>> {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" };
  void context.actorUserId;
  return getAccountSubdomain(accountId);
}
