const { timingSafeEqual } = require('node:crypto')
const { Pool } = require('pg')

const PROTOCOL_VERSION = '2025-06-18'
const SERVER_INFO = {
  name: 'lpf-supabase-mcp',
  version: '0.1.0',
}

const DEFAULT_SAMPLE_LIMIT = 10
const MAX_SAMPLE_LIMIT = 20
const MAX_CELL_CHARS = 200
const MAX_PAYLOAD_CHARS = 10_000

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`[mcp] Missing env: ${name}`)
  return value
}

function getPool() {
  if (global.__lpfMcpPool) return global.__lpfMcpPool

  global.__lpfMcpPool = new Pool({
    connectionString: requireEnv('SUPABASE_DB_URL_READONLY'),
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  })

  return global.__lpfMcpPool
}

function baseHeaders() {
  return {
    'Cache-Control': 'no-store',
    'MCP-Protocol-Version': PROTOCOL_VERSION,
  }
}

function safeEqual(a, b) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

function getBearerToken(req) {
  const header = req.headers.authorization

  if (!header) return null
  const raw = Array.isArray(header) ? header[0] : header

  const [scheme, token] = raw.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

function isAuthorized(req) {
  const token = getBearerToken(req)
  const secret = process.env.LPF_MCP_SECRET
  if (!token || !secret) return false
  return safeEqual(token, secret)
}

function sendJson(res, status, payload) {
  res.status(status).setHeader('Cache-Control', 'no-store')
  res.setHeader('MCP-Protocol-Version', PROTOCOL_VERSION)
  res.json(payload)
}

function jsonRpcResult(res, id, result, status = 200) {
  sendJson(res, status, { jsonrpc: '2.0', id, result })
}

function jsonRpcError(res, id, code, message, status = 200, data) {
  sendJson(res, status, {
    jsonrpc: '2.0',
    id,
    error: data ? { code, message, data } : { code, message },
  })
}

function quoteIdent(value) {
  return `"${value.replace(/"/g, '""')}"`
}

function truncateString(value) {
  if (value.length <= MAX_CELL_CHARS) return value
  return `${value.slice(0, MAX_CELL_CHARS)}…`
}

function sanitizeValue(value) {
  if (value == null) return value
  if (typeof value === 'string') return truncateString(value)
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, sanitizeValue(inner)]),
    )
  }
  return value
}

function clampPayload(value) {
  const sanitized = sanitizeValue(value)
  const raw = JSON.stringify(sanitized)

  if (raw.length <= MAX_PAYLOAD_CHARS) {
    return sanitized
  }

  if (
    sanitized &&
    typeof sanitized === 'object' &&
    !Array.isArray(sanitized) &&
    Array.isArray(sanitized.rows)
  ) {
    const base = sanitized
    const rows = [...(base.rows ?? [])]

    while (rows.length > 0) {
      const candidate = {
        ...base,
        rows,
        sampleCount: rows.length,
        truncated: true,
      }
      if (JSON.stringify(candidate).length <= MAX_PAYLOAD_CHARS) {
        return candidate
      }
      rows.pop()
    }
  }

  return {
    truncated: true,
    preview: `${raw.slice(0, MAX_PAYLOAD_CHARS)}…`,
  }
}

