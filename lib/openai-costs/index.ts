export * from "./contracts";
export * from "./pricing";
export * from "./provider-error-metadata";
export * from "./tracking-budget";
export * from "./tracking-contracts";

export async function readOfficialOpenAiCosts(
  ...args: Parameters<import("./contracts").OpenAiOfficialCostsReader>
) {
  const provider = await import("./providers/openAiCostsProvider");
  return provider.readOfficialOpenAiCosts(...args);
}
