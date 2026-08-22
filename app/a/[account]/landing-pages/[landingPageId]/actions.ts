"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAccessContext } from "@/lib/access/getAccessContext";
import { approveAccountLandingPageRevision } from "@/lp-builder";

export async function approveLandingPageRevisionAction(formData: FormData) {
  const account = String(formData.get("account") ?? "").trim().toLowerCase();
  const landingPageId = String(formData.get("landing_page_id") ?? "").trim();
  const materializationId = String(formData.get("materialization_id") ?? "").trim();
  const previewPath = `/a/${account}/landing-pages/${landingPageId}/preview?revision=${materializationId}`;
  if (!account || account === "home" || !isUuid(landingPageId) || !isUuid(materializationId)) {
    redirect(`/a/${account || "home"}`);
  }
  const ctx = await getAccessContext({ params: { account }, route: previewPath });
  const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;
  if (
    !ctx ||
    ctx.blocked ||
    ctx.account?.status !== "active" ||
    !accountId ||
    !["owner", "admin"].includes(String(ctx.role))
  ) redirect(`${previewPath}&action_error=approval`);
  const result = await approveAccountLandingPageRevision({
    accountId,
    landingPageId,
    materializationId,
  });
  if (!result.ok) redirect(`${previewPath}&action_error=approval`);
  revalidatePath(`/a/${account}`);
  revalidatePath(`/a/${account}/landing-pages/${landingPageId}`);
  revalidatePath(`/a/${account}/landing-pages/${landingPageId}/preview`);
  redirect(`${previewPath}&approved=${materializationId}`);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
