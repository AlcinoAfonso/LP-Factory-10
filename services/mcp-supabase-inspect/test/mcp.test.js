const assert = require('node:assert/strict')
const { afterEach, test } = require('node:test')

const handler = require('../api/mcp')

const originalSecret = process.env.LPF_MCP_SECRET

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.LPF_MCP_SECRET
  } else {
    process.env.LPF_MCP_SECRET = originalSecret
  }
})

function createResponse() {
  return {
    body: undefined,
    headers: {},
    statusCode: 200,
    status(code) {
      this.statusCode = code
      return this
    },
    setHeader(name, value) {
      this.headers[name] = value
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    send(payload) {
      this.body = payload
      return this
    },
  }
}

test('returns 401 when authorization is missing', async () => {
  process.env.LPF_MCP_SECRET = 'test-secret'
  const req = { headers: {}, method: 'GET' }
  const res = createResponse()

  await handler(req, res)

  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { error: 'Unauthorized' })
})

test('returns 401 when bearer token is invalid', async () => {
  process.env.LPF_MCP_SECRET = 'test-secret'
  const req = {
    headers: { authorization: 'Bearer invalid-secret' },
    method: 'GET',
  }
  const res = createResponse()

  await handler(req, res)

  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { error: 'Unauthorized' })
})

test('preserves authenticated MCP initialization', async () => {
  process.env.LPF_MCP_SECRET = 'test-secret'
  const req = {
    body: {
      id: 1,
      jsonrpc: '2.0',
      method: 'initialize',
    },
    headers: { authorization: 'Bearer test-secret' },
    method: 'POST',
  }
  const res = createResponse()

  await handler(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.jsonrpc, '2.0')
  assert.equal(res.body.id, 1)
  assert.equal(res.body.result.serverInfo.name, 'lpf-supabase-mcp')
})
