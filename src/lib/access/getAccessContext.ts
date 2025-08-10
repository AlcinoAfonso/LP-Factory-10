import type { AccessContext, AccessInput } from './types';
import { AccessError } from './types';

/**
 * Resolve o tenant (account_slug), valida vínculo ativo e monta o AccessContext.
 * Depende de Supabase (RLS ON) e de fetchPlanAndLimits(). Apenas assinatura aqui.
 */
export async function getAccessContext(
  _input: AccessInput,
): Promise<AccessContext> {
  // TODO:
  // 1) Resolver account_slug por host/subdomínio (preferência) ou rota
  // 2) Obter account_id por slug (RLS)
  // 3) Ler vínculo (account_users) -> status e role (RLS)
  // 4) Ler super_admin e definir acting_as quando representar uma account
  // 5) Carregar plan/limits via view/RPC
  // 6) Retornar AccessContext completo
  throw new AccessError('UNRESOLVED_TENANT', 'Tenant não resolvido.');
}
