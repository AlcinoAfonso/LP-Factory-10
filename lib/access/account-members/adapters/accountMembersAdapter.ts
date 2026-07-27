import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { MemberRole, MemberStatus } from "@/lib/types/status";

import type {
  AccountMemberRecord,
  AccountMemberResult,
  AdminMemberOperation,
  ManageableMemberRole,
  MemberMutationResult,
  PendingAccountMemberInvite,
  SelfServiceInviteOperation,
} from "../contracts";
import {
  decideAdminMemberTransition,
  decideSelfServiceInviteTransition,
  isManageableMemberRole,
} from "../policy";

type AccountMemberRow = Readonly<{
  id: string;
  account_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  invited_by: string | null;
}>;

type PendingAccountRow = Readonly<{
  id: string;
  name: string;
  subdomain: string;
}>;

const MEMBER_COLUMNS = "id,account_id,user_id,role,status,created_at,invited_by";

export async function listAccountMemberships(
  accountId: string,
): Promise<AccountMemberResult<readonly AccountMemberRecord[]>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("account_users")
    .select(MEMBER_COLUMNS)
    .eq("account_id", accountId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) return { ok: false, error: "read_failed" };

  const members = ((data ?? []) as AccountMemberRow[]).map(mapAccountMemberRow);
  if (members.some((member) => member === null)) return { ok: false, error: "read_failed" };

  return {
    ok: true,
    value: members.filter((member): member is AccountMemberRecord => member !== null),
  };
}

export async function preparePendingMembership(input: Readonly<{
  accountId: string;
  userId: string;
  role: ManageableMemberRole;
  invitedBy: string;
}>): Promise<AccountMemberResult<MemberMutationResult>> {
  if (!isManageableMemberRole(input.role)) return { ok: false, error: "invalid_role" };

  const current = await getAccountMembership(input.accountId, input.userId);
  if (!current.ok) return current;

  if (!current.value) return insertPendingMembership(input);
  if (current.value.status === "active") return { ok: false, error: "already_member" };
  if (current.value.status === "pending") {
    return { ok: true, value: { member: current.value, idempotent: true } };
  }
  return updateMembership(current.value, input.role, "pending");
}

export async function applyAdminMemberOperation(input: Readonly<{
  accountId: string;
  memberId: string;
  actorUserId: string;
  operation: AdminMemberOperation;
}>): Promise<AccountMemberResult<MemberMutationResult>> {
  const current = await getAccountMembershipById(input.accountId, input.memberId);
  if (!current.ok) return current;
  if (!current.value) return { ok: false, error: "member_not_found" };

  const decision = decideAdminMemberTransition({
    actorUserId: input.actorUserId,
    targetUserId: current.value.userId,
    targetRole: current.value.role,
    targetStatus: current.value.status,
    operation: input.operation,
  });
  if (!decision.ok) return decision;
  if (decision.value.idempotent) {
    return { ok: true, value: { member: current.value, idempotent: true } };
  }

  return updateMembership(current.value, decision.value.nextRole, decision.value.nextStatus);
}

export async function applySelfServiceInviteOperation(input: Readonly<{
  accountId: string;
  memberId: string;
  actorUserId: string;
  operation: SelfServiceInviteOperation;
}>): Promise<AccountMemberResult<MemberMutationResult>> {
  const current = await getAccountMembershipById(input.accountId, input.memberId);
  if (!current.ok) return current;
  if (!current.value || current.value.userId !== input.actorUserId) {
    return { ok: false, error: "member_not_found" };
  }

  const decision = decideSelfServiceInviteTransition({
    actorUserId: input.actorUserId,
    targetUserId: current.value.userId,
    targetRole: current.value.role,
    targetStatus: current.value.status,
    operation: input.operation,
  });
  if (!decision.ok) return decision;
  if (decision.value.idempotent) {
    return { ok: true, value: { member: current.value, idempotent: true } };
  }

  return updateMembership(current.value, decision.value.nextRole, decision.value.nextStatus);
}

export async function getSelfServiceInviteMembership(input: Readonly<{
  accountId: string;
  memberId: string;
  actorUserId: string;
}>): Promise<AccountMemberResult<AccountMemberRecord>> {
  const current = await getAccountMembershipById(input.accountId, input.memberId);
  if (!current.ok) return current;
  if (!current.value || current.value.userId !== input.actorUserId) {
    return { ok: false, error: "member_not_found" };
  }
  return { ok: true, value: current.value };
}

