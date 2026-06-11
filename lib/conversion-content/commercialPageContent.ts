import "server-only";

import type {
  CommercialGeneratedContent,
  CommercialTemplateResolutionSource,
} from "./contracts";
import { resolveAccountDashboardCommercialTemplate } from "./adapters/commercialTemplateResolver";
import { ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_FALLBACK_CONTENT } from "./templates/accountDashboardCommercialPage";

export type CommercialPageContentResult = {
  content: CommercialGeneratedContent;
  contentOrigin: "fallback";
  resolutionSource: CommercialTemplateResolutionSource;
  accountTaxonName: string | null;
  researchTaxonName: string | null;
  alerts: string[];
};

export async function resolveCommercialPageContent(input: {
  accountId: string;
}): Promise<CommercialPageContentResult> {
  const resolution = await resolveAccountDashboardCommercialTemplate({
    accountId: input.accountId,
  });

  if (resolution.source === "generic") {
    console.info("commercialPageContent fallback selected:", {
      template: resolution.template.key,
      templateVersion: resolution.template.version,
      resolutionSource: resolution.source,
      fallbackReason: resolution.missingDataAlerts[0] ?? "generic_fallback",
    });
  }

  return {
    content: ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_FALLBACK_CONTENT,
    contentOrigin: "fallback",
    resolutionSource: resolution.source,
    accountTaxonName: resolution.accountTaxon?.name ?? null,
    researchTaxonName: resolution.researchTaxon?.name ?? null,
    alerts: [
      ...resolution.missingDataAlerts,
      ...ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_FALLBACK_CONTENT.missingDataAlerts,
    ],
  };
}
