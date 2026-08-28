export * from "./contracts";

export async function readOfficialOpenAiCosts(
  ...args: Parameters<import("./contracts").OpenAiOfficialCostsReader>
) {
  const provider = await import("./providers/openAiCostsProvider");
  return provider.readOfficialOpenAiCosts(...args);
}
