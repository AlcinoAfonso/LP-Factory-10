"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { approveAccountLandingPageRevision } from "@/lp-builder";
import { loadLandingPagePreview } from "@/lp-builder/adapters/landingPagePreviewAdapter";

export async function approveLandingPageRevisionAction(formData: FormData) {
  const account = String(formData.get("account") ?? "").trim().toLowerCase();
  const landingPageId = String(formData.get("landing_page_id") ?? "").trim();
  const materializationId = String(formData.get("materialization_id") ?? "").trim();
  if (!account || account === "home" || !isUuid(landingPageId) || !isUuid(materializationId)) {
    redirect(`/a/${account || "home"}`);
  }
  const previewPath = `/a/${account}/landing-pages/${landingPageId}/preview?revision=${materializationId}`;
  const ctx = await getAccessContext({ params:{account}, route:previewPath });
  const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string|null;
  if (!ctx || ctx.blocked || ctx.account?.status !== "active" || !accountId || !["owner","admin"].includes(String(ctx.role))) {
    redirect(`${previewPath}&action_error=approval`);
  }
  const preview = await loadLandingPagePreview({
    accountSlug: account,
    landingPageId,
    revisionId: materializationId,
  });
  if (
    preview.status !== "ready" ||
    preview.model.revision.id !== materializationId ||
    preview.landingPage.status === "archived"
  ) {
    redirect(`${previewPath}&action_error=approval_validation`);
  }
  const result = await approveAccountLandingPageRevision({ accountId, landingPageId, materializationId });
  if (!result.ok) redirect(`${previewPath}&action_error=approval`);
  revalidatePath(`/a/${account}`);
  revalidatePath(`/a/${account}/landing-pages/${landingPageId}`);
  revalidatePath(`/a/${account}/landing-pages/${landingPageId}/preview`);
  redirect(`${previewPath}&approved=${materializationId}`);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
