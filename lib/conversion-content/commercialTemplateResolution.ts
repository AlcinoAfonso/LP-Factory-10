import {
  type CommercialResearchCandidate,
  type CommercialTaxon,
  type CommercialTemplateResolution,
  type CommercialTemplateResolutionSource,
} from "./contracts";
import {
  ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_GENERIC_RESEARCH,
  ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_TEMPLATE,
} from "./templates/accountDashboardCommercialPage";

export function resolveCommercialTemplateFromCandidates(input: {
  taxonHierarchy: CommercialTaxon[];
  researchCandidates: CommercialResearchCandidate[];
}): CommercialTemplateResolution {
  const accountTaxon = input.taxonHierarchy[0] ?? null;
  const candidateByTaxon = new Map(
    input.researchCandidates.map((candidate) => [
      candidate.taxonId,
      candidate,
    ]),
  );
  const selectedIndex = input.taxonHierarchy.findIndex((taxon) =>
    candidateByTaxon.has(taxon.taxonId),
  );

  if (selectedIndex < 0) {
    return createGenericCommercialTemplateResolution({
      accountTaxon,
      alerts: [
        accountTaxon
          ? "complete_business_buyer_research_not_found"
          : "active_primary_taxon_not_found",
      ],
    });
  }

  const researchTaxon = input.taxonHierarchy[selectedIndex];
  const candidate = candidateByTaxon.get(researchTaxon.taxonId);

  if (!candidate) {
    return createGenericCommercialTemplateResolution({
      accountTaxon,
      alerts: ["complete_business_buyer_research_not_found"],
    });
  }

  return {
    template: ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_TEMPLATE,
    research: candidate.research,
    source: getResolutionSource(selectedIndex),
    accountTaxon,
    researchTaxon,
    researchSources: candidate.researchSources,
    fallbackDepth: selectedIndex,
    missingDataAlerts: [],
  };
}

export function createGenericCommercialTemplateResolution(input?: {
  accountTaxon?: CommercialTaxon | null;
  alerts?: string[];
}): CommercialTemplateResolution {
  return {
    template: ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_TEMPLATE,
    research: ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_GENERIC_RESEARCH,
    source: "generic",
    accountTaxon: input?.accountTaxon ?? null,
    researchTaxon: null,
    researchSources: [],
    fallbackDepth: null,
    missingDataAlerts: input?.alerts ?? [],
  };
}

function getResolutionSource(depth: number): CommercialTemplateResolutionSource {
  if (depth === 0) return "resolved_taxon";
  if (depth === 1) return "parent";
  return "ancestor";
}
