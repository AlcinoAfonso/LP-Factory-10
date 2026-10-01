import "server-only";

import {
  listLandingPageRootVersions,
  resolveLandingPageRootParameters,
} from "@/conversion-content/landing-page";

export const adminLandingPageStructureViews = [
  "parametros",
] as const;

export type AdminLandingPageStructureView =
  (typeof adminLandingPageStructureViews)[number];

type StructureQuery = Readonly<Record<string, string | undefined>>;

export function normalizeAdminLandingPageStructureView(
  value: string | undefined,
): AdminLandingPageStructureView {
  return adminLandingPageStructureViews.includes(
    value as AdminLandingPageStructureView,
  )
    ? (value as AdminLandingPageStructureView)
    : "parametros";
}

export async function readAdminLandingPageStructure(
  view: AdminLandingPageStructureView,
  query: StructureQuery,
) {
  return { view, data: readRootParameters(query) } as const;
}

function readRootParameters(query: StructureQuery) {
  const versions = listLandingPageRootVersions();
  const requestedVersion = parseInteger(query.rootVersion);
  const rootVersion =
    requestedVersion !== null && versions.includes(requestedVersion)
      ? requestedVersion
      : versions.at(-1);

  if (rootVersion === undefined) {
    return { versions, selectedVersion: null, result: null };
  }

  const base = resolveLandingPageRootParameters({ rootVersion });
  const presetKey =
    base.ok && query.preset && Object.hasOwn(base.value.presets, query.preset)
      ? query.preset
      : undefined;

  return {
    versions,
    selectedVersion: rootVersion,
    result: resolveLandingPageRootParameters({ rootVersion, presetKey }),
  };
}

function parseInteger(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
