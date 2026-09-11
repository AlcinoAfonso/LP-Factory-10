export * from "./contracts";
export * from "./provider-error-metadata";
export * from "./active-contracts";
export * from "./active-gate";
export * from "./recorder";

export async function readOfficialOpenAiCosts(
  ...args: Parameters<import("./contracts").OpenAiOfficialCostsReader>
) {
  const provider = await import("./providers/openAiCostsProvider");
  return provider.readOfficialOpenAiCosts(...args);
}