async function getPublicTables() {
  const pool = getPool()
  const result = await pool.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
      order by table_name
    `)

  return result.rows.map((row) => row.table_name)
}

async function assertTableExists(tableName) {
  if (typeof tableName !== 'string' || tableName.trim() === '') {
    throw new Error('table_name is required')
  }

  const normalized = tableName.trim()
  const tables = await getPublicTables()

  if (!tables.includes(normalized)) {
    throw new Error(`Unknown table in public schema: ${normalized}`)
  }

  return normalized
}

async function runListTables() {
  const pool = getPool()
  const result = await pool.query(`
      select table_schema, table_name, table_type
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
      order by table_name
    `)

  return clampPayload({
    schema: 'public',
    count: result.rowCount,
    tables: result.rows.map((row) => ({
      schema: row.table_schema,
      tableName: row.table_name,
      kind: row.table_type,
    })),
  })
}

async function runInspectTableBundle(rawTableName) {
  const tableName = await assertTableExists(rawTableName)
  const pool = getPool()

  const [columnsResult, pkResult, indexesResult, triggersResult] =
    await Promise.all([
      pool.query(
        `
          select
            column_name,
            data_type,
            is_nullable,
            column_default,
            ordinal_position
          from information_schema.columns
          where table_schema = 'public'
            and table_name = $1
          order by ordinal_position
        `,
        [tableName],
      ),
      pool.query(
        `
          select kcu.column_name
          from information_schema.table_constraints tc
          join information_schema.key_column_usage kcu
            on tc.constraint_name = kcu.constraint_name
           and tc.table_schema = kcu.table_schema
           and tc.table_name = kcu.table_name
          where tc.table_schema = 'public'
            and tc.table_name = $1
            and tc.constraint_type = 'PRIMARY KEY'
          order by kcu.ordinal_position
        `,
        [tableName],
      ),
      pool.query(
        `
          select indexname, indexdef
          from pg_indexes
          where schemaname = 'public'
            and tablename = $1
          order by indexname
        `,
        [tableName],
      ),
      pool.query(
        `
          select
            t.tgname as trigger_name,
            pg_get_triggerdef(t.oid, true) as trigger_definition,
            p.proname as function_name,
            pn.nspname as function_schema
          from pg_trigger t
          join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          join pg_proc p on p.oid = t.tgfoid
          join pg_namespace pn on pn.oid = p.pronamespace
          where not t.tgisinternal
            and n.nspname = 'public'
            and c.relname = $1
          order by t.tgname
        `,
        [tableName],
      ),
    ])

  const triggerFunctions = Array.from(
    new Map(
      triggersResult.rows.map((row) => [
        `${row.function_schema}.${row.function_name}`,
        {
          schema: row.function_schema,
          functionName: row.function_name,
        },
      ]),
    ).values(),
  )

  return clampPayload({
    schema: 'public',
    tableName,
    columns: columnsResult.rows.map((row) => ({
      name: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === 'YES',
      default: row.column_default,
      ordinalPosition: row.ordinal_position,
    })),
    primaryKey: pkResult.rows.map((row) => row.column_name),
    indexes: indexesResult.rows.map((row) => ({
      name: row.indexname,
      definition: row.indexdef,
    })),
    triggers: triggersResult.rows.map((row) => ({
      triggerName: row.trigger_name,
      definition: row.trigger_definition,
      functionName: row.function_name,
      functionSchema: row.function_schema,
    })),
    functions: triggerFunctions,
    views: [],
    note: 'views relacionadas ficam vazias na v1 quando não forem simples de obter',
  })
}

async function runInspectRlsBundle(rawTableName) {
  const tableName = await assertTableExists(rawTableName)
  const pool = getPool()

  const [tableSecurityResult, policiesResult] = await Promise.all([
    pool.query(
      `
        select
          c.relrowsecurity as rls_enabled,
          c.relforcerowsecurity as rls_forced
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = $1
        limit 1
      `,
      [tableName],
    ),
    pool.query(
      `
        select policyname, permissive, roles, cmd, qual, with_check
        from pg_policies
        where schemaname = 'public'
          and tablename = $1
        order by policyname
      `,
      [tableName],
    ),
  ])

  const security = tableSecurityResult.rows[0] ?? {
    rls_enabled: false,
    rls_forced: false,
  }
  const policyCount = policiesResult.rowCount ?? 0

  return clampPayload({
    schema: 'public',
    tableName,
    rlsEnabled: security.rls_enabled,
    rlsForced: security.rls_forced,
    policies: policiesResult.rows.map((row) => ({
      name: row.policyname,
      permissive: row.permissive,
      roles: row.roles,
      command: row.cmd,
      using: row.qual,
      withCheck: row.with_check,
    })),
    summary: {
      policyCount,
      hasPolicies: policyCount > 0,
    },
  })
}

async function runSampleRows(rawTableName, rawLimit) {
  const tableName = await assertTableExists(rawTableName)

  const normalizedLimit =
    typeof rawLimit === 'number' && Number.isFinite(rawLimit)
      ? rawLimit
      : DEFAULT_SAMPLE_LIMIT

  const limit = Math.max(1, Math.min(MAX_SAMPLE_LIMIT, normalizedLimit))
  const pool = getPool()

  const sql = `
    select *
    from ${quoteIdent('public')}.${quoteIdent(tableName)}
    limit ${limit}
  `

  const result = await pool.query(sql)

  return clampPayload({
    schema: 'public',
    tableName,
    sampleCount: result.rowCount,
    columns: result.fields.map((field) => field.name),
    rows: result.rows,
  })
}

function buildToolList() {
  return [
    {
      name: 'list_tables',
      description: 'Lista tabelas base do schema public',
      inputSchema: {
        type: 'object',
        properties: {
          schema: { type: 'string', description: 'Ignorado; schema fixo public' },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: 'inspect_table_bundle',
      description: 'Inspeciona estrutura principal de uma tabela do schema public',
      inputSchema: {
        type: 'object',
        properties: {
          table_name: { type: 'string' },
          schema: { type: 'string', description: 'Ignorado; schema fixo public' },
        },
        required: ['table_name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: 'inspect_rls_bundle',
      description: 'Inspeciona RLS e policies de uma tabela do schema public',
      inputSchema: {
        type: 'object',
        properties: {
          table_name: { type: 'string' },
          schema: { type: 'string', description: 'Ignorado; schema fixo public' },
        },
        required: ['table_name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: 'sample_rows',
      description: 'Retorna amostra controlada de linhas de uma tabela do schema public',
      inputSchema: {
        type: 'object',
        properties: {
          table_name: { type: 'string' },
          schema: { type: 'string', description: 'Ignorado; schema fixo public' },
          limit: { type: 'number', minimum: 1, maximum: 20 },
        },
        required: ['table_name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
    },
  ]
}

async function executeToolCall(name, args) {
  switch (name) {
    case 'list_tables':
      return runListTables()
    case 'inspect_table_bundle':
      return runInspectTableBundle(args.table_name)
    case 'inspect_rls_bundle':
      return runInspectRlsBundle(args.table_name)
    case 'sample_rows':
      return runSampleRows(args.table_name, args.limit)
    default:
      throw new Error(`Unsupported tool: ${name}`)
  }
}

async function handlePost(req, res) {
  const body = req.body

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    jsonRpcError(res, null, -32600, 'Invalid Request', 400)
    return
  }

  const id = body.id ?? null
  const method = body.method

  if (typeof method !== 'string' || method.length === 0) {
    jsonRpcError(res, id, -32600, 'Invalid Request', 400)
    return
  }

  if (method.startsWith('notifications/')) {
    res.status(204).setHeader('Cache-Control', 'no-store')
    res.setHeader('MCP-Protocol-Version', PROTOCOL_VERSION)
    res.send('')
    return
  }

  try {
    switch (method) {
      case 'initialize':
        jsonRpcResult(res, id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        })
        return

      case 'ping':
        jsonRpcResult(res, id, {})
        return

      case 'tools/list':
        jsonRpcResult(res, id, {
          tools: buildToolList(),
        })
        return

      case 'tools/call': {
        const params =
          body.params && typeof body.params === 'object' ? body.params : {}

        const name = params.name
        const args =
          params.arguments && typeof params.arguments === 'object'
            ? params.arguments
            : {}

        if (
          name !== 'list_tables' &&
          name !== 'inspect_table_bundle' &&
          name !== 'inspect_rls_bundle' &&
          name !== 'sample_rows'
        ) {
          jsonRpcError(res, id, -32602, 'Invalid params: unknown tool')
          return
        }

        const structuredContent = await executeToolCall(name, args)

        jsonRpcResult(res, id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(structuredContent, null, 2),
            },
          ],
          structuredContent,
          isError: false,
        })
        return
      }

      default:
        jsonRpcError(res, id, -32601, `Method not found: ${method}`)
        return
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected MCP server error'

    console.error('[mcp] request failed', {
      method,
      id,
      message,
    })

    jsonRpcError(res, id, -32000, message)
  }
}

module.exports = async function handler(req, res) {
  for (const [key, value] of Object.entries(baseHeaders())) {
    res.setHeader(key, value)
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { error: 'Unauthorized' })
    return
  }

  if (req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      endpoint: '/api/mcp',
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: SERVER_INFO,
      tools: buildToolList().map((tool) => tool.name),
    })
    return
  }

  if (req.method === 'POST') {
    await handlePost(req, res)
    return
  }

  sendJson(res, 405, { error: 'Method not allowed' })
}
