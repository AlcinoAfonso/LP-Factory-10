import "server-only";

import { getAccessContext } from "@/lib/access/getAccessContext";
import { readCommercialEntitlementSignal } from "../commercial-entitlements";
import { isCommunicationBaseEnabled } from "./config";
import {
  resolveCommunicationBaseAccess,
  type CommunicationBaseAccess,
} from "./access-policy";
import type { CommunicationBaseResult } from "./contracts";

export type { CommunicationBaseAccess };

export async function requireCommunicationBaseAccess(
  rawAccountSubdomain: string,
  requireEdit = false,
): Promise<CommunicationBaseResult<CommunicationBaseAccess>> {
  return resolveCommunicationBaseAccess(rawAccountSubdomain, requireEdit, {
    enabled: isCommunicationBaseEnabled(),
    loadAccess: (accountSubdomain) => getAccessContext({
      params: { account: accountSubdomain }, throwOnReadError: true,
    }),
    readEntitlement: (accountId) => readCommercialEntitlementSignal({ accountId }),
  });
}
