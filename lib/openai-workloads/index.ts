export * from "./contracts";
export {
  listOpenAiWorkloadInventory,
  resolveOpenAiProductWorkload,
} from "./resolve";
export type { OpenAiWorkloadResolverDependencies } from "./resolve";
export {
  isValidResolvedOpenAiProductWorkload,
  listOpenAiWorkloadPresentations,
} from "./registry";
export {
  OPEN_AI_PROVIDER_ERROR_METADATA_MAX_LENGTH,
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  normalizeOpenAiResponseUsage,
  resolveOpenAiWorkloadEnvironment,
} from "./observability";

export async function readOpenAiAdministrativeConfigurations() {
  const { readOpenAiAdministrativeConfigurations: read } = await import(
    "./adapters/operationalConfigurationAdapter"
  );
  return read();
}

export async function readOpenAiModelCatalog() {
  const { readOpenAiModelCatalog: read } = await import(
    "./adapters/modelCatalogAdapter"
  );
  return read();
}
