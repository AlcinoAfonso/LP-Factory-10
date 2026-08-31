import { Tiktoken } from "js-tiktoken/lite";
import o200kBase from "js-tiktoken/ranks/o200k_base";

// The official tiktoken mapping uses o200k_base for the gpt-5 prefix.
// Ranks are bundled locally. No network, WASM or provider preflight is used.
let encoder: Tiktoken | undefined;

// Covers request metadata and provider framing beyond the complete visible
// instructions/input/schema/tools. This is a conservative estimate, not an
// official count of the provider's internal request representation.
export const DYNAMIC_RESEARCH_FRAMING_MARGIN_TOKENS = 2_048;

export function estimateDynamicResearchInputTokens(parts: readonly string[]): number | null {
  try {
    encoder ??= new Tiktoken(o200kBase);
    const count = parts.reduce(
      (sum, part) => sum + encoder!.encode(part, [], []).length,
      DYNAMIC_RESEARCH_FRAMING_MARGIN_TOKENS,
    );
    return Number.isSafeInteger(count) && count >= 0 ? count : null;
  } catch {
    return null;
  }
}
