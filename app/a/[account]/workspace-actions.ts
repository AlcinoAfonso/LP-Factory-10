"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  createOperationalAccountLandingPage,
  setAccountLandingPageArchived,
} from "@/lp-builder";

export async function createLandingPageWorkspaceAction(formData: FormData) {
  const account = String(formData.get("account") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const accountId = await authorizedAccountId(account);
  if (!accountId || !name || !slug) redirect(`/a/${account}?workspace_error=create`);
  const result = await createOperationalAccountLandingPage({ accountId, name, slug });
  if (!result.ok || !result.landingPageId) redirect(`/a/${account}?workspace_error=create`);
  revalidatePath(`/a/${account}`);
  redirect(`/a/${account}/landing-pages/${result.landingPageId}`);
}

export async function setLandingPageArchivedAction(formData: FormData) {
  const account = String(formData.get("account") ?? "").trim().toLowerCase();
  const landingPageId = String(formData.get("landing_page_id") ?? "").trim();
  const archived = String(formData.get("archived") ?? "") === "1";
  const accountId = await authorizedAccountId(account);
  if (!accountId) redirect(`/a/${account}?workspace_error=lifecycle`);
  const result = await setAccountLandingPageArchived({ accountId, landingPageId, archived });
  if (!result.ok) redirect(`/a/${account}?workspace_error=lifecycle`);
  revalidatePath(`/a/${account}`);
  revalidatePath(`/a/${account}/landing-pages/${landingPageId}`);
  redirect(`/a/${account}${archived ? "?archived=1" : ""}`);
}

async function authorizedAccountId(account: string) {
  if (!account || account === "home") return null;
  const ctx = await getAccessContext({ params: { account }, route: `/a/${account}` });
  if (!ctx || ctx.blocked || ctx.account?.status !== "active" || !["owner", "admin"].includes(String(ctx.role))) return null;
  return (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
}
