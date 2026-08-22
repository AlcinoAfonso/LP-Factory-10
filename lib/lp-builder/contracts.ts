import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogTaxonChain,
  LandingPageInputValueScope,
  ResolvedLandingPageInputField,
} from "../conversion-content/landing-page/input-catalog";
import type { OperationalLandingPageStatus } from "../types/status";

export type CreateAccountLandingPageInput = {
  accountId: string;
  name: string;
  slug: string;
};

export type AccountLandingPage = {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  status: OperationalLandingPageStatus;
};

export type CreateAccountLandingPageError =
  | "unauthenticated"
  | "invalid_account_id"
  | "invalid_name"
  | "invalid_slug"
  | "account_not_found"
  | "membership_inactive"
  | "account_not_active"
  | "commercial_entitlement_required"
  | "slug_already_exists"
  | "insert_failed";

export type CreateAccountLandingPageResult =
  | {
      ok: true;
      landingPage: AccountLandingPage;
    }
  | {
      ok: false;
      error: CreateAccountLandingPageError;
    };

export type AccountLandingPageOnboardingStoredValue = Readonly<{
  scope: LandingPageInputValueScope;
  value: unknown;
}>;

export type AccountLandingPageOnboardingStoredValues = Readonly<
  Record<string, AccountLandingPageOnboardingStoredValue>
>;

export type AccountLandingPageOnboardingValueSource =
  | "authoritative"
  | "configuration"
  | "missing";

export type AccountLandingPageOnboardingFieldState = Readonly<{
  field: ResolvedLandingPageInputField;
  source: AccountLandingPageOnboardingValueSource;
  value?: unknown;
  applicable: boolean;
  required: boolean;
}>;

export type AccountLandingPageOnboardingConfiguration = Readonly<{
  accountId: string;
  landingPageId: string | null;
  catalogVersion: number;
  revision: number;
  planKey: LandingPageInputCatalogPlan;
  taxonChain: LandingPageInputCatalogTaxonChain;
  storedValues: AccountLandingPageOnboardingStoredValues;
  fields: readonly AccountLandingPageOnboardingFieldState[];
  missingRequiredFieldKeys: readonly string[];
  complete: boolean;
}>;

export type AccountLandingPageOnboardingErrorCode =
  | "unauthenticated"
  | "invalid_account_id"
  | "account_not_found"
  | "account_not_active"
  | "membership_inactive"
  | "commercial_entitlement_required"
  | "taxon_unavailable"
  | "catalog_unavailable"
  | "configuration_unavailable"
  | "configuration_not_found"
  | "invalid_configuration"
  | "invalid_values"
  | "configuration_incomplete"
  | "landing_page_not_found"
  | "landing_page_already_bound"
  | "revision_conflict"
  | "read_failed"
  | "write_failed";

export type AccountLandingPageOnboardingResult =
  | Readonly<{
      ok: true;
      configuration: AccountLandingPageOnboardingConfiguration;
    }>
  | Readonly<{
      ok: false;
      error: AccountLandingPageOnboardingErrorCode;
      fieldKey?: string;
    }>;

export type AccountLandingPageOnboardingRevalidationAuthority = Readonly<{
  historicalConfiguration: AccountLandingPageOnboardingConfiguration;
  currentPlanKey: LandingPageInputCatalogPlan;
  currentTaxonChain: LandingPageInputCatalogTaxonChain;
  currentAuthoritativeValues: Readonly<Record<string, unknown>>;
}>;

export type AccountLandingPageOnboardingRevalidationResult =
  | Readonly<{
      ok: true;
      authority: AccountLandingPageOnboardingRevalidationAuthority;
    }>
  | Extract<AccountLandingPageOnboardingResult, { ok: false }>;

export type AccountLandingPageOperationalRevalidationAuthority =
  AccountLandingPageOnboardingRevalidationAuthority &
    Readonly<{
      sharedRevision: number | null;
      sharedCatalogVersion: number | null;
      landingPageRevision: number;
      landingPageCatalogVersion: number;
    }>;

