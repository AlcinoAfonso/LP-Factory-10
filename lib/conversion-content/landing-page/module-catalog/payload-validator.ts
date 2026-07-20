import type {
  LandingPageFieldDefinition,
  LandingPageModuleKey,
} from "./contracts";
import { landingPageModuleFieldCatalogRegistry } from "./registry";

export type LandingPageModuleFieldPayloadValidationResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false }>;

export function validateLandingPageModuleFieldPayload(
  moduleKey: LandingPageModuleKey,
  payload: unknown,
): LandingPageModuleFieldPayloadValidationResult {
  const moduleDefinition =
    landingPageModuleFieldCatalogRegistry[1].modules[moduleKey];

  return validatePayloadObject(payload, moduleDefinition.fields)
    ? { ok: true }
    : { ok: false };
}

function validatePayloadObject(
  payload: unknown,
  fields: Readonly<Record<string, LandingPageFieldDefinition>>,
): boolean {
  if (!isPlainObject(payload)) return false;

  const rootFields = Object.values(fields).filter(
    (field) => !field.path.includes(".") && !field.path.includes("[]"),
  );
  const allowedKeys = new Set(rootFields.map((field) => field.path));

  if (Object.keys(payload).some((key) => !allowedKeys.has(key))) return false;

  for (const field of rootFields) {
    const hasValue = Object.hasOwn(payload, field.path);
    if (!hasValue && field.cardinality.min > 0) return false;
    if (!hasValue) continue;
    if (!validateFieldValue(field, payload[field.path], fields)) return false;
  }

  return true;
}

function validateFieldValue(
  field: LandingPageFieldDefinition,
  value: unknown,
  fields: Readonly<Record<string, LandingPageFieldDefinition>>,
): boolean {
  switch (field.fieldKind) {
    case "text":
      return typeof value === "string";
    case "collection":
      return validateCollection(field, value, fields);
    case "action":
      return validateChildObject(field.path, value, fields, ".");
    case "image":
      return validateImage(value);
    case "reference":
      return validateReference(value);
  }
}

function validateCollection(
  field: Extract<LandingPageFieldDefinition, { fieldKind: "collection" }>,
  value: unknown,
  fields: Readonly<Record<string, LandingPageFieldDefinition>>,
): boolean {
  if (!Array.isArray(value)) return false;
  if (
    value.length < field.cardinality.min ||
    value.length > field.cardinality.max
  ) {
    return false;
  }

  return value.every((item) =>
    validateChildObject(field.path, item, fields, "[]."),
  );
}

function validateChildObject(
  parentPath: string,
  value: unknown,
  fields: Readonly<Record<string, LandingPageFieldDefinition>>,
  separator: "." | "[].",
): boolean {
  if (!isPlainObject(value)) return false;

  const prefix = `${parentPath}${separator}`;
  const childFields = Object.values(fields).filter((field) =>
    field.path.startsWith(prefix),
  );
  const childByKey = new Map(
    childFields.map((field) => [field.path.slice(prefix.length), field]),
  );

  if (
    childFields.length === 0 ||
    Object.keys(value).some((key) => !childByKey.has(key))
  ) {
    return false;
  }

  for (const [key, childField] of childByKey) {
    if (key.includes(".")) return false;
    const hasValue = Object.hasOwn(value, key);
    if (!hasValue && childField.cardinality.min > 0) return false;
    if (!hasValue) continue;
    if (!validateFieldValue(childField, value[key], fields)) return false;
  }

  return true;
}

function validateImage(value: unknown): boolean {
  if (
    !hasExactKeys(value, ["assetRef", "mode", "altText", "visibility"])
  ) {
    return false;
  }

  if (
    typeof value.assetRef !== "string" ||
    value.assetRef.trim().length === 0 ||
    typeof value.altText !== "string" ||
    value.visibility !== "all_viewports"
  ) {
    return false;
  }

  if (value.mode === "informative") return value.altText.trim().length > 0;
  if (value.mode === "decorative") return value.altText.length === 0;
  return false;
}

function validateReference(value: unknown): boolean {
  return (
    hasExactKeys(value, ["referenceKind", "evidenceRef"]) &&
    value.referenceKind === "operational_evidence" &&
    typeof value.evidenceRef === "string" &&
    value.evidenceRef.trim().length > 0 &&
    !/^[a-z][a-z0-9+.-]*:\/\//i.test(value.evidenceRef)
  );
}

function hasExactKeys<T extends string>(
  value: unknown,
  expectedKeys: readonly T[],
): value is Record<T, unknown> {
  if (!isPlainObject(value)) return false;
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  return (
    actualKeys.length === sortedExpectedKeys.length &&
    actualKeys.every((key, index) => key === sortedExpectedKeys[index])
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
