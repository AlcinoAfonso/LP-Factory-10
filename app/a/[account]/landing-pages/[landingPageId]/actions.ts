"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { approveAccountLandingPageRevision } from "@/lp-builder";

export async function approveLandingPageRevisionAction(formData: FormData) {
  const account = String(formData.get("account") ?? "").trim().toLowerCase();
  const landingPageId = String(formData.get("landing_page_id") ?? "").trim();
  const materializationId = String(formData.get("materialization_id") ?? "").trim();
  const ctx = await getAccessContext({ params:{account}, route:`/a/${account}/landing-pages/${landingPageId}` });
  const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string|null;
  if (!ctx || ctx.blocked || ctx.account?.status !== "active" || !accountId || !["owner","admin"].includes(String(ctx.role))) redirect(`/a/${account}/landing-pages/${landingPageId}?action_error=approval`);
  const result = await approveAccountLandingPageRevision({ accountId, landingPageId, materializationId });
  if (!result.ok) redirect(`/a/${account}/landing-pages/${landingPageId}?action_error=approval`);
  revalidatePath(`/a/${account}`);
  revalidatePath(`/a/${account}/landing-pages/${landingPageId}`);
  redirect(`/a/${account}/landing-pages/${landingPageId}?approved=${materializationId}`);
}
