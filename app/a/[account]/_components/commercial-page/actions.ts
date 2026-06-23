'use server';

import 'server-only';

import { headers } from 'next/headers';

import { getAccessContext } from '@/lib/access/getAccessContext';
import { createServiceClient } from '@/lib/supabase/service';
import {
  GENERIC_COMMERCIAL_PAGE_VARIANT,
  type CommercialPlanKey,
} from '../../_content/commercial-page/generic-v1';

const commercialEvents = [
  'commercial_page_view',
  'commercial_primary_cta_click',
  'commercial_plan_cta_click',
] as const;

type CommercialEventName = (typeof commercialEvents)[number];
type CommercialCtaLocation = 'hero' | 'plan_card' | 'final';

type TrackCommercialEventInput = {
  accountSubdomain: string;
  event: CommercialEventName;
  planKey?: CommercialPlanKey | string;
  ctaLocation?: CommercialCtaLocation;
  pageVariant?: 'generic-v1' | 'commercial_activation_published';
};

const planKeys = new Set<CommercialPlanKey>(['starter', 'lite', 'pro', 'ultra']);
const ctaLocations = new Set<CommercialCtaLocation>(['hero', 'plan_card', 'final']);

function isCommercialEvent(value: string): value is CommercialEventName {
  return commercialEvents.includes(value as CommercialEventName);
}

export async function trackCommercialEvent(
  input: TrackCommercialEventInput,
): Promise<{ ok: boolean }> {
  const accountSubdomain = input.accountSubdomain.trim().toLowerCase();

  if (!accountSubdomain || accountSubdomain === 'home' || !isCommercialEvent(input.event)) {
    return { ok: false };
  }

  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route: `/a/${accountSubdomain}`,
  });

  if (ctx?.blocked || ctx?.account?.status !== 'active') {
    return { ok: false };
  }

  const accountId = ctx.account.id;
  const properties: Record<string, string> = {
    page_variant:
      input.pageVariant === 'commercial_activation_published'
        ? 'commercial_activation_published'
        : GENERIC_COMMERCIAL_PAGE_VARIANT,
  };

  if (input.event === 'commercial_plan_cta_click') {
    if (!input.planKey || !planKeys.has(input.planKey as CommercialPlanKey)) {
      return { ok: false };
    }

    properties.plan_key = input.planKey;
    properties.cta_location = 'plan_card';
  }

  if (input.event === 'commercial_primary_cta_click') {
    if (
      !input.ctaLocation ||
      !ctaLocations.has(input.ctaLocation) ||
      input.ctaLocation === 'plan_card'
    ) {
      return { ok: false };
    }

    properties.cta_location = input.ctaLocation;
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc('audit_context_event', {
    p_event: input.event,
    p_entity: 'commercial_page',
    p_entity_id: accountId,
    p_diff: properties,
    p_account_id: accountId,
  });

  if (error) {
    const requestHeaders = await headers();
    const requestId =
      requestHeaders.get('x-vercel-id') ?? requestHeaders.get('x-request-id') ?? null;

    console.error(
      JSON.stringify({
        scope: 'commercial_page',
        event: 'commercial_tracking_failed',
        tracked_event: input.event,
        error_code: error.code ?? 'rpc_failed',
        request_id: requestId,
        ts: new Date().toISOString(),
      }),
    );

    return { ok: false };
  }

  return { ok: true };
}
