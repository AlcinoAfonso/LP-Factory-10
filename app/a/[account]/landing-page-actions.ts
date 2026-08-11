"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getAccessContext } from "@/lib/access/getAccessContext";
import { materializeFirstLandingPageDraft } from "@/lp-builder";
import type { LandingPageGenerationActionState } from "./_components/landing-page-generation-action-contract";

const ACCOUNT_SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;
const GENERIC_ERROR =
  "Não foi possível gerar e materializar esta landing page agora. Nenhum conteúdo foi salvo. Tente novamente.";

export async function generateFirstLandingPageDraftAction(
  _previousState: LandingPageGenerationActionState,
  formData: FormData,
): Promise<LandingPageGenerationActionState> {
  const accountSubdomain = String(formData.get("account_subdomain") ?? "")
    .trim()
    .toLowerCase();
  const landingPageId = String(formData.get("landing_page_id") ?? "").trim();
  if (!ACCOUNT_SUBDOMAIN_RE.test(accountSubdomain) || !UUID_RE.test(landingPageId)) {
    return { status: "error", formError: GENERIC_ERROR };
  }

  const route = `/a/${accountSubdomain}`;
  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route,
  });
  if (
    !ctx ||
    ctx.blocked ||
    ctx.account?.status !== "active" ||
    (ctx.role !== "owner" && ctx.role !== "admin")
  ) {
    return {
      status: "error",
      formError: "Esta conta não está autorizada a gerar a landing page.",
    };
  }

  const accountId = (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
  if (!accountId || !UUID_RE.test(accountId)) {
    return { status: "error", formError: GENERIC_ERROR };
  }

  const requestHeaders = await headers();
  const requestIdHeader = requestHeaders.get("x-request-id")?.trim() ?? "";
  const result = await materializeFirstLandingPageDraft({
    accountId,
    landingPageId,
    ...(REQUEST_ID_RE.test(requestIdHeader) ? { requestId: requestIdHeader } : {}),
  });

  if (!result.ok && result.error !== "ALREADY_MATERIALIZED") {
    if (result.error === "NOT_READY") {
      return {
        status: "error",
        formError: "A geração ainda não está disponível neste ambiente. Nenhum conteúdo foi salvo.",
      };
    }
    if (result.error === "GENERATION_FAILED" || result.error === "INVALID_CANDIDATE") {
      return {
        status: "error",
        formError: "A candidata não pôde ser validada. Nenhum conteúdo foi salvo; tente novamente.",
      };
    }
    return { status: "error", formError: GENERIC_ERROR };
  }

  const previewRoute = `${route}/landing-pages/${landingPageId}/preview`;
  revalidatePath(route);
  revalidatePath(previewRoute);
  return { status: "success", landingPageId };
}
