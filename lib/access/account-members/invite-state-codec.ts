import { createHmac, timingSafeEqual } from "node:crypto";

const INVITE_STATE_VERSION = 1;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type InviteStatePayload = Readonly<{
  v: typeof INVITE_STATE_VERSION;
  account_user_id: string;
  account_id: string;
  user_id: string;
}>;

export type InviteStateCodecResult =
  | Readonly<{ ok: true; value: InviteStatePayload }>
  | Readonly<{ ok: false; error: "invalid_invite_state" }>;

export function createInviteStatePayload(input: Readonly<{
  accountUserId: string;
  accountId: string;
  userId: string;
}>): InviteStatePayload | null {
  if (
    !UUID_PATTERN.test(input.accountUserId) ||
    !UUID_PATTERN.test(input.accountId) ||
    !UUID_PATTERN.test(input.userId)
  ) {
    return null;
  }

  return {
    v: INVITE_STATE_VERSION,
    account_user_id: input.accountUserId,
    account_id: input.accountId,
    user_id: input.userId,
  };
}

export function encodeInviteState(payload: InviteStatePayload, secret: string): string | null {
  if (!isValidPayload(payload) || secret.length < 32) return null;
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(body, secret);
  return `${body}.${signature}`;
}

export function decodeInviteState(token: string, secret: string): InviteStateCodecResult {
  if (!token || secret.length < 32) return invalidInviteState();

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return invalidInviteState();

  const expected = Buffer.from(sign(parts[0], secret), "base64url");
  const received = Buffer.from(parts[1], "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return invalidInviteState();
  }

  try {
    const parsed = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return isValidPayload(parsed) ? { ok: true, value: parsed } : invalidInviteState();
  } catch {
    return invalidInviteState();
  }
}

export function getInviteStateCookieName(accountUserId: string): string | null {
  return UUID_PATTERN.test(accountUserId) ? `e11_invite_${accountUserId}` : null;
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64url");
}

function isValidPayload(value: unknown): value is InviteStatePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.v === INVITE_STATE_VERSION &&
    typeof payload.account_user_id === "string" &&
    UUID_PATTERN.test(payload.account_user_id) &&
    typeof payload.account_id === "string" &&
    UUID_PATTERN.test(payload.account_id) &&
    typeof payload.user_id === "string" &&
    UUID_PATTERN.test(payload.user_id) &&
    Object.keys(payload).length === 4
  );
}

function invalidInviteState(): InviteStateCodecResult {
  return { ok: false, error: "invalid_invite_state" };
}
