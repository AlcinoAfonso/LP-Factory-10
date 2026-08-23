"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAccessContext } from "@/lib/access/getAccessContext";
import { createWorkspaceLandingPage } from "@/lp-builder";

export async function createLandingPageWorkspaceAction(formData: FormData) {
  const account = String(formData.get("account") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const accountId = await authorizedAccountId(account);
  if (!accountId || !name || !slug) redirect(`/a/${account || "home"}?workspace_error=create`);
  const result = await createWorkspaceLandingPage({ accountId, name, slug });
  if (!result.ok || !result.landingPageId) {
    redirect(`/a/${account}?workspace_error=create`);
  }
  revalidatePath(`/a/${account}`);
  redirect(`/a/${account}/landing-pages/${result.landingPageId}`);
}

async function authorizedAccountId(account: string) {
  if (!account || account === "home") return null;
  const ctx = await getAccessContext({ params: { account }, route: `/a/${account}` });
  if (
    !ctx ||
    ctx.blocked ||
    ctx.account?.status !== "active" ||
    !["owner", "admin"].includes(String(ctx.role))
  ) return null;
  return (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
}
