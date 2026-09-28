import "server-only";

import { createHash } from "node:crypto";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { generateCommunicationIntelligence } from "@/communication-base/adapters/communicationAiAdapter";
import {
  COMMUNICATION_AI_CONTRACT_VERSION,
  COMMUNICATION_AI_PROMPT_VERSION,
  stageTwoPrompt,
  type StageTwoTarget,
} from "@/communication-base/ai-core";
import type { CommunicationBase, CommunicationSection } from "@/communication-base/contracts";
import {
  calculateOpenAiOperationCost,
  lpFactoryOpenAiCostContext,
  type OpenAiCostExecutionContext,
  type OpenAiCostExecutionTerminal,
  type OpenAiCostOperationContext,
  type OpenAiCostOperationTerminal,
  type OpenAiCostRecorder,
} from "@/openai-costs";
import {
  resolveOpenAiProductWorkload,
  type OpenAiWorkloadEvent,
} from "@/openai-workloads";
import { readOpenAiModelCatalog } from "@/openai-workloads/adapters/modelCatalogAdapter";
import { isOpenAiModelCatalogConfigurationAvailable } from "@/openai-workloads/adapters/modelCatalogAdapterCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const accountId = "10000000-0000-4000-8000-000000000001";
const timestamp = "2026-09-27T00:00:00.000Z";
const candidates = {
  luna: { model: "gpt-6-luna", reasoningEffort: "max" },
  sol: { model: "gpt-6-sol", reasoningEffort: "medium" },
} as const;
type Candidate = keyof typeof candidates;
const confirmedSections: CommunicationBase["sections"] = {
  business_name: section("text", "Jardim Vivo", "user_confirmed"),
  business_context: section("text", "Empresa fictícia de manutenção de jardins para condomínios residenciais em Recife.", "user_confirmed"),
  offers: section("items", ["Manutenção periódica de jardins", "Poda e limpeza de áreas verdes"], "user_confirmed"),
  service: section("text", "O contato inicial ocorre por formulário; uma visita técnica antecede a proposta.", "user_confirmed"),
  preferences: section("text", "Evitar promessas de economia garantida e credenciais não comprovadas.", "user_confirmed"),
};
const existingSections: CommunicationBase["sections"] = {
  about: section("text", "A Jardim Vivo mantém jardins de condomínios residenciais em Recife.", "user_reviewed"),
  audience: section("text", "Hipótese: síndicos que organizam a manutenção das áreas comuns.", "user_reviewed"),
  market_insights: section("items", ["Hipótese: previsibilidade da manutenção pode ser uma preocupação."], "user_reviewed"),
  value_proposition: section("text", "Hipótese: facilitar o planejamento do cuidado das áreas verdes.", "user_reviewed"),
  benefits: section("items", ["Hipótese: rotina mais clara de manutenção."], "user_reviewed"),
  differentiators: section("items", ["Hipótese a validar: comunicação clara antes da proposta."], "user_reviewed"),
  faq: section("faq", [{ question: "Como pedir uma proposta?", answer: "O contato inicial ocorre por formulário." }], "user_reviewed"),
};
const cases: Readonly<Record<string, Readonly<{
  label: string;
  base: CommunicationBase;
  target: StageTwoTarget;
  requiresCurrentResearch: boolean;
}>>> = {
  general_initial: { label: "Gerar inteligência sem rascunho", base: base({}), target: { kind: "general" }, requiresCurrentResearch: false },
  general_update: { label: "Atualizar inteligência com rascunho", base: base(existingSections), target: { kind: "general" }, requiresCurrentResearch: false },
  local_about: { label: "Revisar Quem somos", base: base(existingSections), target: { kind: "section", key: "about" }, requiresCurrentResearch: false },
  local_market_web: { label: "Revisar contexto de mercado com Web Search", base: base(existingSections), target: { kind: "section", key: "market_insights" }, requiresCurrentResearch: true },
};

function section(format: CommunicationSection["format"], value: CommunicationSection["value"], origin: CommunicationSection["origin"]): CommunicationSection {
  return { format, value, origin };
}

function base(stageTwo: CommunicationBase["sections"]): CommunicationBase {
  return { accountId, version: 1, sections: { ...confirmedSections, ...stageTwo }, createdAt: timestamp, updatedAt: timestamp };
}

async function allowed() {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "codex-app/e25-1-base-comunicacao") return false;
  return (await requirePlatformAdmin()).allowed;
}

