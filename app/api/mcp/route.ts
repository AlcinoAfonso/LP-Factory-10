import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getServiceUrl() {
  return process.env.MCP_SUPABASE_INSPECT_URL
}

function baseHeaders(): HeadersInit {
  return {
    'Cache-Control': 'no-store',
  }
}

function serviceUnavailableResponse() {
  return NextResponse.json(
    {
      error: 'MCP service unavailable',
      message:
        'Configure MCP_SUPABASE_INSPECT_URL to enable /api/mcp compatibility proxy.',
    },
    { status: 503, headers: baseHeaders() },
  )
}

async function proxyToService(req: NextRequest, method: 'GET' | 'POST') {
  const serviceUrl = getServiceUrl()

  if (!serviceUrl) {
    return serviceUnavailableResponse()
  }

  const headers = new Headers()

  const authorization = req.headers.get('authorization')
  if (authorization) headers.set('authorization', authorization)

  const protocolVersion = req.headers.get('MCP-Protocol-Version')
  if (protocolVersion) headers.set('MCP-Protocol-Version', protocolVersion)

  let body: string | undefined

  if (method === 'POST') {
    body = await req.text()
    headers.set('content-type', 'application/json')
  }

  const upstream = await fetch(serviceUrl, {
    method,
    headers,
    body,
    cache: 'no-store',
  })

  const text = await upstream.text()

  const responseHeaders = new Headers(baseHeaders())
  const upstreamProtocolVersion = upstream.headers.get('MCP-Protocol-Version')
  const upstreamContentType = upstream.headers.get('content-type')

  if (upstreamProtocolVersion) {
    responseHeaders.set('MCP-Protocol-Version', upstreamProtocolVersion)
  }

  if (upstreamContentType) {
    responseHeaders.set('content-type', upstreamContentType)
  }

  return new NextResponse(text, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export async function GET(req: NextRequest) {
  return proxyToService(req, 'GET')
}

export async function POST(req: NextRequest) {
  return proxyToService(req, 'POST')
}
