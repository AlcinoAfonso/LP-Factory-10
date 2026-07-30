import assert from 'node:assert/strict';

import {
  continueCheckoutWhenAuthorized,
  createCheckoutDecisionRecorder,
  decideCheckoutAccess,
  decideCheckoutCommercialEligibility,
  runAuthorizedCheckout,
  type CheckoutDecisionEvent,
  type CheckoutDecisionResult,
} from './checkout-policy';

function decisionEvent(result: CheckoutDecisionResult): CheckoutDecisionEvent {
  return {
    event: 'commercial_checkout_decision',
    operation: 'checkout',
    result,
    reason: `test_${result}`,
    account_id: '10000000-0000-4000-8000-000000000001',
    actor_role: 'owner',
    request_id: 'request-test',
    latency_ms: 1,
  };
}

const cases: readonly Readonly<{ name: string; run: () => void | Promise<void> }>[] = [
  {
    name: 'allows only an active owner of an active account',
    run: () => {
      assert.deepEqual(
        decideCheckoutAccess({
          accountStatus: 'active',
          membershipStatus: 'active',
          actorRole: 'owner',
        }),
        { allowed: true },
      );
    },
  },
  {
    name: 'rejects every non-owner role',
    run: () => {
      for (const actorRole of ['admin', 'editor', 'viewer'] as const) {
        assert.deepEqual(
          decideCheckoutAccess({
            accountStatus: 'active',
            membershipStatus: 'active',
            actorRole,
          }),
          { allowed: false, reason: 'insufficient_role' },
        );
      }
    },
  },
  {
    name: 'rejects every non-active account before checkout',
    run: () => {
      for (const accountStatus of ['pending_setup', 'inactive', 'suspended'] as const) {
        assert.deepEqual(
          decideCheckoutAccess({
            accountStatus,
            membershipStatus: 'active',
            actorRole: 'owner',
          }),
          { allowed: false, reason: 'account_not_active' },
        );
      }
    },
  },
  {
    name: 'rejects every non-active membership before checkout',
    run: () => {
      for (const membershipStatus of ['pending', 'inactive', 'revoked'] as const) {
        assert.deepEqual(
          decideCheckoutAccess({
            accountStatus: 'active',
            membershipStatus,
            actorRole: 'owner',
          }),
          { allowed: false, reason: 'membership_not_active' },
        );
      }
    },
  },
  {
    name: 'allows missing entitlement and blocks an already eligible account',
    run: () => {
      assert.deepEqual(decideCheckoutCommercialEligibility(false), { allowed: true });
      assert.deepEqual(decideCheckoutCommercialEligibility(true), {
        allowed: false,
        reason: 'account_already_commercially_eligible',
      });
    },
  },
  {
    name: 'records allowed, denied and error exactly once without forbidden fields',
    run: () => {
      for (const result of ['allowed', 'denied', 'error'] as const) {
        const events: CheckoutDecisionEvent[] = [];
        const recorder = createCheckoutDecisionRecorder((event) => events.push(event));
        recorder.record(decisionEvent(result));
        recorder.record(decisionEvent('error'));

        assert.equal(events.length, 1);
        assert.equal(events[0]?.result, result);
        for (const forbidden of ['email', 'form', 'payload', 'url', 'token', 'secret']) {
          assert.equal(forbidden in (events[0] ?? {}), false);
        }
      }
    },
  },
  {
    name: 'keeps logging non-blocking and records allowed before checkout creation',
    run: async () => {
      const order: string[] = [];
      const recorder = createCheckoutDecisionRecorder(() => {
        order.push('log');
        throw new Error('logging unavailable');
      });

      const result = await runAuthorizedCheckout({
        recordAllowed: () => recorder.record(decisionEvent('allowed')),
        createCheckout: async () => {
          order.push('checkout');
          return 'created';
        },
      });

      assert.equal(result, 'created');
      assert.deepEqual(order, ['log', 'checkout']);
    },
  },
  {
    name: 'never calls checkout creation for blocked access or entitlement',
    run: async () => {
      let checkoutCalls = 0;
      const blockedDecisions = [
        decideCheckoutAccess({
          accountStatus: 'pending_setup',
          membershipStatus: 'active',
          actorRole: 'owner',
        }),
        decideCheckoutAccess({
          accountStatus: 'active',
          membershipStatus: 'active',
          actorRole: 'admin',
        }),
        decideCheckoutCommercialEligibility(true),
      ];

      for (const decision of blockedDecisions) {
        const result = await continueCheckoutWhenAuthorized({
          decision,
          onAllowed: async () => {
            checkoutCalls += 1;
            return 'created';
          },
        });
        assert.equal(result.allowed, false);
      }
      assert.equal(checkoutCalls, 0);
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
