import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  loadEndCustomerResearchCandidate,
  type EndCustomerResearchErrorCode,
  type LoadEndCustomerResearchCandidateResult,
  type LoadSelectedEndCustomerResearchResult,
  type SelectedEndCustomerResearchErrorCode,
} from "../landing-page/taxon-preparation";

export type SelectedEndCustomerResearchReadClient = Pick<SupabaseClient, "from">;

type CandidateLoader = (input: {
  taxon: { slug: string; isActive: boolean };
  researchVersion: number;
}) => Promise<LoadEndCustomerResearchCandidateResult>;

export async function loadSelectedEndCustomerResearchFromClient(
  input: { taxonId: string },
  supabase: SelectedEndCustomerResearchReadClient,
  loadCandidate: CandidateLoader = loadEndCustomerResearchCandidate,
): Promise<LoadSelectedEndCustomerResearchResult> {
  const taxonId = input.taxonId.trim();
  if (!z.uuid().safeParse(taxonId).success) {
    return failure("INVALID_TAXON_ID", "O identificador do taxon é inválido.");
  }

  let row: unknown;
  try {
    const { data, error } = await supabase
      .from("business_taxons")
      .select("id,slug,is_active,selected_end_customer_research_version")
      .eq("id", taxonId)
      .limit(1)
      .maybeSingle();

    if (error) {
      return failure("DATABASE_READ_FAILED", "Não foi possível ler a seleção da pesquisa.");
    }
    row = data;
  } catch {
    return failure("DATABASE_READ_FAILED", "Não foi possível ler a seleção da pesquisa.");
  }

  if (row === null) return failure("TAXON_NOT_FOUND", "O taxon não existe.");
  if (!isRecord(row) || row.id !== taxonId || typeof row.slug !== "string") {
    return failure("TAXON_IDENTITY_INVALID", "A identidade persistida do taxon é inválida.");
  }
  if (typeof row.is_active !== "boolean") {
    return failure("TAXON_IDENTITY_INVALID", "O estado persistido do taxon é inválido.");
  }
  if (!row.is_active) return failure("TAXON_INACTIVE", "O taxon está inativo.");

  const selectedVersion = row.selected_end_customer_research_version;
  if (selectedVersion === null) {
    return failure("SELECTION_ABSENT", "O taxon não possui pesquisa integral selecionada.");
  }
  if (!Number.isSafeInteger(selectedVersion) || Number(selectedVersion) <= 0) {
    return failure("SELECTED_VERSION_INVALID", "A versão selecionada é inválida.");
  }

  let candidate: LoadEndCustomerResearchCandidateResult;
  try {
    candidate = await loadCandidate({
      taxon: { slug: row.slug, isActive: row.is_active },
      researchVersion: Number(selectedVersion),
    });
  } catch {
    return failure("FILESYSTEM_READ_FAILED", "Não foi possível ler a pesquisa selecionada.");
  }

  if (!candidate.ok) return mapCandidateFailure(candidate.error.code);

  return Object.freeze({
    ok: true,
    value: Object.freeze({
      taxonId,
      taxonSlug: row.slug,
      selectedResearchVersion: Number(selectedVersion),
      selectedResearchValid: true as const,
      research: candidate.value,
    }),
  });
}

function mapCandidateFailure(
  code: EndCustomerResearchErrorCode,
): Extract<LoadSelectedEndCustomerResearchResult, { ok: false }> {
  switch (code) {
    case "FILE_NOT_FOUND":
      return failure("FILE_NOT_FOUND", "O arquivo da pesquisa selecionada não existe.");
    case "READ_FAILED":
      return failure("FILESYSTEM_READ_FAILED", "Não foi possível ler a pesquisa selecionada.");
    case "METADATA_INVALID":
      return failure("METADATA_INVALID", "A metadata da pesquisa selecionada é incompatível.");
    case "CONTENT_EMPTY":
      return failure("CONTENT_EMPTY", "A pesquisa selecionada está vazia.");
    case "INVALID_RESEARCH_VERSION":
      return failure("SELECTED_VERSION_INVALID", "A versão selecionada é inválida.");
    case "TAXON_INACTIVE":
      return failure("TAXON_INACTIVE", "O taxon está inativo.");
    case "INVALID_TAXON_SLUG":
    case "PATH_OUTSIDE_RESEARCH_ROOT":
      return failure("TAXON_IDENTITY_INVALID", "A identidade persistida do taxon é inválida.");
  }
}

function failure(
  code: SelectedEndCustomerResearchErrorCode,
  message: string,
): Extract<LoadSelectedEndCustomerResearchResult, { ok: false }> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
