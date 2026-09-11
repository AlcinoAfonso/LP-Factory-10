import "server-only";

import { NextResponse } from "next/server";
import { listOpenAiWorkloadInventory } from "@/openai-workloads";
import {
  activeCostTrackingAdapter,
} from "@/openai-costs/adapters/activeCostTrackingAdapter";
import { openAiCostPersistenceFailure } from "@/openai-costs/adapters/activeCostTrackingAdapterCore";
import { validateOpenAiCostIngestion } from "@/openai-costs/ingestion";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request) {
  if (process.env.OPENAI_COST_INGESTION_ENABLED?.trim().toLowerCase() !== "true") {
    return NextResponse.json({ ok: false, code: "disabled" }, { status: 404 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ ok: false, code: "content_type" }, { status: 415 });
  }
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, code: "body_too_large" }, { status: 413 });
  }
  const secret = process.env.OPENAI_COST_INGESTION_HMAC_SECRET?.trim();
  const expectedEnvironment = process.env.OPENAI_COST_INGESTION_ENVIRONMENT?.trim();
  const inventory = listOpenAiWorkloadInventory().find((item) => item.id === "supabase_inspect");
  if (!secret || !expectedEnvironment || !inventory) {
    return NextResponse.json({ ok: false, code: "configuration_invalid" }, { status: 503 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, code: "body_too_large" }, { status: 413 });
  }
  const validated = validateOpenAiCostIngestion({
    body,
    timestamp: request.headers.get("x-openai-cost-timestamp") ?? "",
    signature: request.headers.get("x-openai-cost-signature") ?? "",
    protocol: request.headers.get("x-openai-cost-protocol") ?? "",
    secret,
    expectedEnvironment,
    inventory,
  });
  if (!validated.ok) {
    const status = validated.code === "signature_invalid" || validated.code === "request_expired" ? 401 : 400;
    return NextResponse.json({ ok: false, code: validated.code }, { status });
  }

  const { action, payload } = validated.value;
  try {
    await activeCostTrackingAdapter[action](payload as never);
  } catch (error) {
    const failure = openAiCostPersistenceFailure(error);
    return NextResponse.json({ ok: false, code: failure.code }, { status: failure.status });
  }
  return NextResponse.json({ ok: true });
}
