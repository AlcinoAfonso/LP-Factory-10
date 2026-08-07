export const commercialCapabilityTypes = [
  "boolean",
  "closed_level",
  "numeric_limit",
] as const;

export type CommercialCapabilityType =
  (typeof commercialCapabilityTypes)[number];

export type CommercialCapabilityKey = string;
export type CommercialCapabilityCategory = string;
export type CommercialCapabilityConsumerDomain = string;
export type CommercialCapabilityPlanKey = string;

type CommercialCapabilityDefinitionBase = Readonly<{
  key: CommercialCapabilityKey;
  name: string;
  description: string;
  category: CommercialCapabilityCategory;
  consumerDomain: CommercialCapabilityConsumerDomain;
}>;

export type BooleanCommercialCapabilityDefinition =
  CommercialCapabilityDefinitionBase &
    Readonly<{
      type: "boolean";
    }>;

export type ClosedLevelCommercialCapabilityDefinition =
  CommercialCapabilityDefinitionBase &
    Readonly<{
      type: "closed_level";
      allowedValues: readonly [string, ...string[]];
    }>;

export type NumericLimitCommercialCapabilityDefinition =
  CommercialCapabilityDefinitionBase &
    Readonly<{
      type: "numeric_limit";
      unit: string;
      unlimitedValue?: -1;
    }>;

export type CommercialCapabilityDefinition =
  | BooleanCommercialCapabilityDefinition
  | ClosedLevelCommercialCapabilityDefinition
  | NumericLimitCommercialCapabilityDefinition;

export type CommercialCapabilityValue = boolean | string | number;

export type CommercialCapabilityAssignment = Readonly<{
  capabilityKey: CommercialCapabilityKey;
  value: CommercialCapabilityValue;
}>;

export type CommercialCapabilityPlanDefinition = Readonly<{
  planKey: CommercialCapabilityPlanKey;
  capabilities: readonly CommercialCapabilityAssignment[];
}>;

export type CommercialCapabilityRegistry = Readonly<{
  definitions: readonly CommercialCapabilityDefinition[];
  plans: readonly CommercialCapabilityPlanDefinition[];
}>;

export type ResolveCommercialCapabilityInput = Readonly<{
  planKey: CommercialCapabilityPlanKey;
  capabilityKey: CommercialCapabilityKey;
}>;

export type ResolvedCommercialCapability = Readonly<{
  planKey: CommercialCapabilityPlanKey;
  definition: CommercialCapabilityDefinition;
  value: CommercialCapabilityValue;
}>;

export type CommercialCapabilityResolutionErrorCode =
  | "INVALID_INPUT"
  | "INVALID_REGISTRY"
  | "INVALID_CAPABILITY_VALUE"
  | "UNKNOWN_PLAN"
  | "UNKNOWN_CAPABILITY"
  | "CAPABILITY_NOT_ASSIGNED";

export type CommercialCapabilityResolutionError = Readonly<{
  code: CommercialCapabilityResolutionErrorCode;
  message: string;
}>;

export type ResolveCommercialCapabilityResult =
  | Readonly<{
      ok: true;
      value: ResolvedCommercialCapability;
    }>
  | Readonly<{
      ok: false;
      error: CommercialCapabilityResolutionError;
    }>;
