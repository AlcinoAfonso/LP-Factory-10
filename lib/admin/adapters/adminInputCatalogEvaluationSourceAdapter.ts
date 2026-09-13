import "server-only";

import type {
  LandingPageInputCatalogTaxonChain,
  LandingPageInputCatalogTaxonIdentity,
} from "@/conversion-content/landing-page/input-catalog";
import { readCompleteTaxonChainForAdminEvaluation } from "@/conversion-content/adapters/taxonChainAdapter";
import {
  isEndCustomerResearchSelectionEnabled,
  loadEndCustomerResearchCandidate,
  type LoadSelectedEndCustomerResearchResult,
  type SelectedEndCustomerResearchErrorCode,
} from "@/conversion-content/landing-page/taxon-preparation";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminInputCatalogEvaluationSourcesResult =
  | Readonly<{
      ok: true;
      selectedResearch: LoadSelectedEndCustomerResearchResult;
      taxonChain: LandingPageInputCatalogTaxonChain;
      reviewedInputCatalogVersion: number | null;
    }>
  | Readonly<{ ok: false; message: string }>;

export async function loadAdminInputCatalogEvaluationSources(
  taxonId: string,
): Promise<AdminInputCatalogEvaluationSourcesResult> {
  if (!UUID_PATTERN.test(taxonId)) {
    return { ok: false, message: "O identificador do taxon é inválido." };
  }
  if (!isEndCustomerResearchSelectionEnabled()) {
    return { ok: false, message: "A leitura da pesquisa selecionada está desabilitada." };
  }
  const chain = await readCompleteTaxonChainForAdminEvaluation(taxonId);
  if (!chain.ok) return { ok: false, message: chain.error.message };

  const client = createServiceClient();
  let selection: unknown;
  try {
    const { data, error } = await client
      .from("business_taxons")
      .select("id,selected_end_customer_research_version,reviewed_input_catalog_version")
      .eq("id", chain.value.selected.id)
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, message: "A seleção administrativa da pesquisa não pôde ser lida." };
    selection = data;
  } catch {
    return { ok: false, message: "A seleção administrativa da pesquisa não pôde ser lida." };
  }
  if (!isRecord(selection) || selection.id !== chain.value.selected.id) {
    return { ok: false, message: "A seleção administrativa da pesquisa possui identidade inválida." };
  }

  const selectedResearch = await loadAdminSelectedResearch(
    chain.value.selected,
    selection.selected_end_customer_research_version,
  );
  const reviewedInputCatalogVersion = selection.reviewed_input_catalog_version === null
    ? null
    : Number(selection.reviewed_input_catalog_version);
  if (
    reviewedInputCatalogVersion !== null &&
    (!Number.isSafeInteger(reviewedInputCatalogVersion) || reviewedInputCatalogVersion <= 0)
  ) {
    return { ok: false, message: "O marcador factual administrativo do taxon é inválido." };
  }
  return Object.freeze({
    ok: true,
    selectedResearch,
    taxonChain: chain.value.chain,
    reviewedInputCatalogVersion,
  });
}

async function loadAdminSelectedResearch(
  taxon: LandingPageInputCatalogTaxonIdentity,
  selectedVersion: unknown,
): Promise<LoadSelectedEndCustomerResearchResult> {
  if (selectedVersion === null) {
    return selectedFailure("SELECTION_ABSENT", "O taxon não possui pesquisa integral selecionada.");
  }
  if (!Number.isSafeInteger(selectedVersion) || Number(selectedVersion) <= 0) {
    return selectedFailure("SELECTED_VERSION_INVALID", "A versão selecionada é inválida.");
  }
  const candidate = await loadEndCustomerResearchCandidate({
    taxon: { slug: taxon.slug, isActive: true },
    researchVersion: Number(selectedVersion),
  });
  if (!candidate.ok) return selectedFailure(mapResearchError(candidate.error.code), candidate.error.message);
  return Object.freeze({
    ok: true,
    value: Object.freeze({
      taxonId: taxon.id,
      taxonSlug: taxon.slug,
      taxonName: taxon.name,
      taxonLevel: taxon.level,
      parentTaxonId: taxon.parentId,
      selectedResearchVersion: Number(selectedVersion),
      selectedResearchValid: true as const,
      research: candidate.value,
    }),
  });
}

function mapResearchError(
  code: "FILE_NOT_FOUND" | "READ_FAILED" | "METADATA_INVALID" | "CONTENT_EMPTY" | "INVALID_RESEARCH_VERSION" | "TAXON_INACTIVE" | "INVALID_TAXON_SLUG" | "PATH_OUTSIDE_RESEARCH_ROOT",
): SelectedEndCustomerResearchErrorCode {
  switch (code) {
    case "FILE_NOT_FOUND": return "FILE_NOT_FOUND";
    case "READ_FAILED": return "FILESYSTEM_READ_FAILED";
    case "METADATA_INVALID": return "METADATA_INVALID";
    case "CONTENT_EMPTY": return "CONTENT_EMPTY";
    case "INVALID_RESEARCH_VERSION": return "SELECTED_VERSION_INVALID";
    case "TAXON_INACTIVE": return "TAXON_INACTIVE";
    case "INVALID_TAXON_SLUG":
    case "PATH_OUTSIDE_RESEARCH_ROOT": return "TAXON_IDENTITY_INVALID";
  }
}

function selectedFailure(
  code: SelectedEndCustomerResearchErrorCode,
  message: string,
): Extract<LoadSelectedEndCustomerResearchResult, { ok: false }> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
