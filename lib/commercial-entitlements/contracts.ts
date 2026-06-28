export type CommercialEntitlementSignal = {
  isCommerciallyEligible: boolean;
  effectiveStatus: string | null;
  planKey: string | null;
};

export type GetCommercialEntitlementSignalInput = {
  accountId: string;
};

export const NO_COMMERCIAL_ENTITLEMENT_SIGNAL: CommercialEntitlementSignal = {
  isCommerciallyEligible: false,
  effectiveStatus: null,
  planKey: null,
};
