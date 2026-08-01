'use server';

import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getAccessContext } from '@/lib/access/getAccessContext';
import {
  createStripeTestCheckoutSession,
  isBillingCheckoutPlanKey,
  type BillingCheckoutPlanKey,
  type BillingCheckoutRecurrence,
  type StripeCheckoutSessionCreationResult,
} from '../../../../../lib/billing-checkout';
import { getCommercialEntitlementSignal } from '../../../../../lib/commercial-entitlements';
import {
  continueCheckoutWhenAuthorized,
  createCheckoutDecisionRecorder,
  decideCheckoutAccess,
  decideCheckoutCommercialEligibility,
  runAuthorizedCheckout,
  type CheckoutDecisionResult,
} from './checkout-policy';

type StartStripeCheckoutActionInput = {
  accountSubdomain: string;
  plan_key: unknown;
  recurrence: unknown;
};

export type StartStripeCheckoutActionResult =
  | {
      ok: false;
      reason:
        | 'missing_account_subdomain'
        | 'invalid_account_subdomain'
        | 'account_not_active'
        | 'membership_not_active'
        | 'insufficient_role'
        | 'account_already_commercially_eligible'
        | 'missing_account_id'
        | 'invalid_plan_key'
        | 'invalid_recurrence'
        | 'missing_origin'
        | 'unexpected_error'
        | Exclude<Extract<StripeCheckoutSessionCreationResult, { ok: false }>['reason'], 'invalid_plan_key' | 'invalid_recurrence'>;
      status?: number;
    };

const recurrences = new Set<BillingCheckoutRecurrence>(['monthly', 'annual']);