export type AccountLandingPageOperationalRevalidationResult =
  | Readonly<{
      ok: true;
      authority: AccountLandingPageOperationalRevalidationAuthority;
    }>
  | Extract<AccountLandingPageOnboardingResult, { ok: false }>;

export type SaveAccountLandingPageOnboardingConfigurationInput = Readonly<{
  accountId: string;
  expectedRevision: number;
  values: AccountLandingPageOnboardingStoredValues;
}>;

export type AccountLandingPageDraftsResult =
  | Readonly<{
      ok: true;
      drafts: readonly AccountLandingPage[];
    }>
  | Readonly<{
      ok: false;
      error: AccountLandingPageOnboardingErrorCode;
    }>;

export type BindAccountLandingPageOnboardingConfigurationInput = Readonly<{
  accountId: string;
  landingPageId: string;
  expectedRevision: number;
}>;

export type AccountLandingPageWorkspaceState =
  | "configuration_incomplete"
  | "ready_to_generate"
  | "in_review"
  | "delivered"
  | "new_version_in_review";

export type AccountLandingPageWorkspaceItem = Readonly<{
  id: string;
  accountId: string;
  name: string;
  slug: string;
  status: OperationalLandingPageStatus;
  state: AccountLandingPageWorkspaceState;
  latestRevision: Readonly<{
    id: string;
    number: number;
    createdAt: string;
  }> | null;
  approvedRevision: Readonly<{ id: string; number: number }> | null;
  updatedAt: string;
}>;

export type AccountLandingPageWorkspacePage = Readonly<{
  items: readonly AccountLandingPageWorkspaceItem[];
  nextCursor: string | null;
  complete: boolean;
}>;

export type AccountLandingPageWorkspaceResult =
  | Readonly<{ ok: true; page: AccountLandingPageWorkspacePage; canMutate: boolean }>
  | Readonly<{
      ok: false;
      error: "disabled" | "unauthenticated" | "unauthorized" | "unavailable";
    }>;

export type AccountLandingPageOperationalConfiguration = Readonly<{
  accountId: string;
  landingPageId: string;
  sharedCatalogVersion: number | null;
  landingPageCatalogVersion: number | null;
  sharedRevision: number | null;
  landingPageRevision: number | null;
  sharedValues: AccountLandingPageOnboardingStoredValues;
  landingPageValues: AccountLandingPageOnboardingStoredValues;
  resolved: AccountLandingPageOnboardingConfiguration;
}>;

export type AccountLandingPageRevisionSummary = Readonly<{
  id: string;
  number: number;
  createdAt: string;
  latest: boolean;
  approved: boolean;
}>;

export type AccountLandingPageWorkspaceDetailResult =
  | Readonly<{
      ok: true;
      landingPage: AccountLandingPageWorkspaceItem;
      configuration: AccountLandingPageOperationalConfiguration;
      revisions: Readonly<{
        items: readonly AccountLandingPageRevisionSummary[];
        nextCursor: string | null;
        complete: boolean;
      }>;
      canMutate: boolean;
    }>
  | Readonly<{
      ok: false;
      error:
        | "disabled"
        | "unauthenticated"
        | "unauthorized"
        | "not_found"
        | "invalid_configuration"
        | "unavailable";
    }>;

export type SaveAccountLandingPageOperationalConfigurationResult =
  | Readonly<{
      ok: true;
      sharedRevision: number | null;
      landingPageRevision: number;
    }>
  | Readonly<{
      ok: false;
      error:
        | "disabled"
        | "unauthenticated"
        | "unauthorized"
        | "not_operational"
        | "revision_conflict"
        | "identity_change_requires_new_landing_page"
        | "offer_change_confirmation_required"
        | "invalid_values"
        | "unavailable";
      fieldKey?: string;
    }>;

export type LandingPageWorkspaceMutationResult =
  | Readonly<{
      ok: true;
      landingPageId?: string;
      approvedMaterializationId?: string;
    }>
  | Readonly<{
      ok: false;
      error:
        | "disabled"
        | "unauthenticated"
        | "unauthorized"
        | "not_found"
        | "not_operational"
        | "revision_not_found"
        | "unavailable";
    }>;
