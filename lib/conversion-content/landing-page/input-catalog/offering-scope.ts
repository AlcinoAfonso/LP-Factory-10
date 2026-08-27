export const landingPageOfferingScopeModes = [
  "single",
  "multiple",
  "portfolio",
] as const;

export type LandingPageOfferingScopeMode =
  (typeof landingPageOfferingScopeModes)[number];

export type LandingPageOfferingScope = Readonly<{
  mode: LandingPageOfferingScopeMode;
  offerings: readonly string[];
}>;

export type LandingPageOfferingScopeParseResult =
  | Readonly<{ ok: true; value: LandingPageOfferingScope }>
  | Readonly<{ ok: false }>;

export function parseLandingPageOfferingScope(
  input: unknown,
): LandingPageOfferingScopeParseResult {
  if (!isRecord(input)) return { ok: false };
  if (
    Object.keys(input).length !== 2 ||
    !Object.hasOwn(input, "mode") ||
    !Object.hasOwn(input, "offerings") ||
    !landingPageOfferingScopeModes.includes(
      input.mode as LandingPageOfferingScopeMode,
    ) ||
    !Array.isArray(input.offerings)
  ) {
    return { ok: false };
  }

  const offerings: string[] = [];
  for (const item of input.offerings) {
    if (typeof item !== "string" || item.trim().length === 0) {
      return { ok: false };
    }
    offerings.push(item.trim());
  }

  if (
    offerings.length === 0 ||
    (input.mode === "single" && offerings.length !== 1) ||
    (input.mode === "multiple" && offerings.length < 2)
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: Object.freeze({
      mode: input.mode as LandingPageOfferingScopeMode,
      offerings: Object.freeze(offerings),
    }),
  };
}

export function isLandingPageOfferingScope(
  input: unknown,
): input is LandingPageOfferingScope {
  return parseLandingPageOfferingScope(input).ok;
}

export function projectLegacyLandingPageOfferingScope(
  input: unknown,
): LandingPageOfferingScopeParseResult {
  return parseLandingPageOfferingScope({
    mode: "single",
    offerings: [input],
  });
}

export function areLandingPageOfferingScopesMateriallyEqual(
  left: unknown,
  right: unknown,
): boolean {
  const parsedLeft = parseLandingPageOfferingScope(left);
  const parsedRight = parseLandingPageOfferingScope(right);
  if (!parsedLeft.ok || !parsedRight.ok) return false;
  if (parsedLeft.value.mode !== parsedRight.value.mode) return false;
  return sameNormalizedMultiset(
    parsedLeft.value.offerings,
    parsedRight.value.offerings,
  );
}

function sameNormalizedMultiset(
  left: readonly string[],
  right: readonly string[],
) {
  if (left.length !== right.length) return false;
  const normalizedLeft = left.map(normalizeComparable).sort();
  const normalizedRight = right.map(normalizeComparable).sort();
  return normalizedLeft.every((item, index) => item === normalizedRight[index]);
}

function normalizeComparable(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
