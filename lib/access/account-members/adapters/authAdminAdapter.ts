import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

import type { AccountMemberResult, AuthUserSummary } from "../contracts";
import { createInviteTransportOptions } from "../invite-state-codec";
import { isValidMemberEmail, normalizeMemberEmail } from "../policy";

const AUTH_PAGE_SIZE = 1000;

type AuthUserRow = Readonly<{
  id: string;
  email?: string | null;
  confirmed_at?: string | null;
  email_confirmed_at?: string | null;
}>;

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

  const transport = createInviteTransportOptions(input);
  if (!transport) return { ok: false, error: "external_config_missing" };

  const supabase = createServiceClient();
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, transport);

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

function mapAuthUser(user: AuthUserRow): AuthUserSummary {
  return {
    id: user.id,
    email: normalizeMemberEmail(user.email ?? ""),
    isConfirmed: Boolean(user.email_confirmed_at ?? user.confirmed_at),
  };
}
