import type {
  LandingPageModuleIdentityCatalog,
  LandingPageModuleSelectionCatalog,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";

export function listLandingPageModuleIdentities(): LandingPageModuleIdentityCatalog {
  return Object.freeze({
    moduleCatalogVersion: landingPageModuleCatalogRegistry.moduleCatalogVersion,
    modules: Object.freeze(
      Object.values(landingPageModuleCatalogRegistry.modules).map((moduleDefinition) =>
        Object.freeze({
          moduleKey: moduleDefinition.moduleKey,
          moduleVersion: moduleDefinition.moduleVersion,
          lifecycleStatus: moduleDefinition.lifecycleStatus,
          variants: Object.freeze(
            Object.values(landingPageModuleCatalogRegistry.variants)
              .filter((variant) => variant.moduleKey === moduleDefinition.moduleKey)
              .map((variant) =>
                Object.freeze({
                  variantKey: `${variant.moduleKey}.${variant.variantName}`,
                  variantVersion: variant.variantVersion,
                  lifecycleStatus: variant.lifecycleStatus,
                }),
              ),
          ),
        }),
      ),
    ),
  });
}

export function listLandingPageModuleSelectionCatalog(): LandingPageModuleSelectionCatalog {
  return Object.freeze({
    moduleCatalogVersion: landingPageModuleCatalogRegistry.moduleCatalogVersion,
    modules: Object.freeze(
      Object.values(landingPageModuleCatalogRegistry.modules).map((moduleDefinition) =>
        Object.freeze({
          moduleAlias: moduleDefinition.moduleKey,
          purpose: moduleDefinition.structuralFunction,
          variants: Object.freeze(
            Object.values(landingPageModuleCatalogRegistry.variants)
              .filter((variant) => variant.moduleKey === moduleDefinition.moduleKey)
              .map((variant) => Object.freeze({
                alias: `${variant.moduleKey}.${variant.variantName}`,
                capabilities: Object.freeze([...variant.capabilities]),
                interactions: Object.freeze(variant.interactionContracts.map((contract) => contract.kind)),
              })),
          ),
        }),
      ),
    ),
  });
}
