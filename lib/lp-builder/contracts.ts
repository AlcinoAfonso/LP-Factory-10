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
  status: "draft";
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
