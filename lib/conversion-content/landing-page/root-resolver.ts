import type {
  LandingPageRootErrorCode,
  LandingPageRootParameters,
  LandingPageRootRegistryEntry,
  ResolveLandingPageRootParametersInput,
  ResolveLandingPageRootParametersResult,
} from "./contracts";
import { landingPageRootRegistry } from "./root-registry";
import { landingPageRootRegistryEntrySchema } from "./root-schema";

type RegistryLike = Readonly<Record<number, LandingPageRootRegistryEntry>>;

export function resolveLandingPageRootParameters(
  input: ResolveLandingPageRootParametersInput,
): ResolveLandingPageRootParametersResult {
  return resolveLandingPageRootParametersFromRegistry(
    input,
    landingPageRootRegistry,
  );
}

export function resolveLandingPageRootParametersFromRegistry(
  input: ResolveLandingPageRootParametersInput,
  registry: RegistryLike,
): ResolveLandingPageRootParametersResult {
  const entry = registry[input.rootVersion];
  if (!entry) {
    return invalid(
      "UNKNOWN_ROOT_VERSION",
      `Unknown landing_page root version: ${input.rootVersion}`,
    );
  }

  const parsedEntry = landingPageRootRegistryEntrySchema.safeParse(entry);
  if (!parsedEntry.success) {
    return invalid(
      "INVALID_ROOT_CONTRACT",
      `Invalid landing_page root contract for version ${input.rootVersion}`,
    );
  }

  const validEntry = parsedEntry.data as unknown as LandingPageRootRegistryEntry;
  if (validEntry.rootVersion !== input.rootVersion) {
    return invalid(
      "INVALID_ROOT_CONTRACT",
      `Invalid landing_page root contract for version ${input.rootVersion}`,
    );
  }

  const presetKey = input.presetKey ?? validEntry.defaultPreset;
  const preset = validEntry.presets[presetKey];
  if (!preset) {
    return invalid("UNKNOWN_PRESET", `Unknown landing_page preset: ${presetKey}`);
  }

  return {
    ok: true,
    value: deepFreeze(cloneJson({
      ...validEntry,
      resolvedPresetKey: presetKey,
      resolvedPreset: preset,
    } satisfies LandingPageRootParameters)),
  };
}

function invalid(
  code: LandingPageRootErrorCode,
  message: string,
): ResolveLandingPageRootParametersResult {
  return { ok: false, error: { code, message } };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const property of Object.getOwnPropertyNames(value)) {
      const nested = value[property as keyof T];
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
    Object.freeze(value);
  }
  return value;
}
