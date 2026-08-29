import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { MatchBusinessTaxonsResult } from "../contracts";
import {
  matchBusinessTaxonsDeterministicCore,
  type TaxonMatchRpc,
} from "./taxonMatchAdapterCore";

export async function matchBusinessTaxonsDeterministic(
  query: string,
  limit = 10,
): Promise<MatchBusinessTaxonsResult> {
  const supabase = createServiceClient();
  const rpc: TaxonMatchRpc = (name, args) =>
    supabase.rpc(name, args) as unknown as ReturnType<TaxonMatchRpc>;
  return matchBusinessTaxonsDeterministicCore(query, limit, rpc);
}
