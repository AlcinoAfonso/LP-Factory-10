import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

import type { AccountMemberResult, AuthUserSummary } from "../contracts";
import { isValidMemberEmail, normalizeMemberEmail } from "../policy";

const AUTH_PAGE_SIZE = 1000;

type AuthUserRow = Readonly<{
  id: string;
  email?: string | null;
  confirmed_at?: string | null;
  email_confirmed_at?: string | null;
  app_metadata?: unknown;
}>;

const IN_APP_PENDING_MEMBERSHIPS_KEY = "e11_in_app_pending_memberships";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function findAuthUserByEmail(
  rawEmail: string,
): Promise<AccountMemberResult<AuthUserSummary | null>> {
  const email = normalizeMemberEmail(rawEmail);
  if (!isValidMemberEmail(email)) return { ok: false, error: "invalid_email" };

  const supabase = createServiceClient();

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: AUTH_PAGE_SIZE,
    });

    if (error) return { ok: false, error: "auth_lookup_failed" };

    const users = (data.users ?? []) as AuthUserRow[];
    const found = users.find((user) => normalizeMemberEmail(user.email ?? "") === email);

    if (found?.email) return { ok: true, value: mapAuthUser(found) };
    if (users.length < AUTH_PAGE_SIZE) return { ok: true, value: null };
  }
}

export async function createUnconfirmedAuthUser(
  rawEmail: string,
): Promise<AccountMemberResult<AuthUserSummary>> {
  const email = normalizeMemberEmail(rawEmail);
  if (!isValidMemberEmail(email)) return { ok: false, error: "invalid_email" };

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: false,
  });

  if (error || !data.user?.email) {
    const raced = await findAuthUserByEmail(email);
    if (raced.ok && raced.value) return { ok: true, value: raced.value };
    return { ok: false, error: "auth_create_failed" };
  }

  return { ok: true, value: mapAuthUser(data.user) };
}

export async function sendAuthInvite(input: Readonly<{
  email: string;
  inviteState: string;
  redirectTo: string;
}>): Promise<AccountMemberResult<true>> {
  const email = normalizeMemberEmail(input.email);
  if (!isValidMemberEmail(email)) return { ok: false, error: "invalid_email" };
  if (!input.inviteState) return { ok: false, error: "invite_state_unavailable" };

  try {
    const redirect = new URL(input.redirectTo);
    if (
      (redirect.protocol !== "https:" && redirect.protocol !== "http:") ||
      redirect.pathname !== "/auth/confirm"
    ) {
      return { ok: false, error: "external_config_missing" };
    }
  } catch {
    return { ok: false, error: "external_config_missing" };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { invite_state: input.inviteState },
    redirectTo: input.redirectTo,
  });

  return error ? { ok: false, error: "auth_invite_failed" } : { ok: true, value: true };
}

export async function getAuthUsersByUserIds(
  userIds: readonly string[],
): Promise<AccountMemberResult<ReadonlyMap<string, AuthUserSummary>>> {
  const supabase = createServiceClient();
  const uniqueUserIds = Array.from(new Set(userIds));
  const entries = await Promise.all(
    uniqueUserIds.map(async (userId): Promise<readonly [string, AuthUserSummary] | null> => {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !data.user?.email) return null;
      return [userId, mapAuthUser(data.user)] as const;
    }),
  );

  if (entries.some((entry) => entry === null)) {
    return { ok: false, error: "auth_lookup_failed" };
  }

  return {
    ok: true,
    value: new Map(
      entries.filter(
        (entry): entry is readonly [string, AuthUserSummary] => entry !== null,
      ),
    ),
  };
}

export async function getAuthUserById(
  userId: string,
): Promise<AccountMemberResult<AuthUserSummary>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  return error || !data.user?.email
    ? { ok: false, error: "auth_lookup_failed" }
    : { ok: true, value: mapAuthUser(data.user) };
}

export async function getInAppPendingMembershipIds(
  userId: string,
): Promise<AccountMemberResult<readonly string[]>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) return { ok: false, error: "auth_lookup_failed" };

  const membershipIds = readInAppPendingMembershipIds(data.user as AuthUserRow);
  return membershipIds
    ? { ok: true, value: membershipIds }
    : { ok: false, error: "auth_state_failed" };
}

export async function setInAppPendingMembershipEligibility(input: Readonly<{
  userId: string;
  memberId: string;
  eligible: boolean;
}>): Promise<AccountMemberResult<true>> {
  if (!UUID_PATTERN.test(input.memberId)) return { ok: false, error: "auth_state_failed" };

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(input.userId);
  if (error || !data.user) return { ok: false, error: "auth_lookup_failed" };

  const user = data.user as AuthUserRow;
  const current = readInAppPendingMembershipIds(user);
  const metadata = readAppMetadata(user.app_metadata);
  if (!current || !metadata) return { ok: false, error: "auth_state_failed" };

  const next = new Set(current);
  if (input.eligible) next.add(input.memberId);
  else next.delete(input.memberId);

  const nextIds = Array.from(next).sort();
  if (nextIds.length === current.length && nextIds.every((id, index) => id === current[index])) {
    return { ok: true, value: true };
  }

  const nextMetadata: Record<string, unknown> = { ...metadata };
  nextMetadata[IN_APP_PENDING_MEMBERSHIPS_KEY] = nextIds;

  const { error: updateError } = await supabase.auth.admin.updateUserById(input.userId, {
    app_metadata: nextMetadata,
  });
  return updateError
    ? { ok: false, error: "auth_state_failed" }
    : { ok: true, value: true };
}

function readInAppPendingMembershipIds(user: AuthUserRow): readonly string[] | null {
  const metadata = readAppMetadata(user.app_metadata);
  if (!metadata) return null;

  const raw = metadata[IN_APP_PENDING_MEMBERSHIPS_KEY];
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.some((value) => typeof value !== "string" || !UUID_PATTERN.test(value))) {
    return null;
  }
  return Array.from(new Set(raw)).sort();
}

function readAppMetadata(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) return {};
  return typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function mapAuthUser(user: AuthUserRow): AuthUserSummary {
  return {
    id: user.id,
    email: normalizeMemberEmail(user.email ?? ""),
    isConfirmed: Boolean(user.email_confirmed_at ?? user.confirmed_at),
  };
}
