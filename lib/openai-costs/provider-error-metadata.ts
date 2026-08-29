export type OpenAiProviderErrorMetadata = Readonly<{
  providerErrorCode: string | null;
  providerErrorType: string | null;
}>;

const CREDIT_FAILURE_CODES = new Set([
  "credit_balance_exhausted",
  "organization_spend_limit_exceeded",
  "project_spend_limit_exceeded",
  "organization_usage_limit_exceeded",
]);

export async function readOpenAiProviderErrorMetadata(
  response: Response,
): Promise<OpenAiProviderErrorMetadata> {
  try {
    return parseOpenAiProviderErrorMetadata(await response.json());
  } catch {
    return emptyMetadata();
  }
}

export function parseOpenAiProviderErrorMetadata(
  payload: unknown,
): OpenAiProviderErrorMetadata {
  const root = asRecord(payload);
  const error = asRecord(root?.error);
  return {
    providerErrorCode: boundedMetadata(error?.code),
    providerErrorType: boundedMetadata(error?.type),
  };
}

export function isOpenAiCreditFailure(input: Readonly<{
  providerErrorCode: unknown;
  providerErrorType: unknown;
}>) {
  const code = boundedMetadata(input.providerErrorCode);
  const type = boundedMetadata(input.providerErrorType);
  return (code !== null && CREDIT_FAILURE_CODES.has(code)) ||
    type === "insufficient_quota";
}

export function boundedOpenAiProviderErrorMetadata(value: unknown) {
  return boundedMetadata(value);
}

export function boundedOpenAiProviderHttpStatus(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599
    ? value
    : null;
}

function boundedMetadata(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length >= 1 &&
      normalized.length <= 128 &&
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)
    ? normalized
    : null;
}

function emptyMetadata(): OpenAiProviderErrorMetadata {
  return { providerErrorCode: null, providerErrorType: null };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
