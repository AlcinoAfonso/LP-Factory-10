import assert from "node:assert/strict";

import {
  createInviteStatePayload,
  createInviteTransportOptions,
  decodeInviteState,
  encodeInviteState,
  getInviteStateCookieName,
} from "./invite-state-codec";

import {
  createAccountMemberInviteDecisionRecorder,
  classifyInviteCycle,
  decideAccountMemberInviteEligibility,
  decideInviteChannel,
  decideInviteAuthRequest,
  decideAdminMemberTransition,
  decideSelfServiceInviteTransition,
  isManageableMemberRole,
  isSelfServiceInviteEligible,
  isValidMemberEmail,
  normalizeMemberEmail,
  runAccountMemberInviteWhenEligible,
  runPreservedAccountMemberOperation,
  selectLatestInviteChannels,
  shouldDiscardInviteStateAfterActivationError,
} from "./policy";
import type { AccountMemberInviteDecisionEvent } from "./policy";

const ACTOR_ID = "10000000-0000-4000-8000-000000000001";
const TARGET_ID = "10000000-0000-4000-8000-000000000002";
const ACCOUNT_ID = "10000000-0000-4000-8000-000000000003";
const INVITE_STATE_SECRET = "test-only-secret-with-at-least-32-characters";

const cases: readonly Readonly<{ name: string; run: () => void | Promise<void> }>[] = [
  {
    name: "covers owner and admin entitlement decisions for invite and resend",
    run: async () => {
      let allowedEffects = 0;
      for (const operation of ["invite", "resend"] as const) {
        for (const actorRole of ["owner", "admin"] as const) {
          for (const isCommerciallyEligible of [true, false]) {
            const events: AccountMemberInviteDecisionEvent[] = [];
            const decision = decideAccountMemberInviteEligibility({
              accountStatus: "active",
              isCommerciallyEligible,
            });
            const result = await runAccountMemberInviteWhenEligible({
              decision,
              recordDecision: (eventResult, reason) => {
                events.push({
                  event: "account_member_invite_decision",
                  operation,
                  result: eventResult,
                  reason,
                  account_id: ACCOUNT_ID,
                  actor_role: actorRole,
                  request_id: "request-test",
                  latency_ms: 1,
                });
              },
              onAllowed: async () => {
                allowedEffects += 1;
                return { ok: true, value: operation } as const;
              },
            });

            assert.equal(result.ok, isCommerciallyEligible);
            assert.equal(events.length, 1);
            assert.equal(events[0]?.operation, operation);
            assert.equal(events[0]?.actor_role, actorRole);
            assert.equal(events[0]?.result, isCommerciallyEligible ? "allowed" : "denied");
          }
        }
      }
      assert.equal(allowedEffects, 4);
    },
  },
  {
    name: "account and entitlement blocks never continue to Auth, membership, channel or delivery effects",
    run: async () => {
      const effectCalls = {
        auth: 0,
        membership: 0,
        channel: 0,
        delivery: 0,
      };
      const recorded: string[] = [];
      for (const operation of ["invite", "resend"] as const) {
        for (const decision of [
          decideAccountMemberInviteEligibility({
            accountStatus: "pending_setup",
            isCommerciallyEligible: true,
          }),
          decideAccountMemberInviteEligibility({
            accountStatus: "active",
            isCommerciallyEligible: false,
          }),
        ]) {
          const result = await runAccountMemberInviteWhenEligible({
            decision,
            recordDecision: (result, reason) => recorded.push(`${result}:${reason}`),
            onAllowed: async () => {
              void operation;
              effectCalls.auth += 1;
              effectCalls.membership += 1;
              effectCalls.channel += 1;
              effectCalls.delivery += 1;
              return { ok: true, value: "effect" } as const;
            },
          });
          assert.equal(result.ok, false);
        }
      }
      assert.deepEqual(effectCalls, { auth: 0, membership: 0, channel: 0, delivery: 0 });
      assert.deepEqual(recorded, [
        "denied:account_not_active",
        "denied:commercial_entitlement_required",
        "denied:account_not_active",
        "denied:commercial_entitlement_required",
      ]);
    },
  },
  {
    name: "deduplicates allowed, denied and error events for invite and resend without forbidden fields",
    run: () => {
      for (const operation of ["invite", "resend"] as const) {
        for (const result of ["allowed", "denied", "error"] as const) {
          const events: AccountMemberInviteDecisionEvent[] = [];
          const recorder = createAccountMemberInviteDecisionRecorder((event) => events.push(event));
          const event: AccountMemberInviteDecisionEvent = {
            event: "account_member_invite_decision",
            operation,
            result,
            reason: `test_${result}`,
            account_id: ACCOUNT_ID,
            actor_role: "admin",
            request_id: "request-test",
            latency_ms: 1,
          };
          recorder.record(event);
          recorder.record({ ...event, result: "error" });

          assert.equal(events.length, 1);
          assert.equal(events[0]?.result, result);
          for (const forbidden of ["email", "form", "payload", "url", "token", "secret"]) {
            assert.equal(forbidden in (events[0] ?? {}), false);
          }
        }
      }
    },
  },
  {
    name: "records allowed before effects and keeps logging non-blocking for invite and resend",
    run: async () => {
      for (const operation of ["invite", "resend"] as const) {
        const events: AccountMemberInviteDecisionEvent[] = [];
        const order: string[] = [];
        const recorder = createAccountMemberInviteDecisionRecorder((event) => {
          order.push("log");
          events.push(event);
          throw new Error("logging unavailable");
        });
        const event: AccountMemberInviteDecisionEvent = {
          event: "account_member_invite_decision",
          operation,
          result: "allowed",
          reason: "commercial_entitlement_confirmed",
          account_id: ACCOUNT_ID,
          actor_role: "owner",
          request_id: "request-test",
          latency_ms: 1,
        };

        const result = await runAccountMemberInviteWhenEligible({
          decision: { allowed: true },
          recordDecision: () => recorder.record(event),
          onAllowed: async () => {
            order.push("effect");
            return { ok: true, value: "effect" } as const;
          },
        });

        assert.deepEqual(result, { ok: true, value: "effect" });
        assert.deepEqual(order, ["log", "effect"]);
        assert.equal(events.length, 1);
      }
    },
  },
  {
    name: "executes preserved entrypoint effects without a commercial entitlement gate",
    run: async () => {
      const executed: string[] = [];
      for (const operation of ["list", "change_role", "deactivate", "revoke", "accept", "decline"] as const) {
        const value = await runPreservedAccountMemberOperation({
          operation,
          execute: async () => {
            executed.push(operation);
            return operation;
          },
        });
        assert.equal(value, operation);
      }
      assert.deepEqual(executed, ["list", "change_role", "deactivate", "revoke", "accept", "decline"]);
    },
  },
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
          targetUserId: ACTOR_ID,
          targetRole: "viewer",
          targetStatus: "pending",
          operation: "decline",
        }),
        { ok: true, value: { nextRole: "viewer", nextStatus: "revoked", idempotent: false } },
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
    name: "self-service surfaces remaining email invites only after one membership activates",
    run: () => {
      assert.equal(
        isSelfServiceInviteEligible({
          status: "pending",
          channel: "email",
          hasActiveMembership: false,
        }),
        false,
      );
      assert.equal(
        isSelfServiceInviteEligible({
          status: "pending",
          channel: "email",
          hasActiveMembership: true,
        }),
        true,
      );
      assert.equal(
        isSelfServiceInviteEligible({
          status: "pending",
          channel: "in_app",
          hasActiveMembership: false,
        }),
        true,
      );
      assert.equal(
        isSelfServiceInviteEligible({
          status: "active",
          channel: "email",
          hasActiveMembership: true,
        }),
        false,
      );
    },
  },
  {
    name: "retry after email confirmation preserves the original email channel",
    run: () => {
      assert.equal(
        decideInviteChannel({
          existingChannel: "email",
          preparedIdempotently: true,
          isConfirmed: true,
        }),
        "email",
      );
      assert.equal(
        decideInviteChannel({
          existingChannel: null,
          preparedIdempotently: true,
          isConfirmed: true,
        }),
        null,
      );
      assert.equal(
        decideInviteChannel({
          existingChannel: "email",
          preparedIdempotently: false,
          isConfirmed: true,
        }),
        "in_app",
      );
    },
  },
  {
    name: "append-only channel events preserve concurrent memberships independently",
    run: () => {
      const otherMemberId = "10000000-0000-4000-8000-000000000004";
      const channels = selectLatestInviteChannels(
        new Map([
          [TARGET_ID, "cycle-a"],
          [otherMemberId, "cycle-b"],
        ]),
        [
          { memberId: TARGET_ID, cycleId: "cycle-a", channel: "email" },
          { memberId: otherMemberId, cycleId: "cycle-b", channel: "in_app" },
        ],
      );
      assert.equal(channels.get(TARGET_ID), "email");
      assert.equal(channels.get(otherMemberId), "in_app");
      assert.equal(channels.size, 2);
    },
  },
  {
    name: "an old channel event cannot authorize a restarted pending cycle",
    run: () => {
      const channels = selectLatestInviteChannels(
        new Map([[TARGET_ID, "current-cycle"]]),
        [{ memberId: TARGET_ID, cycleId: "previous-cycle", channel: "email" }],
      );
      assert.equal(channels.has(TARGET_ID), false);
      assert.equal(
        decideInviteChannel({
          existingChannel: channels.get(TARGET_ID) ?? null,
          preparedIdempotently: true,
          isConfirmed: true,
        }),
        null,
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
    name: "transports concurrent invite states per emission without shared metadata",
    run: () => {
      const otherAccountUserId = "10000000-0000-4000-8000-000000000004";
      const otherAccountId = "10000000-0000-4000-8000-000000000005";
      const firstPayload = createInviteStatePayload({
        accountUserId: TARGET_ID,
        accountId: ACCOUNT_ID,
        userId: ACTOR_ID,
      });
      const secondPayload = createInviteStatePayload({
        accountUserId: otherAccountUserId,
        accountId: otherAccountId,
        userId: ACTOR_ID,
      });
      assert.ok(firstPayload);
      assert.ok(secondPayload);

      const firstState = encodeInviteState(firstPayload, INVITE_STATE_SECRET);
      const secondState = encodeInviteState(secondPayload, INVITE_STATE_SECRET);
      assert.ok(firstState);
      assert.ok(secondState);
      assert.notEqual(firstState, secondState);

      const firstTransport = createInviteTransportOptions({
        redirectTo: "https://preview.example.com/auth/confirm",
        inviteState: firstState,
      });
      const secondTransport = createInviteTransportOptions({
        redirectTo: "https://preview.example.com/auth/confirm",
        inviteState: secondState,
      });
      assert.ok(firstTransport);
      assert.ok(secondTransport);
      assert.deepEqual(Object.keys(firstTransport), ["redirectTo"]);
      assert.deepEqual(Object.keys(secondTransport), ["redirectTo"]);
      assert.equal(new URL(firstTransport.redirectTo).searchParams.get("invite_state"), firstState);
      assert.equal(new URL(secondTransport.redirectTo).searchParams.get("invite_state"), secondState);
      assert.notEqual(firstTransport.redirectTo, secondTransport.redirectTo);
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

async function main() {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
