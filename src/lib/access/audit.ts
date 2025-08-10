import type { AccessContext } from './types';

/**
 * Auditoria de eventos de contexto (MVP obrigatório).
 * Implementação real usará RPC/queue -> triggers -> audit_logs.
 * Aqui mantemos só as assinaturas.
 */

export async function auditAccountSwitch(_ctx: AccessContext): Promise<void> {
  // TODO: chamar RPC audit_context_event('account_switch', ...)
}

export async function auditActingAsEnter(_ctx: AccessContext): Promise<void> {
  // TODO: RPC audit_context_event('acting_as_enter', ...)
}

export async function auditActingAsExit(_ctx: AccessContext): Promise<void> {
  // TODO: RPC audit_context_event('acting_as_exit', ...)
}
