"use server";

// D14F: QA temporário exclusivamente no Preview e para a conta fictícia autorizada.
import { requirePlatformAdmin } from "@/lib/access/guards";
import { createServiceClient } from "@/lib/supabase/service";
import { projectCommunicationBase } from "@/communication-base/policy";
import { selectStageTwoInput } from "@/communication-base/ai-core";
import {
  runAgentBaseMarketResearchExperiment,
  runAgentBaseTwoSectionsExperiment,
} from "@/communication-base/agent-base/experiment";
import { readOfficialNicheContext } from "@/onboarding/niche-resolution/adapters/accountOfficialNicheAdapter";

const QA_ACCOUNT_ID = "441628b4-fbb1-4351-8436-c7d3b1013af0";
const QA_INTERNAL_NAME = "QA E10.12 Comercial Preview Corretor 20261014";
const QA_PUBLIC_NAME = "João Imóveis QA";

export type AgentBaseQaState = Readonly<{
  status: "idle" | "success" | "error";
  message: string;
  mode: "research" | "sections" | null;
  report: string;
  audience: string;
  marketInsights: readonly string[];
  sources: readonly Readonly<{ title: string | null; url: string }>[];
  model: string | null;
  effort: string | null;
  latencyMs: number | null;
  totalTokens: number | null;
  webCalls: number | null;
}>;

const AGENT_BASE_QA_INITIAL_STATE: AgentBaseQaState = {
  status: "idle", message: "", mode: null, report: "", audience: "", marketInsights: [], sources: [],
  model: null, effort: null, latencyMs: null, totalTokens: null, webCalls: null,
};

function fail(message: string): AgentBaseQaState {
  return { ...AGENT_BASE_QA_INITIAL_STATE, status: "error", message };
}

export async function runAgentBaseQaAction(
  _previous: AgentBaseQaState,
  _formData: FormData,
): Promise<AgentBaseQaState> {
  if (process.env.VERCEL_ENV !== "preview") {
    return fail("Esta execução experimental só está disponível no Preview.");
  }
  const access = await requirePlatformAdmin();
  if (!access.allowed) return fail("Acesso administrativo não autorizado.");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) return fail("A chave OpenAI do Preview está indisponível.");
  // Apenas os dois modos de QA aprovados. Nenhum campo do cliente escolhe conta/modelo.
  const mode = _formData.get("intent");
  if (mode !== "research" && mode !== "sections") return fail("Modo de pesquisa inválido.");

  try {
    const service = createServiceClient();
    // Allowlist fixa: não receber account_id, nomes ou dados arbitrários do navegador.
    const { data: account, error: accountError } = await service.from("accounts")
      .select("name,status").eq("id", QA_ACCOUNT_ID).maybeSingle();
    if (accountError || !account || account.name !== QA_INTERNAL_NAME ||
        account.status !== "active") return fail("A conta QA não corresponde ao cenário autorizado.");

    const { data: row, error: readError } = await service.from("account_communication_bases")
      .select("account_id,sections_json,version,created_at,updated_at")
      .eq("account_id", QA_ACCOUNT_ID).maybeSingle();
    if (readError || !row) return fail("Não foi possível ler a Base QA.");
    const base = projectCommunicationBase(row);
    const selection = base ? selectStageTwoInput(base, { kind: "general" }) : null;
    if (!base || !selection || Object.keys(selection.confirmed).length === 0) {
      return fail("Não há dados confirmados e válidos para a pesquisa.");
    }

    const confirmedBusinessData: Record<string, string> = {};
    for (const [key, entry] of Object.entries(selection.confirmed)) {
      // Preserva também fatos estruturados como dados, sem interpretar sua origem como instrução.
      confirmedBusinessData[key] = typeof entry === "string" ? entry : JSON.stringify(entry);
    }
    if (confirmedBusinessData.business_name !== QA_PUBLIC_NAME) {
      return fail("O nome público confirmado não corresponde à conta QA.");
    }
    const nicheRead = await readOfficialNicheContext({ accountId: QA_ACCOUNT_ID });
    if (!nicheRead.ok || !nicheRead.niche?.confirmed) {
      return fail("O nicho oficial da conta QA não está confirmado.");
    }
    const initialNicheRevision = nicheRead.niche.revision;

    const experimentalInput = {
      accountId: QA_ACCOUNT_ID,
      apiKey,
      environment: "preview" as const,
      context: {
        businessName: QA_PUBLIC_NAME,
        officialNiche: nicheRead.niche.name,
        confirmedBusinessData,
        fictionalTestScenario: true,
      },
    };
    const result = mode === "sections"
      ? await runAgentBaseTwoSectionsExperiment(experimentalInput)
      : await runAgentBaseMarketResearchExperiment(experimentalInput);
    if (!result.ok) {
      return fail("A execução real não foi concluída. Verifique os eventos sanitizados da OpenAI antes de tentar novamente.");
    }

    // O resultado não é utilizável se os dados confirmados mudaram durante a pesquisa.
    const { data: latest, error: latestError } = await service.from("account_communication_bases")
      .select("version").eq("account_id", QA_ACCOUNT_ID).maybeSingle();
    const currentNiche = await readOfficialNicheContext({ accountId: QA_ACCOUNT_ID });
    if (latestError || !latest || latest.version !== base.version ||
        !currentNiche.ok || currentNiche.niche?.revision !== initialNicheRevision) {
      return fail("A Base ou o nicho mudou durante a pesquisa. O resultado foi descartado.");
    }

    const common = {
      status: "success" as const,
      message: mode === "sections"
        ? "Seções 3.2 e 3.3 produzidas para revisão humana. Nada foi gravado na Base."
        : "Pesquisa real concluída com fontes verificáveis. Nada foi gravado na Base.",
      sources: result.value.sources,
      model: result.model,
      effort: result.reasoningEffort,
      latencyMs: result.latencyMs,
      totalTokens: result.usage.totalTokens,
      webCalls: result.value.webSearchCallCount,
    };
    if ("sections" in result.value) {
      return {
        ...common,
        mode: "sections",
        report: "",
        audience: result.value.sections.audience,
        marketInsights: result.value.sections.market_insights,
      };
    }
    return {
      ...common,
      mode: "research",
      report: result.value.text,
      audience: "",
      marketInsights: [],
    };
  } catch {
    return fail("Não foi possível concluir o teste. Nenhuma alteração foi realizada na Base.");
  }
}
