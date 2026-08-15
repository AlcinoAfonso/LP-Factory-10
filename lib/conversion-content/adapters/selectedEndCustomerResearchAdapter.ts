import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  isEndCustomerResearchSelectionEnabled,
  type LoadSelectedEndCustomerResearchResult,
} from "../landing-page/taxon-preparation";
import { loadSelectedEndCustomerResearchFromClient } from "./selectedEndCustomerResearchAdapterCore";

export async function loadSelectedEndCustomerResearchForTaxon(input: {
  taxonId: string;
}): Promise<LoadSelectedEndCustomerResearchResult> {
  if (!isEndCustomerResearchSelectionEnabled()) {
    return {
      ok: false,
      error: {
        code: "FEATURE_DISABLED",
        message: "A leitura da pesquisa selecionada está desabilitada.",
      },
    };
  }

  const supabase = createServiceClient();
  return loadSelectedEndCustomerResearchFromClient(input, supabase);
}
