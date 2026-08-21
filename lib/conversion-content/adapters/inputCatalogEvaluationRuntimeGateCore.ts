import type {
  OpenAiWorkloadEnvironment,
  ResolveOpenAiProductWorkloadResult,
  ResolvedOpenAiProductWorkload,
} from "../../openai-workloads/contracts";

export type InputCatalogEvaluationRuntimeReadiness =
  | Readonly<{
      ok: true;
      environment: OpenAiWorkloadEnvironment;
      configuration: ResolvedOpenAiProductWorkload;
    }>
  | Readonly<{ ok: false; code: "ROLLOUT_GATE_OFF" | "OPERATIONAL_CONFIGURATION_UNPROVEN"; message: string }>;

export async function resolveInputCatalogEvaluationRuntimeReadinessCore(
  input: Readonly<{
    environment: OpenAiWorkloadEnvironment;
    rolloutGateValue: string | undefined;
  }>,
  dependencies: Readonly<{
    resolveConfiguration: () => Promise<ResolveOpenAiProductWorkloadResult>;
  }>,
): Promise<InputCatalogEvaluationRuntimeReadiness> {
  if (input.rolloutGateValue !== "true") {
    return Object.freeze({
      ok: false,
      code: "ROLLOUT_GATE_OFF",
      message: "A avaliação OpenAI E20.6.5 permanece gate-off. Use o handoff Codex.",
    });
  }

  const resolved = await dependencies.resolveConfiguration();
  if (!resolved.ok) {
    return Object.freeze({
      ok: false,
      code: "OPERATIONAL_CONFIGURATION_UNPROVEN",
      message: "A configuração operacional autorizada da avaliação E20.6.5 não foi comprovada.",
    });
  }

  if (
    input.environment !== "development" &&
    (
      resolved.value.source !== "supabase_operational" ||
      !isOperationallyProvenRevision(resolved.value.revision)
    )
  ) {
    return Object.freeze({
      ok: false,
      code: "OPERATIONAL_CONFIGURATION_UNPROVEN",
      message: "Preview e Production exigem configuração ativa e comprovada pelo lifecycle Supabase.",
    });
  }

  return Object.freeze({
    ok: true,
    environment: input.environment,
    configuration: resolved.value,
  });
}

function isOperationallyProvenRevision(revision: string): boolean {
  return /^(?:[2-9]|[1-9][0-9]+)$/.test(revision);
}
