import type { Limits, PlanInfo } from './types';

/**
 * Contrato para obter plano e limites (fonte única = Supabase view/RPC).
 * Implementação real virá depois. Aqui é apenas assinatura.
 */
export async function fetchPlanAndLimits(
  _account_id: string,
): Promise<{ plan: PlanInfo; limits: Limits }> {
  // TODO: chamar view/RPC no Supabase (RLS ON)
  throw new Error('fetchPlanAndLimits() não implementado.');
}
