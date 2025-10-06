/**
 * Base Técnica 1.0 — Camadas/Segurança:
 * - service_role: uso EXCLUSIVO em server-side (adapters Admin, APIs, rotas SSR)
 * - UI nunca importa este módulo
 * - Persistência de sessão desativada
 */

import { createClient } from '@supabase/supabase-js'

/** Erros de configuração claros (fail fast) */
function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`[supabase/service] Missing env: ${name}`)
  return v
}

/** Proteção básica contra uso em browser */
function assertServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error('[supabase/service] Must be used on server-side only')
  }
}

/** Singleton (evita múltiplas instâncias em dev/hot-reload) */
let _svc:
  | ReturnType<typeof createClient<any, 'public', any>>
  | undefined

export function createServiceClient() {
  assertServerSide()

  if (_svc) return _svc

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  _svc = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      // Opcional: envia cabeçalho para auditoria lado servidor
      headers: { 'x-lpf-role': 'service' },
    },
  })

  return _svc
}

/**
 * NOTAS DE USO
 * - Importar APENAS em: src/lib/admin/adapters/*, rotas /api/* e SSR loaders.
 * - NÃO importar em componentes/client.
 * - Views com GRANT para 'service_role' (ex.: v_admin_tokens_with_usage) DEVEM
 *   ser consultadas via este client.
 */
