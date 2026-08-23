export * from "./contracts";
export {
  listOpenAiWorkloadInventory,
  resolveOpenAiImageWorkload,
  resolveOpenAiProductWorkload,
} from "./resolve";
export type { OpenAiWorkloadResolverDependencies } from "./resolve";
export {
  isValidResolvedOpenAiImageWorkload,
  isValidResolvedOpenAiProductWorkload,
  listOpenAiWorkloadPresentations,
} from "./registry";
export {
  OPEN_AI_PROVIDER_ERROR_METADATA_MAX_LENGTH,
  createOpenAiImageWorkloadFailureEvent,
  createOpenAiImageWorkloadSuccessEvent,
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiImageWorkloadEvent,
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