export async function startStripeCheckoutAction(
  input: StartStripeCheckoutActionInput,
): Promise<StartStripeCheckoutActionResult> {
  const startedAt = Date.now();
  let requestHeaders: Awaited<ReturnType<typeof headers>> | null = null;
  try {
    requestHeaders = await headers();
  } catch {
    requestHeaders = null;
  }
  const decisionContext: CheckoutDecisionContext = {
    accountId: null,
    actorRole: null,
    requestId: normalizeRequiredString(requestHeaders?.get('x-request-id')),
    startedAt,
  };
  const decisionRecorder = createCheckoutDecisionRecorder((event) => {
    console.log(JSON.stringify(event));
  });
  const recordDecision = (decision: CheckoutDecisionResult, reason: string) => {
    decisionRecorder.record({
      event: 'commercial_checkout_decision',
      operation: 'checkout',
      result: decision,
      reason,
      account_id: decisionContext.accountId,
      actor_role: decisionContext.actorRole,
      request_id: decisionContext.requestId,
      latency_ms: Date.now() - decisionContext.startedAt,
    });
  };
  const finish = (
    result: StartStripeCheckoutActionResult,
    decision: CheckoutDecisionResult,
    reason: string,
  ) => {
    recordDecision(decision, reason);
    return result;
  };

  const accountSubdomain = normalizeAccountSubdomain(input.accountSubdomain);
  if (!accountSubdomain) {
    return finish(
      { ok: false, reason: 'missing_account_subdomain' },
      'denied',
      'missing_account_subdomain',
    );
  }
  if (accountSubdomain === 'home' || !isSafeAccountSubdomain(accountSubdomain)) {
    return finish(
      { ok: false, reason: 'invalid_account_subdomain' },
      'denied',
      'invalid_account_subdomain',
    );
  }

  if (!isBillingCheckoutPlanKey(input.plan_key)) {
    return finish({ ok: false, reason: 'invalid_plan_key' }, 'denied', 'invalid_plan_key');
  }
  const planKey: BillingCheckoutPlanKey = input.plan_key;

  if (!recurrences.has(input.recurrence as BillingCheckoutRecurrence)) {
    return finish(
      { ok: false, reason: 'invalid_recurrence' },
      'denied',
      'invalid_recurrence',
    );
  }
  const recurrence = input.recurrence as BillingCheckoutRecurrence;
  let checkoutUrl: string;

  try {
    const ctx = await getAccessContext({
      params: { account: accountSubdomain },
      route: `/a/${accountSubdomain}`,
    });

    if (!ctx) {
      return finish({ ok: false, reason: 'account_not_active' }, 'denied', 'account_not_active');
    }

    const accountId = normalizeRequiredString(ctx.account?.id ?? ctx.account_id);
    if (!accountId) {
      return finish({ ok: false, reason: 'missing_account_id' }, 'error', 'missing_account_id');
    }
    decisionContext.accountId = accountId;
    decisionContext.actorRole = ctx.role;

    const accountStatus = ctx.account?.status;
    if (!accountStatus) {
      return finish({ ok: false, reason: 'account_not_active' }, 'denied', 'account_not_active');
    }
    const accessDecision = decideCheckoutAccess({
      accountStatus,
      membershipStatus: ctx.status,
      actorRole: ctx.role,
    });
    const authorizedCheckout = await continueCheckoutWhenAuthorized({
      decision: accessDecision,
      onAllowed: async () => {
        const commercialEntitlement = await getCommercialEntitlementSignal({ accountId });
        const commercialDecision = decideCheckoutCommercialEligibility(
          commercialEntitlement.isCommerciallyEligible,
        );

        return continueCheckoutWhenAuthorized({
          decision: commercialDecision,
          onAllowed: async () => {
            const origin = requestHeaders ? resolveRequestOrigin(requestHeaders) : null;
            if (!origin) {
              return {
                kind: 'action_result' as const,
                result: finish({ ok: false, reason: 'missing_origin' }, 'error', 'missing_origin'),
              };
            }

            const successUrl = `${origin}/a/${accountSubdomain}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
            const cancelUrl = `${origin}/a/${accountSubdomain}?checkout=cancel`;

            const checkout = await runAuthorizedCheckout({
              recordAllowed: () => recordDecision('allowed', 'checkout_authorized'),
              createCheckout: () =>
                createStripeTestCheckoutSession({
                  account_id: accountId,
                  plan_key: planKey,
                  recurrence,
                  successUrl,
                  cancelUrl,
                  env: process.env,
                }),
            });

            return { kind: 'checkout' as const, checkout };
          },
        });
      },
    });

    if (!authorizedCheckout.allowed) {
      return finish(
        { ok: false, reason: authorizedCheckout.reason },
        'denied',
        authorizedCheckout.reason,
      );
    }

    const commercialCheckout = authorizedCheckout.value;
    if (!commercialCheckout.allowed) {
      return finish(
        { ok: false, reason: commercialCheckout.reason },
        'denied',
        commercialCheckout.reason,
      );
    }

    if (commercialCheckout.value.kind === 'action_result') {
      return commercialCheckout.value.result;
    }
    const checkout = commercialCheckout.value.checkout;

    if (!checkout.ok) {
      return finish(
        {
          ok: false,
          reason: checkout.reason,
          status: checkout.status,
        },
        'error',
        checkout.reason,
      );
    }

    const resolvedCheckoutUrl = checkout.checkout.checkoutUrl;
    if (!resolvedCheckoutUrl) {
      return finish(
        { ok: false, reason: 'missing_checkout_url' },
        'error',
        'missing_checkout_url',
      );
    }
    checkoutUrl = resolvedCheckoutUrl;
  } catch {
    return finish({ ok: false, reason: 'unexpected_error' }, 'error', 'unexpected_error');
  }

  redirect(checkoutUrl);
}

type CheckoutDecisionContext = {
  accountId: string | null;
  actorRole: string | null;
  requestId: string | null;
  startedAt: number;
};

function normalizeAccountSubdomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function isSafeAccountSubdomain(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,62}$/.test(value);
}

function normalizeRequiredString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveRequestOrigin(requestHeaders: Pick<Headers, 'get'>): string | null {
  const origin = normalizeOrigin(requestHeaders.get('origin'));
  if (origin) return origin;

  const host = normalizeRequiredString(requestHeaders.get('x-forwarded-host')) ??
    normalizeRequiredString(requestHeaders.get('host'));
  if (!host) return null;

  const protocol =
    normalizeRequiredString(requestHeaders.get('x-forwarded-proto')) ?? 'https';

  return normalizeOrigin(`${protocol}://${host}`);
}

function normalizeOrigin(value: string | null): string | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin;
  } catch {
    return null;
  }
}
