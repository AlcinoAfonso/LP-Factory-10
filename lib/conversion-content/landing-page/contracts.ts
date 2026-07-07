export const LANDING_PAGE_CHANNEL = "landing_page" as const;

export type LandingPageModuleKey =
  | "hero"
  | "benefits"
  | "offer"
  | "social_proof"
  | "how_it_works"
  | "faq"
  | "final_cta";

export type LandingPageCompositionItem = {
  id: string;
  moduleKey: LandingPageModuleKey;
  variantKey: string;
  sortOrder: number;
  isRequired: boolean;
  config: Record<string, unknown>;
};

export type LandingPageComposition = {
  id: string;
  items: LandingPageCompositionItem[];
};
