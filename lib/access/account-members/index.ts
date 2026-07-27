import "server-only";

import type {
  AccountMembersManagerContext,
  AccountMemberUserContext,
} from "@/lib/access/guards";

import {
  applyAdminMemberOperation,
  applySelfServiceInviteOperation,
  listAccountMemberships,
  preparePendingMembership,
} from "./adapters/accountMembersAdapter";
import { findAuthUserByEmail, getAuthEmailsByUserIds } from "./adapters/authAdminAdapter";
import type { AccountMember, AccountMemberResult } from "./contracts";

export type {
  AccountMember,
  AccountMemberError,
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

export async function resolveAccountMemberAuthUser(
  context: AccountMembersManagerContext,
  rawEmail: string,
) {
  void context.accountId;
  return findAuthUserByEmail(rawEmail);
}

export async function prepareAccountMemberInvitation(
  context: AccountMembersManagerContext,
  input: Readonly<{ userId: string; role: import("./contracts").ManageableMemberRole }>,
) {
  return preparePendingMembership({
    accountId: context.accountId,
    userId: input.userId,
    role: input.role,
    invitedBy: context.actorUserId,
  });
}

export async function mutateAccountMember(
  context: AccountMembersManagerContext,
  input: Readonly<{
    memberId: string;
    operation: import("./contracts").AdminMemberOperation;
  }>,
) {
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
  return applySelfServiceInviteOperation({
    accountId: input.accountId,
    memberId: input.memberId,
    actorUserId: context.actorUserId,
    operation: input.operation,
  });
}
