import "server-only";

import type { AccountMemberResult } from "./contracts";
import {
  createInviteStatePayload,
  decodeInviteState,
  encodeInviteState,
  getInviteStateCookieName,
  type InviteStatePayload,
} from "./invite-state-codec";

export { getInviteStateCookieName, type InviteStatePayload };

export function createSignedInviteState(input: Readonly<{
  accountUserId: string;
  accountId: string;
  userId: string;
}>): AccountMemberResult<string> {
  const payload = createInviteStatePayload(input);
  const secret = getInviteStateSecret();
  if (!payload || !secret) return { ok: false, error: "invite_state_unavailable" };

  const token = encodeInviteState(payload, secret);
  return token
    ? { ok: true, value: token }
    : { ok: false, error: "invite_state_unavailable" };
}

export function verifySignedInviteState(
  token: string,
): AccountMemberResult<InviteStatePayload> {
  const secret = getInviteStateSecret();
  if (!secret) return { ok: false, error: "invite_state_unavailable" };
  return decodeInviteState(token, secret);
}

function getInviteStateSecret(): string | null {
  const secret = process.env.INVITE_STATE_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}
