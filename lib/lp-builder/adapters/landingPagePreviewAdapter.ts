import "server-only";

import { getAccessContext } from "../../access/getAccessContext";
import { getCommercialEntitlementSignal } from "../../commercial-entitlements";
import { loadLandingPagePreviewWithDependencies } from "../landingPagePreview";
import { readLandingPageDraft } from "./landingPageDraftAdapter";
import { readCurrentLandingPageRevision } from "./landingPageRevisionAdapter";
import { signLandingPageRevisionAsset } from "./landingPageRevisionStorageAdapter";

export function loadLandingPagePreview(input: Readonly<{
  accountSlug: string;
  landingPageId: string;
}>) {
  return loadLandingPagePreviewWithDependencies(input, {
    authorizeViewer: async ({ accountSlug }) => {
      const access = await getAccessContext({
        params: { account: accountSlug },
        route: `/a/${accountSlug}/landing-pages/${input.landingPageId}/preview`,
      });
      if (
        !access ||
        access.blocked ||
        access.account?.status !== "active" ||
        access.status !== "active" ||
        access.account_slug !== accountSlug ||
        !access.account_id
      ) {
        return { ok: false } as const;
      }
      return { ok: true, accountId: access.account_id } as const;
    },
    loadEntitlement: async ({ accountId }) => {
      const entitlement = await getCommercialEntitlementSignal({ accountId });
      return entitlement.isCommerciallyEligible === true;
    },
    loadLandingPage: readLandingPageDraft,
    readCurrentRevision: readCurrentLandingPageRevision,
    signAsset: signLandingPageRevisionAsset,
    log: (event) => console.log(JSON.stringify(event)),
  });
}
