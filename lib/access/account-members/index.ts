import "server-only";

import type {
  AccountMembersManagerContext,
  AccountMemberUserContext,
} from "@/lib/access/guards";

import {
  applyAdminMemberOperation,
  applySelfServiceInviteOperation,
  getAccountMembershipById,
  getAccountSubdomain,
  getSelfServiceInviteMembership,
  listAccountMemberships,
  listSelfServicePendingMemberships,
  preparePendingMembership,
} from "./adapters/accountMembersAdapter";
import {
  createUnconfirmedAuthUser,
  findAuthUserByEmail,
  getAuthUserById,
  getAuthUsersByUserIds,
  getInAppPendingMembershipIds,
  sendAuthInvite,
  setInAppPendingMembershipEligibility,
} from "./adapters/authAdminAdapter";
import { getAccountMembersConfirmUrl, isAccountMembersEnabled } from "./config";
import type {
  AccountMember,
  AccountMemberInvitationResult,
  AccountMemberRecord,
  AccountMemberResult,
  ManageableMemberRole,
  PendingAccountMemberInvite,
} from "./contracts";
import { createSignedInviteState } from "./invite-state";
import {
  isManageableMemberRole,
  isSelfServiceInviteEligible,
  isValidMemberEmail,
  normalizeMemberEmail,
} from "./policy";

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
  PendingAccountMemberInvite,
  SelfServiceInviteOperation,
} from "./contracts";

export async function listAccountMembers(
  context: AccountMembersManagerContext,
): Promise<AccountMemberResult<readonly AccountMember[]>> {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" };

  const memberships = await listAccountMemberships(context.accountId);
  if (!memberships.ok) return memberships;

  const authUsers = await getAuthUsersByUserIds(
    memberships.value.map((member) => member.userId),
  );
  if (!authUsers.ok) return authUsers;

  const members = memberships.value.map((member) => {
    const authUser = authUsers.value.get(member.userId);
    return authUser
      ? { ...member, email: authUser.email, isConfirmed: authUser.isConfirmed }
      : null;
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

  const eligibility = await setInAppPendingMembershipEligibility({
    userId: user.id,
    memberId: prepared.value.member.id,
    eligible: user.isConfirmed,
  });
  if (!eligibility.ok) return eligibility;

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

  return {
    ok: true,
    value: {
      member: prepared.value.member,
      delivery: user.isConfirmed ? "in_app" : "email",
    },
  };
}

export async function resendAccountMemberInvite(
  context: AccountMembersManagerContext,
  input: Readonly<{ memberId: string }>,
): Promise<AccountMemberResult<AccountMemberInvitationResult>> {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" };

  const membership = await getAccountMembershipById(context.accountId, input.memberId);
  if (!membership.ok) return membership;
  if (!membership.value) return { ok: false, error: "member_not_found" };
  if (membership.value.role === "owner") return { ok: false, error: "owner_protected" };
  if (membership.value.status !== "pending") {
    return { ok: false, error: "invalid_transition" };
  }

  const user = await getAuthUserById(membership.value.userId);
  if (!user.ok) return user;
  if (user.value.isConfirmed) return { ok: false, error: "invalid_transition" };

  const eligibility = await setInAppPendingMembershipEligibility({
    userId: membership.value.userId,
    memberId: membership.value.id,
    eligible: false,
  });
  if (!eligibility.ok) return eligibility;

  const inviteState = createSignedInviteState({
    accountUserId: membership.value.id,
    accountId: context.accountId,
    userId: membership.value.userId,
  });
  if (!inviteState.ok) return inviteState;

  const redirectTo = getAccountMembersConfirmUrl();
  if (!redirectTo.ok) return redirectTo;

  const delivery = await sendAuthInvite({
    email: user.value.email,
    inviteState: inviteState.value,
    redirectTo: redirectTo.value,
  });
  if (!delivery.ok) return delivery;

  return {
    ok: true,
    value: { member: membership.value, delivery: "email" },
  };
}

export async function mutateAccountMember(
  context: AccountMembersManagerContext,
  input: Readonly<{
    memberId: string;
    operation: import("./contracts").AdminMemberOperation;
  }>,
) {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" } as const;

  const result = await applyAdminMemberOperation({
    accountId: context.accountId,
    memberId: input.memberId,
    actorUserId: context.actorUserId,
    operation: input.operation,
  });
  if (result.ok && input.operation.type === "revoke") {
    await setInAppPendingMembershipEligibility({
      userId: result.value.member.userId,
      memberId: result.value.member.id,
      eligible: false,
    });
  }
  return result;
}

export async function respondToInAppAccountMemberInvite(
  context: AccountMemberUserContext,
  input: Readonly<{
    accountId: string;
    memberId: string;
    operation: import("./contracts").SelfServiceInviteOperation;
  }>,
) {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" } as const;

  const validated = await validatePendingAccountMemberInvite(context, input);
  if (!validated.ok) return validated;

  const result = await applySelfServiceInviteOperation({
    accountId: input.accountId,
    memberId: input.memberId,
    actorUserId: context.actorUserId,
    operation: input.operation,
  });
  if (!result.ok) return result;

  await setInAppPendingMembershipEligibility({
    userId: context.actorUserId,
    memberId: input.memberId,
    eligible: false,
  });
  return result;
}

export async function activateAccountMemberEmailInvite(
  context: AccountMemberUserContext,
  input: Readonly<{ accountId: string; memberId: string }>,
) {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" } as const;

  const inAppMembershipIds = await getInAppPendingMembershipIds(context.actorUserId);
  if (!inAppMembershipIds.ok) return inAppMembershipIds;
  if (inAppMembershipIds.value.includes(input.memberId)) {
    return { ok: false, error: "invalid_transition" } as const;
  }

  return applySelfServiceInviteOperation({
    accountId: input.accountId,
    memberId: input.memberId,
    actorUserId: context.actorUserId,
    operation: "accept",
  });
}

export async function listPendingAccountMemberInvites(
  context: AccountMemberUserContext,
): Promise<AccountMemberResult<readonly PendingAccountMemberInvite[]>> {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" };
  const inAppMembershipIds = await getInAppPendingMembershipIds(context.actorUserId);
  if (!inAppMembershipIds.ok) return inAppMembershipIds;
  return listSelfServicePendingMemberships(context.actorUserId, inAppMembershipIds.value);
}

export async function validatePendingAccountMemberInvite(
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
  const inAppMembershipIds = await getInAppPendingMembershipIds(context.actorUserId);
  if (!inAppMembershipIds.ok) return inAppMembershipIds;
  return isSelfServiceInviteEligible({
    memberId: membership.value.id,
    status: membership.value.status,
    inAppPendingMembershipIds: inAppMembershipIds.value,
  })
    ? membership
    : { ok: false, error: "invalid_transition" };
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
