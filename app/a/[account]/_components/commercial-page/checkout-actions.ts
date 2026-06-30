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
        | 'missing_account_id'
        | 'invalid_plan_key'
        | 'invalid_recurrence'
        | 'missing_origin'
        | Exclude<Extract<StripeCheckoutSessionCreationResult, { ok: false }>['reason'], 'invalid_plan_key' | 'invalid_recurrence'>;
      status?: number;
    };

const recurrences = new Set<BillingCheckoutRecurrence>(['monthly', 'annual']);

export async function startStripeCheckoutAction(
  input: StartStripeCheckoutActionInput,
): Promise<StartStripeCheckoutActionResult> {
  const accountSubdomain = normalizeAccountSubdomain(input.accountSubdomain);
  if (!accountSubdomain) return { ok: false, reason: 'missing_account_subdomain' };
  if (accountSubdomain === 'home' || !isSafeAccountSubdomain(accountSubdomain)) {
    return { ok: false, reason: 'invalid_account_subdomain' };
  }

  if (!isBillingCheckoutPlanKey(input.plan_key)) {
    return { ok: false, reason: 'invalid_plan_key' };
  }
  const planKey: BillingCheckoutPlanKey = input.plan_key;

  if (!recurrences.has(input.recurrence as BillingCheckoutRecurrence)) {
    return { ok: false, reason: 'invalid_recurrence' };
  }
  const recurrence = input.recurrence as BillingCheckoutRecurrence;

  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route: `/a/${accountSubdomain}`,
  });

  if (ctx?.blocked || ctx?.account?.status !== 'active') {
    return { ok: false, reason: 'account_not_active' };
  }

  const accountId = normalizeRequiredString(ctx.account?.id ?? ctx.account_id);
  if (!accountId) return { ok: false, reason: 'missing_account_id' };

  const requestHeaders = await headers();
  const origin = resolveRequestOrigin(requestHeaders);
  if (!origin) return { ok: false, reason: 'missing_origin' };

  const successUrl = `${origin}/a/${accountSubdomain}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/a/${accountSubdomain}?checkout=cancel`;

  const checkout = await createStripeTestCheckoutSession({
    account_id: accountId,
    plan_key: planKey,
    recurrence,
    successUrl,
    cancelUrl,
    env: process.env,
  });

  if (!checkout.ok) {
    return {
      ok: false,
      reason: checkout.reason,
      status: checkout.status,
    };
  }

  if (!checkout.checkout.checkoutUrl) {
    return { ok: false, reason: 'missing_checkout_url' };
  }

  redirect(checkout.checkout.checkoutUrl);
}

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

function resolveRequestOrigin(requestHeaders: Headers): string | null {
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
