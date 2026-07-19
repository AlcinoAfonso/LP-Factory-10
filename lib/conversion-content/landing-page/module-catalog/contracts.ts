export const landingPageModuleKeys = [
  "hero",
  "trust_bar",
  "problem_solution",
  "offer",
  "process",
  "technical_assurance",
  "social_proof",
  "faq",
  "final_cta",
] as const;

export const landingPageModuleLifecycleStatuses = [
  "hypothesis",
  "validated",
  "deprecated",
] as const;

export type LandingPageModuleKey = (typeof landingPageModuleKeys)[number];
export type LandingPageModuleLifecycleStatus =
  (typeof landingPageModuleLifecycleStatuses)[number];
export type LandingPageModulePurpose = "controlled_test";

export type LandingPageModuleDefinition = Readonly<{
  moduleKey: LandingPageModuleKey;
  moduleVersion: number;
  lifecycleStatus: LandingPageModuleLifecycleStatus;
  purpose: LandingPageModulePurpose;
  function: string;
  boundaries: readonly string[];
  invariants: readonly string[];
}>;

export type LandingPageModuleCatalogEntry = Readonly<{
  family: "landing_page";
  moduleCatalogVersion: number;
  compatibleRootVersions: readonly number[];
  modules: Readonly<Record<LandingPageModuleKey, LandingPageModuleDefinition>>;
}>;

export type LandingPageModuleCatalogRegistry = Readonly<
  Record<number, LandingPageModuleCatalogEntry>
>;
