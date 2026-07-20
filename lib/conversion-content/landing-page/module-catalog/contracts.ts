import type { LandingPageRootLifecycleStatus } from "../contracts";

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

export type LandingPageModuleFamily = "landing_page";
export type LandingPageModuleCatalogVersion = 1;
export type LandingPageCompatibleRootVersion = 1;
export type LandingPageModuleKey = (typeof landingPageModuleKeys)[number];
export type LandingPageModuleVersion = 1;
export type LandingPageModuleLifecycleStatus = LandingPageRootLifecycleStatus;
export type LandingPageModulePurpose = "controlled_test";

export type LandingPageModuleDefinition = Readonly<{
  family: LandingPageModuleFamily;
  moduleKey: LandingPageModuleKey;
  moduleVersion: LandingPageModuleVersion;
  lifecycleStatus: LandingPageModuleLifecycleStatus;
  purpose: LandingPageModulePurpose;
  structuralFunction: string;
  invariants: readonly string[];
  boundaries: readonly string[];
}>;

export type LandingPageModuleCatalogRegistry = Readonly<{
  family: LandingPageModuleFamily;
  moduleCatalogVersion: LandingPageModuleCatalogVersion;
  compatibleRootVersions: readonly [LandingPageCompatibleRootVersion];
  modules: Readonly<
    Record<LandingPageModuleKey, LandingPageModuleDefinition>
  >;
}>;
