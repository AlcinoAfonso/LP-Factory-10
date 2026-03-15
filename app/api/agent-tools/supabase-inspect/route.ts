// app/api/agent-tools/supabase-inspect/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  SUPABASE_INSPECT_TOOL_NAME,
  inspectReadonly,
  normalizeInspectReadonlyInput,
} from "@/lib/supabase-inspect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AuthorizationResult =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    };

function httpStatusFromToolStatus(status: string): number {
  switch (status) {
    case "ok":
      return 200;
    case "needs_clarification":
      return 400;
    case "blocked":
      return 422;
    default:
      return 500;
  }
}

function authorize(request: NextRequest): AuthorizationResult {
  const expectedKey = process.env.AGENT_INTERNAL_KEY;
  const receivedKey = request.headers.get("x-agent-key");

  if (!receivedKey) {
    return {
      ok: false,
      status: 401,
      message: "Header x-agent-key ausente.",
    };
  }

  if (!expectedKey || receivedKey !== expectedKey) {
    return {
      ok: false,
      status: 403,
      message: "Header x-agent-key inválido.",
    };
  }

  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const auth = authorize(request);

    if (!auth.ok) {
      return NextResponse.json(
        {
          status: "blocked",
          requestSummary: "Acesso não autorizado ao Supabase Inspect Agent.",
          normalizedScope: null,
          findings: [],
          inspectedObjects: [],
          warnings: [],
          limitations: [auth.message],
          nextSteps: ["Enviar o header x-agent-key válido na requisição."],
        },
        {
          status: auth.status,
          headers: {
            "Cache-Control": "no-store",
            "x-lpf-tool": SUPABASE_INSPECT_TOOL_NAME,
          },
        }
      );
    }

    const body = await request.json();
    const normalized = normalizeInspectReadonlyInput(body);

    if (!normalized.ok) {
      return NextResponse.json(normalized.error, {
        status: httpStatusFromToolStatus(normalized.error.status),
        headers: {
          "Cache-Control": "no-store",
          "x-lpf-tool": SUPABASE_INSPECT_TOOL_NAME,
        },
      });
    }

    const result = await inspectReadonly(normalized.value);

    return NextResponse.json(result, {
      status: httpStatusFromToolStatus(result.status),
      headers: {
        "Cache-Control": "no-store",
        "x-lpf-tool": SUPABASE_INSPECT_TOOL_NAME,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido ao processar a rota.";

    return NextResponse.json(
      {
        status: "error",
        requestSummary: "Falha não tratada na rota do Supabase Inspect Agent.",
        normalizedScope: null,
        findings: [],
        inspectedObjects: [],
        warnings: [],
        limitations: [message],
        nextSteps: [
          "Validar payload e autorização da requisição.",
          "Revisar logs do servidor e tentar novamente.",
        ],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "x-lpf-tool": SUPABASE_INSPECT_TOOL_NAME,
        },
      }
    );
  }
}