export async function GET() {
  if (!(await allowed())) return new Response("Indisponível", { status: 404 });
  const forms = (Object.keys(candidates) as Candidate[]).map((candidate) =>
    Object.entries(cases).map(([id, testCase]) =>
      `<form method="post" target="qa_result"><input type="hidden" name="candidate" value="${candidate}"><input type="hidden" name="case" value="${id}"><button type="submit">${candidate.toUpperCase()} · ${testCase.label}</button></form>`,
    ).join("\n"),
  ).join("\n");
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>QA E25.1 isolada</title><main><h1>QA E25.1 isolada</h1><p>Uma operação por envio. Execute Luna antes de Sol. Sem promoção nem persistência da resposta.</p>${forms}<iframe name="qa_result" title="Resultado da operação" style="width:100%;height:70vh"></iframe></main></html>`, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!(await allowed())) return new Response("Indisponível", { status: 404 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "origin_mismatch" }, { status: 403 });
  }
  const form = await request.formData();
  const candidateId = form.get("candidate");
  const caseId = form.get("case");
  if (typeof candidateId !== "string" || !Object.hasOwn(candidates, candidateId) ||
      typeof caseId !== "string" || !Object.hasOwn(cases, caseId)) {
    return Response.json({ error: "invalid_case" }, { status: 400 });
  }
  const candidate = candidates[candidateId as Candidate];
  const testCase = cases[caseId];
  const catalog = await readOpenAiModelCatalog();
  if (!catalog.ok || !isOpenAiModelCatalogConfigurationAvailable(catalog.value, {
    apiKind: "responses_text", model: candidate.model, reasoningEffort: candidate.reasoningEffort, quality: null,
  })) return Response.json({ error: "catalog_pair_unavailable" }, { status: 409 });
  const catalogModel = catalog.value.find((item) => item.apiKind === "responses_text" && item.model === candidate.model)!;
  const catalogParameter = catalogModel.parameters.find((item) =>
    item.kind === "reasoning_effort" && item.value === candidate.reasoningEffort)!;
  const resolved = await resolveOpenAiProductWorkload("communication_base_stage2_intelligence", "development");
  if (!resolved.ok || !process.env.OPENAI_API_KEY) {
    return Response.json({ error: "server_configuration_unavailable" }, { status: 503 });
  }
  const configuration = { ...resolved.value, ...candidate };
  const prompt = stageTwoPrompt(testCase.base, testCase.target, testCase.requiresCurrentResearch);
  if (!prompt) return Response.json({ error: "fixture_invalid" }, { status: 500 });
  const promptHash = createHash("sha256").update(JSON.stringify(prompt)).digest("hex");

  let execution: OpenAiCostExecutionContext | null = null;
  let operation: OpenAiCostOperationContext | null = null;
  let operationTerminal: OpenAiCostOperationTerminal | null = null;
  let executionTerminal: OpenAiCostExecutionTerminal | null = null;
  let event: OpenAiWorkloadEvent | null = null;
  const recorder: OpenAiCostRecorder = {
    async startExecution(input) { execution = input; },
    async startOperation(input) { operation = input; },
    async finishOperation(input) { operationTerminal = input; },
    async finishExecution(input) { executionTerminal = input; },
  };
  const result = await generateCommunicationIntelligence({
    accountId, base: testCase.base, target: testCase.target,
    requiresCurrentResearch: testCase.requiresCurrentResearch,
    apiKey: process.env.OPENAI_API_KEY, configurationOverride: configuration,
    financialContext: lpFactoryOpenAiCostContext, executionOrigin: "administrative_proof",
    emitEvent: (value) => { event = value; },
    costRecorder: recorder,
  });
  const terminal = operationTerminal as OpenAiCostOperationTerminal | null;
  const started = operation as OpenAiCostOperationContext | null;
  const cost = terminal && started ? calculateOpenAiOperationCost({
    model: candidate.model, startedAt: started.startedAt, usage: terminal.usage,
    webSearchCallCount: terminal.webSearchCallCount, webSearchRequested: terminal.webSearchRequested,
  }) : null;
  return Response.json({
    caseId, candidateId, workload: "communication_base_stage2_intelligence",
    isolatedProof: true, hostedLedgerWritten: false,
    configuration: {
      model: candidate.model, reasoningEffort: candidate.reasoningEffort, processing: "standard",
      webSearchPolicy: configuration.webSearch, catalogModelVersion: catalogModel.version,
      catalogParameterVersion: catalogParameter.version,
    },
    promptVersion: COMMUNICATION_AI_PROMPT_VERSION,
    contractVersion: COMMUNICATION_AI_CONTRACT_VERSION,
    promptHash,
    target: testCase.target, requiresCurrentResearch: testCase.requiresCurrentResearch,
    execution: execution && executionTerminal ? {
      startedAt: (execution as OpenAiCostExecutionContext).startedAt,
      result: (executionTerminal as OpenAiCostExecutionTerminal).result,
    } : null,
    providerResponseId: terminal?.providerResponseId ?? null,
    result: result.ok ? result.value : { error: result.reason },
    latencyMs: result.ok ? result.latencyMs : null,
    usage: terminal?.usage ?? null,
    webSearchCallCount: terminal?.webSearchCallCount ?? null,
    webSearchRequested: terminal?.webSearchRequested ?? null,
    telemetry: event, cost,
  }, { status: result.ok ? 200 : 502, headers: { "cache-control": "no-store" } });
}
