import "server-only";

import { readFactualCoverageForTaxon } from "./factualFieldsAdapter";
import { loadSelectedEndCustomerResearchForTaxon } from "./selectedEndCustomerResearchAdapter";
import { buildInputCatalogEvaluationContext, type InputCatalogEvaluationContext, type InputCatalogEvaluationMode } from "../landing-page/taxon-preparation";

export async function reconstructCanonicalInputCatalogEvaluationContext(input: Readonly<{ taxonId: string; mode: InputCatalogEvaluationMode }>): Promise<Readonly<{ ok: true; value: InputCatalogEvaluationContext }> | Readonly<{ ok: false; error: Readonly<{ message: string }> }>> {
  const coverage = await readFactualCoverageForTaxon(input.taxonId, { allowInactiveSelected: true });
  if (!coverage.ok) return { ok: false, error: { message: coverage.error.message } };
  const research = await loadSelectedEndCustomerResearchForTaxon({ taxonId: input.taxonId, allowInactiveTaxon: true });
  if (!research.ok && research.error.code !== "SELECTION_ABSENT" && research.error.code !== "FEATURE_DISABLED") {
    return { ok: false, error: { message: research.error.message } };
  }
  return { ok: true, value: buildInputCatalogEvaluationContext({ coverage: coverage.value, selectedResearch: research, mode: input.mode }) };
}
