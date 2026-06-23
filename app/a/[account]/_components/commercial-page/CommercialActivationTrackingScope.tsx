'use client';

import { useEffect, type MouseEvent, type ReactNode } from 'react';

import { trackCommercialEvent } from './actions';

type Props = {
  accountSubdomain: string;
  children: ReactNode;
};

const TRACKING_TIMEOUT_MS = 350;

async function waitForTracking(promise: Promise<{ ok: boolean }>) {
  await Promise.race([
    promise,
    new Promise((resolve) => window.setTimeout(resolve, TRACKING_TIMEOUT_MS)),
  ]);
}

export function CommercialActivationTrackingScope({
  accountSubdomain,
  children,
}: Props) {
  useEffect(() => {
    void trackCommercialEvent({
      accountSubdomain,
      event: 'commercial_page_view',
      pageVariant: 'commercial_activation_published',
    });
  }, [accountSubdomain]);

  const handleClickCapture = async (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    const anchor = target?.closest<HTMLAnchorElement>('a[data-commercial-cta]');
    if (!anchor || !event.currentTarget.contains(anchor)) return;

    const ctaLocation = anchor.dataset.commercialCta;
    const href = anchor.href;
    if (!href) return;

    if (ctaLocation === 'hero' || ctaLocation === 'final') {
      event.preventDefault();
      await waitForTracking(
        trackCommercialEvent({
          accountSubdomain,
          event: 'commercial_primary_cta_click',
          ctaLocation,
          pageVariant: 'commercial_activation_published',
        }),
      );
      window.location.assign(href);
      return;
    }

    if (ctaLocation === 'plan_card') {
      const planKey = anchor.dataset.commercialPlanKey;
      if (!planKey) return;

      event.preventDefault();
      await waitForTracking(
        trackCommercialEvent({
          accountSubdomain,
          event: 'commercial_plan_cta_click',
          ctaLocation: 'plan_card',
          planKey,
          pageVariant: 'commercial_activation_published',
        }),
      );
      window.location.assign(href);
    }
  };

  return <div onClickCapture={handleClickCapture}>{children}</div>;
}