export async function listSelfServicePendingMemberships(
  actorUserId: string,
): Promise<AccountMemberResult<readonly PendingAccountMemberInvite[]>> {
  const supabase = createServiceClient();
  const { data: membershipData, error: membershipError } = await supabase
    .from("account_users")
    .select(MEMBER_COLUMNS)
    .eq("user_id", actorUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (membershipError) return { ok: false, error: "read_failed" };

  const memberships = ((membershipData ?? []) as AccountMemberRow[]).map(mapAccountMemberRow);
  if (memberships.some((membership) => membership === null)) {
    return { ok: false, error: "read_failed" };
  }

  const pending = memberships.filter(
    (membership): membership is AccountMemberRecord => membership !== null,
  );
  if (pending.length === 0) return { ok: true, value: [] };

  const accountIds = Array.from(new Set(pending.map((membership) => membership.accountId)));
  const { data: accountData, error: accountError } = await supabase
    .from("accounts")
    .select("id,name,subdomain")
    .in("id", accountIds);

  if (accountError) return { ok: false, error: "read_failed" };
  const accounts = new Map(
    ((accountData ?? []) as PendingAccountRow[]).map((account) => [account.id, account] as const),
  );

  const invites = pending.map((membership): PendingAccountMemberInvite | null => {
    const account = accounts.get(membership.accountId);
    if (!account || !account.name?.trim() || !account.subdomain?.trim()) return null;
    if (!isManageableMemberRole(membership.role)) return null;
    return {
      memberId: membership.id,
      accountId: membership.accountId,
      accountName: account.name.trim(),
      accountSubdomain: account.subdomain.trim(),
      role: membership.role,
    };
  });

  if (invites.some((invite) => invite === null)) {
    return { ok: false, error: "read_failed" };
  }
  return {
    ok: true,
    value: invites.filter((invite): invite is PendingAccountMemberInvite => invite !== null),
  };
}

export async function getAccountSubdomain(
  accountId: string,
): Promise<AccountMemberResult<string>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("subdomain")
    .eq("id", accountId)
    .limit(1)
    .maybeSingle();

  const subdomain = typeof data?.subdomain === "string" ? data.subdomain.trim() : "";
  return error || !subdomain
    ? { ok: false, error: "read_failed" }
    : { ok: true, value: subdomain };
}

async function getAccountMembership(
  accountId: string,
  userId: string,
): Promise<AccountMemberResult<AccountMemberRecord | null>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("account_users")
    .select(MEMBER_COLUMNS)
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: "read_failed" };
  if (!data) return { ok: true, value: null };

  const member = mapAccountMemberRow(data as AccountMemberRow);
  return member ? { ok: true, value: member } : { ok: false, error: "read_failed" };
}

export async function getAccountMembershipById(
  accountId: string,
  memberId: string,
): Promise<AccountMemberResult<AccountMemberRecord | null>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("account_users")
    .select(MEMBER_COLUMNS)
    .eq("account_id", accountId)
    .eq("id", memberId)
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: "read_failed" };
  if (!data) return { ok: true, value: null };

  const member = mapAccountMemberRow(data as AccountMemberRow);
  return member ? { ok: true, value: member } : { ok: false, error: "read_failed" };
}

async function insertPendingMembership(input: Readonly<{
  accountId: string;
  userId: string;
  role: ManageableMemberRole;
  invitedBy: string;
}>): Promise<AccountMemberResult<MemberMutationResult>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("account_users")
    .insert({
      account_id: input.accountId,
      user_id: input.userId,
      role: input.role,
      status: "pending",
      invited_by: input.invitedBy,
    })
    .select(MEMBER_COLUMNS)
    .maybeSingle();

  if (error?.code === "23505") {
    const raced = await getAccountMembership(input.accountId, input.userId);
    if (!raced.ok) return raced;
    if (!raced.value) return { ok: false, error: "membership_conflict" };
    if (raced.value.status === "active") return { ok: false, error: "already_member" };
    if (raced.value.status === "pending" && raced.value.role === input.role) {
      return { ok: true, value: { member: raced.value, idempotent: true } };
    }
    return { ok: false, error: "membership_conflict" };
  }
  if (error || !data) return { ok: false, error: "write_failed" };

  const member = mapAccountMemberRow(data as AccountMemberRow);
  return member
    ? { ok: true, value: { member, idempotent: false } }
    : { ok: false, error: "write_failed" };
}

async function updateMembership(
  current: AccountMemberRecord,
  nextRole: MemberRole,
  nextStatus: MemberStatus,
): Promise<AccountMemberResult<MemberMutationResult>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("account_users")
    .update({ role: nextRole, status: nextStatus })
    .eq("id", current.id)
    .eq("account_id", current.accountId)
    .eq("user_id", current.userId)
    .eq("role", current.role)
    .eq("status", current.status)
    .maxAffected(1)
    .select(MEMBER_COLUMNS)
    .maybeSingle();

  if (error) return { ok: false, error: "write_failed" };

  if (data) {
    const member = mapAccountMemberRow(data as AccountMemberRow);
    return member
      ? { ok: true, value: { member, idempotent: false } }
      : { ok: false, error: "write_failed" };
  }

  const reread = await getAccountMembershipById(current.accountId, current.id);
  if (!reread.ok) return reread;
  if (
    reread.value &&
    reread.value.userId === current.userId &&
    reread.value.role === nextRole &&
    reread.value.status === nextStatus
  ) {
    return { ok: true, value: { member: reread.value, idempotent: true } };
  }

  return { ok: false, error: "membership_conflict" };
}

function mapAccountMemberRow(row: AccountMemberRow): AccountMemberRecord | null {
  if (!isMemberRole(row.role) || !isMemberStatus(row.status)) return null;
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    invitedBy: row.invited_by,
  };
}

function isMemberRole(value: string): value is MemberRole {
  return ["owner", "admin", "editor", "viewer"].includes(value);
}

function isMemberStatus(value: string): value is MemberStatus {
  return ["pending", "active", "inactive", "revoked"].includes(value);
}
