import { AccessError } from './types';
import type { AccessContext, Role } from './types';

/** Compara hierarquia de papéis */
const roleWeight: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function requireActive(ctx: AccessContext): void {
  if (ctx.status !== 'active') {
    throw new AccessError('INACTIVE_MEMBER', 'Vínculo não está ativo.');
  }
}

export function requireRole(ctx: AccessContext, atLeast: Role): void {
  if (roleWeight[ctx.role] < roleWeight[atLeast]) {
    throw new AccessError('FORBIDDEN_ACCOUNT', 'Permissão insuficiente.');
  }
}

/** Ex.: domínios só admin/owner */
export function canManageDomains(ctx: AccessContext): boolean {
  return roleWeight[ctx.role] >= roleWeight['admin'];
}

/** Ex.: integrações só admin/owner */
export function canManageIntegrations(ctx: AccessContext): boolean {
  return roleWeight[ctx.role] >= roleWeight['admin'];
}

/**
 * Protege o último owner: o chamador deve verificar
 * se a operação deixaria a conta sem owner e, se sim, bloquear.
 * A implementação real recebe um provider que retorna a contagem de owners.
 */
export type OwnerCountProvider = (account_id: string) => Promise<number>;

export async function protectLastOwner(
  ctx: AccessContext,
  ownerCountProvider: OwnerCountProvider,
): Promise<void> {
  if (ctx.role !== 'owner') return; // operação pode ser gerencial; validação ainda é necessária
  const owners = await ownerCountProvider(ctx.account_id);
  if (owners <= 1) {
    throw new AccessError('NO_OWNER_GUARD', 'Ação proibida: último owner.');
  }
}
