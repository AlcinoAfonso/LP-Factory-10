import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import {
  inputCatalogEvaluationStatuses,
  type InputCatalogEvaluationOutput,
  type InputCatalogEvaluationStatus,
} from "./contracts";

const DECISION_TOKEN_VERSION = 1 as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;

export type InputCatalogEvaluationDecisionTokenPayload = Readonly<{
  v: typeof DECISION_TOKEN_VERSION;
  taxonId: string;
  inputCatalogVersion: number;
  contextFingerprint: string;
  outputFingerprint: string;
  status: InputCatalogEvaluationStatus;
}>;

export function createInputCatalogEvaluationDecisionToken(
  payload: Omit<InputCatalogEvaluationDecisionTokenPayload, "v">,
  secret: string | undefined,
): string | null {
  const complete = { v: DECISION_TOKEN_VERSION, ...payload };
  if (!isValidPayload(complete) || !isValidSecret(secret)) return null;
  const body = Buffer.from(JSON.stringify(complete), "utf8").toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function readInputCatalogEvaluationDecisionToken(
  token: string,
  secret: string | undefined,
): InputCatalogEvaluationDecisionTokenPayload | null {
  if (!token || !isValidSecret(secret)) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = Buffer.from(sign(parts[0], secret), "base64url");
  const received = Buffer.from(parts[1], "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return isValidPayload(parsed) ? Object.freeze(parsed) : null;
  } catch {
    return null;
  }
}

export function fingerprintInputCatalogEvaluationOutput(output: InputCatalogEvaluationOutput): string {
  return createHash("sha256").update(JSON.stringify(output)).digest("hex");
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret)
    .update("e20.6.5-input-catalog-evaluation-decision-v1\0", "utf8")
    .update(body, "utf8")
    .digest("base64url");
}

function isValidSecret(secret: string | undefined): secret is string {
  return typeof secret === "string" && secret.trim().length >= 32;
}

function isValidPayload(value: unknown): value is InputCatalogEvaluationDecisionTokenPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.v === DECISION_TOKEN_VERSION &&
    typeof payload.taxonId === "string" &&
    UUID_PATTERN.test(payload.taxonId) &&
    Number.isSafeInteger(payload.inputCatalogVersion) &&
    Number(payload.inputCatalogVersion) > 0 &&
    typeof payload.contextFingerprint === "string" &&
    FINGERPRINT_PATTERN.test(payload.contextFingerprint) &&
    typeof payload.outputFingerprint === "string" &&
    FINGERPRINT_PATTERN.test(payload.outputFingerprint) &&
    typeof payload.status === "string" &&
    inputCatalogEvaluationStatuses.includes(payload.status as InputCatalogEvaluationStatus) &&
    Object.keys(payload).length === 6
  );
}
