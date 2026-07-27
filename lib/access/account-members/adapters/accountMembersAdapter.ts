import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { MemberRole, MemberStatus } from "@/lib/types/status";

import type {
  AccountMemberInviteChannel,
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
  selectLatestInviteChannels,
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

type InviteChannelEventRow = Readonly<{
  id: string;
  record_id: string;
  action?: string;
  changes_json: unknown;
}>;

const MEMBER_COLUMNS = "id,account_id,user_id,role,status,created_at,invited_by";
const INVITE_CHANNEL_EVENT = "e11_account_member_invite_channel";
const HUB_DISPATCH_EVENT = "hub_dispatch";

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

  const channels = await getInviteChannels(pending.map((membership) => membership.id));
  if (!channels.ok) return channels;
  const eligiblePending = pending.filter(
    (membership) => channels.value.get(membership.id) === "in_app",
  );
  if (eligiblePending.length === 0) return { ok: true, value: [] };

  const accountIds = Array.from(
    new Set(eligiblePending.map((membership) => membership.accountId)),
  );
  const { data: accountData, error: accountError } = await supabase
    .from("accounts")
    .select("id,name,subdomain")
    .in("id", accountIds);

  if (accountError) return { ok: false, error: "read_failed" };
  const accounts = new Map(
    ((accountData ?? []) as PendingAccountRow[]).map((account) => [account.id, account] as const),
  );

  const invites = eligiblePending.map((membership): PendingAccountMemberInvite | null => {
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

export async function recordInviteChannel(input: Readonly<{
  accountId: string;
  memberId: string;
  userId: string;
  actorUserId: string;
  channel: AccountMemberInviteChannel;
}>): Promise<AccountMemberResult<true>> {
  const cycleIds = await getPendingCycleIds([input.memberId], input.accountId);
  if (!cycleIds.ok) return cycleIds;
  const cycleId = cycleIds.value.get(input.memberId);
  if (!cycleId) return { ok: false, error: "invite_channel_unavailable" };

  const supabase = createServiceClient();
  const { error } = await supabase.from("audit_logs").insert({
    table_name: "account_users",
    record_id: input.memberId,
    action: "insert",
    user_id: input.userId,
    actor_user_id: input.actorUserId,
    changes_json: {
      invite_channel: input.channel,
      pending_cycle_event_id: cycleId,
    },
    account_id: input.accountId,
    event: INVITE_CHANNEL_EVENT,
  });
  return error
    ? { ok: false, error: "invite_channel_unavailable" }
    : { ok: true, value: true };
}

export async function getInviteChannel(input: Readonly<{
  accountId: string;
  memberId: string;
}>): Promise<AccountMemberResult<AccountMemberInviteChannel | null>> {
  const channels = await getInviteChannels([input.memberId], input.accountId);
  if (!channels.ok) return channels;
  return { ok: true, value: channels.value.get(input.memberId) ?? null };
}

async function getInviteChannels(
  memberIds: readonly string[],
  accountId?: string,
): Promise<AccountMemberResult<ReadonlyMap<string, AccountMemberInviteChannel>>> {
  if (memberIds.length === 0) return { ok: true, value: new Map() };

  const cycleIds = await getPendingCycleIds(memberIds, accountId);
  if (!cycleIds.ok) return cycleIds;
  if (cycleIds.value.size === 0) return { ok: true, value: new Map() };

  const supabase = createServiceClient();
  let query = supabase
    .from("audit_logs")
    .select("id,record_id,changes_json")
    .eq("event", INVITE_CHANNEL_EVENT)
    .in("record_id", memberIds)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (accountId) query = query.eq("account_id", accountId);

  const { data, error } = await query;
  if (error) return { ok: false, error: "read_failed" };

  const events: Array<{
    memberId: string;
    cycleId: string;
    channel: AccountMemberInviteChannel;
  }> = [];
  for (const row of (data ?? []) as InviteChannelEventRow[]) {
    const event = readInviteChannelEvent(row.changes_json);
    if (!event) return { ok: false, error: "read_failed" };
    events.push({ memberId: row.record_id, ...event });
  }
  return { ok: true, value: selectLatestInviteChannels(cycleIds.value, events) };
}

async function getPendingCycleIds(
  memberIds: readonly string[],
  accountId?: string,
): Promise<AccountMemberResult<ReadonlyMap<string, string>>> {
  const supabase = createServiceClient();
  let query = supabase
    .from("audit_logs")
    .select("id,record_id,action,changes_json")
    .eq("table_name", "account_users")
    .eq("event", HUB_DISPATCH_EVENT)
    .in("record_id", memberIds)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (accountId) query = query.eq("account_id", accountId);

  const { data, error } = await query;
  if (error) return { ok: false, error: "read_failed" };

  const cycles = new Map<string, string>();
  for (const row of (data ?? []) as InviteChannelEventRow[]) {
    if (!cycles.has(row.record_id) && isPendingCycleEntry(row.action, row.changes_json)) {
      cycles.set(row.record_id, row.id);
    }
  }
  return { ok: true, value: cycles };
}

function isPendingCycleEntry(action: string | undefined, value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const changes = value as Record<string, unknown>;
  if (action === "insert") {
    if (changes.status === "pending") return true;
    const inserted = changes.new;
    return Boolean(
      inserted &&
        typeof inserted === "object" &&
        !Array.isArray(inserted) &&
        (inserted as Record<string, unknown>).status === "pending",
    );
  }
  if (action !== "update") return false;
  const status = changes.status;
  return Boolean(
    status &&
      typeof status === "object" &&
      !Array.isArray(status) &&
      (status as Record<string, unknown>).new === "pending" &&
      (status as Record<string, unknown>).old !== "pending",
  );
}

function readInviteChannelEvent(value: unknown): Readonly<{
  channel: AccountMemberInviteChannel;
  cycleId: string;
}> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const channel = record.invite_channel;
  const cycleId = record.pending_cycle_event_id;
  return (channel === "email" || channel === "in_app") && typeof cycleId === "string"
    ? { channel, cycleId }
    : null;
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
