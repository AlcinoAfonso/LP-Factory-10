import "server-only";

import { createServiceClient } from "../../supabase/service";
import { isOperationalLandingPageStatus } from "../../types/status";
import type { AccountLandingPage } from "../contracts";

export async function readLandingPageDraft(input: Readonly<{
  accountId: string;
  landingPageId: string;
}>): Promise<
  | Readonly<{ ok: true; landingPage: AccountLandingPage }>
  | Readonly<{ ok: false; error: "not_found" | "read_failed" }>
> {
  try {
    const { data, error } = await createServiceClient()
      .from("account_landing_pages")
      .select("id,account_id,name,slug,status,approved_materialization_id")
      .eq("id", input.landingPageId)
      .eq("account_id", input.accountId)
      .in("status", ["draft", "active"])
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, error: "read_failed" };
    if (!isRecord(data)) return { ok: false, error: "not_found" };
    if (
      data.id !== input.landingPageId ||
      data.account_id !== input.accountId ||
      typeof data.name !== "string" ||
      !data.name.trim() ||
      typeof data.slug !== "string" ||
      !data.slug.trim() ||
      !isOperationalLandingPageStatus(data.status) ||
      (data.approved_materialization_id !== null &&
        typeof data.approved_materialization_id !== "string")
    ) {
      return { ok: false, error: "read_failed" };
    }
    return {
      ok: true,
      landingPage: {
        id: input.landingPageId,
        account_id: input.accountId,
        name: data.name,
        slug: data.slug,
        status: data.status,
        approved_materialization_id: data.approved_materialization_id,
      },
    };
  } catch {
    return { ok: false, error: "read_failed" };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
