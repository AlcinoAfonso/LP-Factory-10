export * from "./contracts";
export * from "./validation";
export * from "./commercial-activation";
export * as landingPageRoot from "./landing-page";
export * as landingPageInputCatalog from "./landing-page/input-catalog";
export * as landingPageKnowledgeResolution from "./landing-page/knowledge-resolution";
export {
  getCommercialActivationBundle,
  getCommercialActivationHierarchicalBundle,
} from "./adapters/commercialActivationAdapter";
export { resolveLandingPageKnowledgeForCurrentCatalog } from "./adapters/knowledgeResolutionAdapter";
