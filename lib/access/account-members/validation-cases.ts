import assert from "node:assert/strict";

import {
  createInviteStatePayload,
  decodeInviteState,
  encodeInviteState,
  getInviteStateCookieName,
} from "./invite-state-codec";

import {
  classifyInviteCycle,
  decideInviteAuthRequest,
  decideAdminMemberTransition,
  decideSelfServiceInviteTransition,
  isManageableMemberRole,
  isValidMemberEmail,
  normalizeMemberEmail,
  shouldDiscardInviteStateAfterActivationError,
} from "./policy";

const ACTOR_ID = "10000000-0000-4000-8000-000000000001";
const TARGET_ID = "10000000-0000-4000-8000-000000000002";
const ACCOUNT_ID = "10000000-0000-4000-8000-000000000003";
const INVITE_STATE_SECRET = "test-only-secret-with-at-least-32-characters";

const cases: readonly Readonly<{ name: string; run: () => void }>[] = [
  {
    name: "normalizes email once and accepts only manageable roles",
    run: () => {
      assert.equal(normalizeMemberEmail("  User@Example.COM "), "user@example.com");
      assert.equal(isValidMemberEmail("  User@Example.COM "), true);
      assert.equal(isValidMemberEmail("not-an-email"), false);
      assert.equal(isManageableMemberRole("admin"), true);
      assert.equal(isManageableMemberRole("editor"), true);
      assert.equal(isManageableMemberRole("viewer"), true);
      assert.equal(isManageableMemberRole("owner"), false);
    },
  },
  {
    name: "classifies duplicate and restart invitation cycles",
    run: () => {
      assert.equal(classifyInviteCycle({ existingStatus: "active", isConfirmed: true }), "already_member");
      assert.equal(classifyInviteCycle({ existingStatus: "pending", isConfirmed: true }), "pending_confirmed");
      assert.equal(classifyInviteCycle({ existingStatus: "pending", isConfirmed: false }), "pending_unconfirmed");
      assert.equal(classifyInviteCycle({ existingStatus: "inactive", isConfirmed: true }), "restart_confirmed");
      assert.equal(classifyInviteCycle({ existingStatus: "revoked", isConfirmed: false }), "restart_unconfirmed");
      assert.equal(classifyInviteCycle({ existingStatus: null, isConfirmed: false }), "new_user");
    },
  },
  {
    name: "protects owner and the actor from administrative mutation",
    run: () => {
      const owner = decideAdminMemberTransition({
        actorUserId: ACTOR_ID,
        targetUserId: TARGET_ID,
        targetRole: "owner",
        targetStatus: "active",
        operation: { type: "deactivate" },
      });
      assert.deepEqual(owner, { ok: false, error: "owner_protected" });

      const actor = decideAdminMemberTransition({
        actorUserId: ACTOR_ID,
        targetUserId: ACTOR_ID,
        targetRole: "admin",
        targetStatus: "active",
        operation: { type: "change_role", role: "viewer" },
      });
      assert.deepEqual(actor, { ok: false, error: "actor_protected" });
    },
  },
  {
    name: "allows only exact administrative transitions and repeats idempotently",
    run: () => {
      assert.deepEqual(
        decideAdminMemberTransition({
          actorUserId: ACTOR_ID,
          targetUserId: TARGET_ID,
          targetRole: "editor",
          targetStatus: "active",
          operation: { type: "change_role", role: "admin" },
        }),
        { ok: true, value: { nextRole: "admin", nextStatus: "active", idempotent: false } },
      );
      assert.deepEqual(
        decideAdminMemberTransition({
          actorUserId: ACTOR_ID,
          targetUserId: TARGET_ID,
          targetRole: "viewer",
          targetStatus: "inactive",
          operation: { type: "deactivate" },
        }),
        { ok: true, value: { nextRole: "viewer", nextStatus: "inactive", idempotent: true } },
      );
      assert.equal(
        decideAdminMemberTransition({
          actorUserId: ACTOR_ID,
          targetUserId: TARGET_ID,
          targetRole: "viewer",
          targetStatus: "active",
          operation: { type: "revoke" },
        }).ok,
        false,
      );
    },
  },
  {
    name: "self-service only mutates the authenticated user's pending membership",
    run: () => {
      assert.deepEqual(
        decideSelfServiceInviteTransition({
          actorUserId: ACTOR_ID,
          targetUserId: ACTOR_ID,
          targetRole: "viewer",
          targetStatus: "pending",
          operation: "accept",
        }),
        { ok: true, value: { nextRole: "viewer", nextStatus: "active", idempotent: false } },
      );
      assert.deepEqual(
        decideSelfServiceInviteTransition({
          actorUserId: ACTOR_ID,
          targetUserId: TARGET_ID,
          targetRole: "viewer",
          targetStatus: "pending",
          operation: "decline",
        }),
        { ok: false, error: "member_not_found" },
      );
      assert.deepEqual(
        decideSelfServiceInviteTransition({
          actorUserId: ACTOR_ID,
          targetUserId: ACTOR_ID,
          targetRole: "viewer",
          targetStatus: "revoked",
          operation: "decline",
        }),
        { ok: true, value: { nextRole: "viewer", nextStatus: "revoked", idempotent: true } },
      );
    },
  },
  {
    name: "signs a versioned invite state without local expiration",
    run: () => {
      const payload = createInviteStatePayload({
        accountUserId: TARGET_ID,
        accountId: ACCOUNT_ID,
        userId: ACTOR_ID,
      });
      assert.ok(payload);

      const token = encodeInviteState(payload, INVITE_STATE_SECRET);
      assert.ok(token);
      assert.deepEqual(decodeInviteState(token, INVITE_STATE_SECRET), {
        ok: true,
        value: payload,
      });

      const decodedBody = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
      assert.equal("exp" in decodedBody, false);
      assert.equal("created_at" in decodedBody, false);
    },
  },
  {
    name: "rejects tampering and isolates cookies by account_user_id",
    run: () => {
      const payload = createInviteStatePayload({
        accountUserId: TARGET_ID,
        accountId: ACCOUNT_ID,
        userId: ACTOR_ID,
      });
      assert.ok(payload);
      const token = encodeInviteState(payload, INVITE_STATE_SECRET);
      assert.ok(token);

      assert.deepEqual(decodeInviteState(`${token}x`, INVITE_STATE_SECRET), {
        ok: false,
        error: "invalid_invite_state",
      });
      assert.equal(getInviteStateCookieName(TARGET_ID), `e11_invite_${TARGET_ID}`);
      assert.notEqual(getInviteStateCookieName(TARGET_ID), getInviteStateCookieName(ACTOR_ID));
    },
  },
  {
    name: "fails closed when an Auth invite has no signed state",
    run: () => {
      assert.equal(
        decideInviteAuthRequest({ type: "invite", inviteState: "", featureEnabled: true }),
        "invalid_invite_state",
      );
      assert.equal(
        decideInviteAuthRequest({ type: "invite", inviteState: "signed", featureEnabled: false }),
        "feature_disabled",
      );
      assert.equal(
        decideInviteAuthRequest({ type: "recovery", inviteState: "", featureEnabled: false }),
        "not_account_member_invite",
      );
    },
  },
  {
    name: "discards invite state only after definitive activation rejection",
    run: () => {
      assert.equal(shouldDiscardInviteStateAfterActivationError("member_not_found"), true);
      assert.equal(shouldDiscardInviteStateAfterActivationError("owner_protected"), true);
      assert.equal(shouldDiscardInviteStateAfterActivationError("invalid_transition"), true);
      assert.equal(shouldDiscardInviteStateAfterActivationError("write_failed"), false);
      assert.equal(shouldDiscardInviteStateAfterActivationError("read_failed"), false);
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}
