import "server-only";

import { createServiceClient } from "../../supabase/service";

export type LandingPageRevisionReadiness = Readonly<{
  ready: boolean;
  schemaVersion: number | null;
}>;

export async function loadLandingPageRevisionReadiness(): Promise<LandingPageRevisionReadiness> {
  try {
    const { data, error } = await createServiceClient().rpc(
      "e19_4_landing_page_revision_readiness",
    );
    if (error || !isRecord(data)) return { ready: false, schemaVersion: null };
    return {
      ready: data.ready === true && data.schema_version === 1,
      schemaVersion:
        Number.isInteger(data.schema_version) && (data.schema_version as number) > 0
          ? (data.schema_version as number)
          : null,
    };
  } catch {
    return { ready: false, schemaVersion: null };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
