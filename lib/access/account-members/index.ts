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
  getInviteChannel,
  getSelfServiceInviteMembership,
  listAccountMemberships,
  listSelfServicePendingMemberships,
  preparePendingMembership,
  recordInviteChannel,
} from "./adapters/accountMembersAdapter";
import {
  createUnconfirmedAuthUser,
  findAuthUserByEmail,
  getAuthUserById,
  getAuthUsersByUserIds,
  sendAuthInvite,
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
  decideInviteChannel,
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

  const existingChannel = await getInviteChannel({
    accountId: context.accountId,
    memberId: prepared.value.member.id,
  });
  if (!existingChannel.ok) return existingChannel;
  const channel = decideInviteChannel({
    existingChannel: existingChannel.value,
    preparedIdempotently: prepared.value.idempotent,
    isConfirmed: user.isConfirmed,
  });
  if (!channel) return { ok: false, error: "invite_channel_unavailable" };

  if (!prepared.value.idempotent || !existingChannel.value) {
    const recorded = await recordInviteChannel({
      accountId: context.accountId,
      memberId: prepared.value.member.id,
      userId: user.id,
      actorUserId: context.actorUserId,
      channel,
    });
    if (!recorded.ok) return recorded;
  }

  if (channel === "email") {
    if (user.isConfirmed) return { ok: false, error: "invalid_transition" };
    const inviteState = createSignedInviteState({
      accountUserId: prepared.value.member.id,
      accountId: context.accountId,
      userId: user.id,
    });
    if (!inviteState.ok) return inviteState;

    const redirectTo = getAccountMembersConfirmUrl();
    if (!redirectTo.ok) return redirectTo;

    const delivery = await sendAuthInvite({
      userId: user.id,
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
      delivery: channel,
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

  const channel = await getInviteChannel({
    accountId: context.accountId,
    memberId: membership.value.id,
  });
  if (!channel.ok) return channel;
  if (channel.value !== "email") return { ok: false, error: "invalid_transition" };

  const inviteState = createSignedInviteState({
    accountUserId: membership.value.id,
    accountId: context.accountId,
    userId: membership.value.userId,
  });
  if (!inviteState.ok) return inviteState;

  const redirectTo = getAccountMembersConfirmUrl();
  if (!redirectTo.ok) return redirectTo;

  const delivery = await sendAuthInvite({
    userId: membership.value.userId,
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

  return applyAdminMemberOperation({
    accountId: context.accountId,
    memberId: input.memberId,
    actorUserId: context.actorUserId,
    operation: input.operation,
  });
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

  return applySelfServiceInviteOperation({
    accountId: input.accountId,
    memberId: input.memberId,
    actorUserId: context.actorUserId,
    operation: input.operation,
  });
}

export async function activateAccountMemberEmailInvite(
  context: AccountMemberUserContext,
  input: Readonly<{ accountId: string; memberId: string }>,
) {
  if (!isAccountMembersEnabled()) return { ok: false, error: "feature_disabled" } as const;

  const channel = await getInviteChannel(input);
  if (!channel.ok) return channel;
  if (channel.value !== "email") {
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
  return listSelfServicePendingMemberships(context.actorUserId);
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
  const channel = await getInviteChannel(input);
  if (!channel.ok) return channel;
  return isSelfServiceInviteEligible({
    status: membership.value.status,
    channel: channel.value,
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
