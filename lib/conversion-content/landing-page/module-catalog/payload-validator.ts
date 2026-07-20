import type {
  LandingPageFieldDefinition,
  LandingPageModuleKey,
} from "./contracts";
import {
  countLandingPageRootTextCharacters,
  normalizeLandingPageRootText,
  resolveLandingPageRootParameters,
  type LandingPageRootParameters,
} from "../index";
import {
  landingPageModuleCatalogRegistry,
  landingPageModuleFieldCatalogRegistry,
} from "./registry";

export type LandingPageModuleFieldPayloadValidationErrorCode =
  "ROOT_RESOLUTION_FAILED";

export type LandingPageModuleFieldPayloadValidationResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      error?: Readonly<{
        code: LandingPageModuleFieldPayloadValidationErrorCode;
      }>;
    }>;

type LandingPageModuleFieldPayloadValidationOptions = Readonly<{
  rootVersion?: number;
  presetKey?: string;
}>;

export function validateLandingPageModuleFieldPayload(
  moduleKey: LandingPageModuleKey,
  payload: unknown,
  options: LandingPageModuleFieldPayloadValidationOptions = {},
): LandingPageModuleFieldPayloadValidationResult {
  const moduleDefinition =
    landingPageModuleFieldCatalogRegistry[1].modules[moduleKey];
  if (!moduleDefinition) return { ok: false };

  const rootResolution = resolveLandingPageRootParameters({
    rootVersion:
      options.rootVersion ??
      landingPageModuleCatalogRegistry[1].compatibleRootVersions[0],
    ...(options.presetKey === undefined
      ? {}
      : { presetKey: options.presetKey }),
  });
  if (!rootResolution.ok) {
    return { ok: false, error: { code: "ROOT_RESOLUTION_FAILED" } };
  }

  return validatePayloadObject(
    payload,
    moduleDefinition.fields,
    rootResolution.value,
  )
    ? { ok: true }
    : { ok: false };
}

function validatePayloadObject(
  payload: unknown,
  fields: Readonly<Record<string, LandingPageFieldDefinition>>,
  rootParameters: LandingPageRootParameters,
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
    if (!validateFieldValue(
      field,
      payload[field.path],
      fields,
      rootParameters,
    )) return false;
  }

  return true;
}

function validateFieldValue(
  field: LandingPageFieldDefinition,
  value: unknown,
  fields: Readonly<Record<string, LandingPageFieldDefinition>>,
  rootParameters: LandingPageRootParameters,
): boolean {
  switch (field.fieldKind) {
    case "text":
      return validateText(field, value, rootParameters);
    case "collection":
      return validateCollection(field, value, fields, rootParameters);
    case "action":
      return validateChildObject(
        field.path,
        value,
        fields,
        ".",
        rootParameters,
      );
    case "image":
      return validateImage(value);
    case "reference":
      return validateReference(value);
  }
}

function validateText(
  field: Extract<LandingPageFieldDefinition, { fieldKind: "text" }>,
  value: unknown,
  rootParameters: LandingPageRootParameters,
): boolean {
  if (typeof value !== "string") return false;

  const normalizedValue = normalizeLandingPageRootText(value);
  if (normalizedValue.length === 0) return false;

  const semanticRole = rootParameters.semanticRoles[field.semanticRole];
  return (
    semanticRole !== undefined &&
    countLandingPageRootTextCharacters(normalizedValue) <=
      semanticRole.textRange.absoluteMax
  );
}

function validateCollection(
  field: Extract<LandingPageFieldDefinition, { fieldKind: "collection" }>,
  value: unknown,
  fields: Readonly<Record<string, LandingPageFieldDefinition>>,
  rootParameters: LandingPageRootParameters,
): boolean {
  if (!Array.isArray(value)) return false;
  if (
    value.length < field.cardinality.min ||
    value.length > field.cardinality.max
  ) {
    return false;
  }

  return value.every((item) =>
    validateChildObject(field.path, item, fields, "[].", rootParameters),
  );
}

function validateChildObject(
  parentPath: string,
  value: unknown,
  fields: Readonly<Record<string, LandingPageFieldDefinition>>,
  separator: "." | "[].",
  rootParameters: LandingPageRootParameters,
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
    if (!validateFieldValue(childField, value[key], fields, rootParameters)) {
      return false;
    }
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
