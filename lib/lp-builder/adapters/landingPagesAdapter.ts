import "server-only";

import { getCommercialEntitlementSignal } from "../../commercial-entitlements";
import { createClient } from "../../supabase/server";
import { createServiceClient } from "../../supabase/service";
import type {
  AccountLandingPage,
  CreateAccountLandingPageInput,
  CreateAccountLandingPageResult,
} from "../contracts";

type AccountGateRow = {
  id: string;
  status: string | null;
};

type MembershipGateRow = {
  role: string | null;
  status: string | null;
};

type LandingPageInsertRow = {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  status: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function createAccountLandingPage(
  input: CreateAccountLandingPageInput,
): Promise<CreateAccountLandingPageResult> {
  try {
    return await createAccountLandingPageUnchecked(input);
  } catch (error) {
    console.error("[lp-builder] unexpected landing page creation failure", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "insert_failed" };
  }
}

async function createAccountLandingPageUnchecked(
  input: CreateAccountLandingPageInput,
): Promise<CreateAccountLandingPageResult> {
  const accountId = String(input.accountId ?? "").trim();
  const name = String(input.name ?? "").trim();
  const slug = String(input.slug ?? "").trim();

  if (!UUID_RE.test(accountId)) return { ok: false, error: "invalid_account_id" };
  if (!name) return { ok: false, error: "invalid_name" };
  if (!SLUG_RE.test(slug)) return { ok: false, error: "invalid_slug" };

  const userClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user?.id) return { ok: false, error: "unauthenticated" };

  const serviceClient = createServiceClient();

  const { data: account, error: accountError } = await serviceClient
    .from("accounts")
    .select("id,status")
    .eq("id", accountId)
    .maybeSingle();

  if (accountError) {
    console.error("[lp-builder] account gate failed", {
      code: accountError.code,
      message: accountError.message,
      account_id: accountId,
    });
    return { ok: false, error: "account_not_found" };
  }

  const accountRow = account as AccountGateRow | null;
  if (!accountRow) return { ok: false, error: "account_not_found" };
  if (accountRow.status !== "active") {
    return { ok: false, error: "account_not_active" };
  }

  const { data: isPlatformAdmin, error: platformAdminError } =
    await userClient.rpc("is_platform_admin");

  if (platformAdminError) {
    console.error("[lp-builder] platform admin gate failed", {
      code: platformAdminError.code,
      message: platformAdminError.message,
      account_id: accountId,
      user_id: user.id,
    });
  }

  const platformAdmin = isPlatformAdmin === true;

  if (!platformAdmin) {
    const { data: membership, error: membershipError } = await serviceClient
      .from("account_users")
      .select("role,status")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[lp-builder] membership gate failed", {
        code: membershipError.code,
        message: membershipError.message,
        account_id: accountId,
        user_id: user.id,
      });
      return { ok: false, error: "membership_inactive" };
    }

    const membershipRow = membership as MembershipGateRow | null;
    if (
      !membershipRow ||
      membershipRow.status !== "active" ||
      !["owner", "admin"].includes(membershipRow.role ?? "")
    ) {
      return { ok: false, error: "membership_inactive" };
    }
  }

  const entitlement = await getCommercialEntitlementSignal({ accountId });
  if (!entitlement.isCommerciallyEligible) {
    return { ok: false, error: "commercial_entitlement_required" };
  }

  const { data: inserted, error: insertError } = await userClient
    .from("account_landing_pages")
    .insert({
      account_id: accountId,
      name,
      slug,
      status: "draft",
      created_by: user.id,
    })
    .select("id,account_id,name,slug,status")
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "slug_already_exists" };
    }

    console.error("[lp-builder] landing page insert failed", {
      code: insertError.code,
      message: insertError.message,
      account_id: accountId,
      user_id: user.id,
    });

    return { ok: false, error: "insert_failed" };
  }

  const row = inserted as LandingPageInsertRow | null;
  if (!row || row.status !== "draft") {
    return { ok: false, error: "insert_failed" };
  }

  return {
    ok: true,
    landingPage: mapLandingPage(row),
  };
}

function mapLandingPage(row: LandingPageInsertRow): AccountLandingPage {
  return {
    id: row.id,
    account_id: row.account_id,
    name: row.name,
    slug: row.slug,
    status: "draft",
  };
}
