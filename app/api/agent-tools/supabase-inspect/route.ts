// app/api/agent-tools/supabase-inspect/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  SUPABASE_INSPECT_TOOL_NAME,
  inspectReadonly,
  normalizeInspectReadonlyInput,
} from "@/lib/supabase-inspect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  try {
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
      error instanceof Error ? error.message : "unknown_error";

    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: "supabase_inspect_route_unhandled",
        scope: "api",
        msg: message,
      })
    );

    return NextResponse.json(
      {
        status: "error",
        requestSummary: "Falha não tratada na rota do Supabase Inspect Agent.",
        normalizedScope: null,
        findings: [],
        inspectedObjects: [],
        warnings: [],
        limitations: [message],
        nextSteps: ["Revisar logs do servidor e tentar novamente."],
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
