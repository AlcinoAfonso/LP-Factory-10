import "server-only";

import { createServiceClient } from "../../supabase/service";
import { isOperationalLandingPageStatus } from "../../types/status";
import type { AccountLandingPage } from "../contracts";
import type { LandingPageStatus } from "../../types/status";

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
      .select("id,account_id,name,slug,status")
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
      !isOperationalLandingPageStatus(data.status)
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
      },
    };
  } catch {
    return { ok: false, error: "read_failed" };
  }
}

export async function readLandingPageForPreview(input: Readonly<{
  accountId: string;
  landingPageId: string;
}>): Promise<
  | Readonly<{ ok: true; landingPage: Omit<AccountLandingPage, "status"> & { status: LandingPageStatus } }>
  | Readonly<{ ok: false; error: "not_found" | "read_failed" }>
> {
  try {
    const { data, error } = await createServiceClient()
      .from("account_landing_pages")
      .select("id,account_id,name,slug,status")
      .eq("id", input.landingPageId)
      .eq("account_id", input.accountId)
      .in("status", ["draft", "active", "archived"])
      .limit(1).maybeSingle();
    if (error) return { ok: false, error: "read_failed" };
    if (!isRecord(data) || data.id !== input.landingPageId || data.account_id !== input.accountId || typeof data.name !== "string" || typeof data.slug !== "string" || !["draft","active","archived"].includes(String(data.status))) return { ok: false, error: "not_found" };
    return { ok: true, landingPage: { id: data.id, account_id: data.account_id, name: data.name, slug: data.slug, status: data.status as "draft"|"active"|"archived" } };
  } catch { return { ok: false, error: "read_failed" }; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
