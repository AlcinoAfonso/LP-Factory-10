// QA manual e isolado: npx tsx scripts/agent-base-joao.qa.ts
// Exige OPENAI_API_KEY no ambiente; não lê nem altera dados de Production.
import { runAgentBaseMarketResearchExperiment } from "../lib/communication-base/agent-base/experiment";

async function main() {
  const result = await runAgentBaseMarketResearchExperiment({
    // Identidade da conta QA usada somente como contexto econômico sanitizado.
    accountId: "441628b4-fbb1-4351-8436-c7d3b1013af0",
    apiKey: process.env.OPENAI_API_KEY,
    // Fotografia fictícia e confirmada da Categoria 1 em 12/11/2026.
    context: {
      businessName: "João Imóveis QA",
      officialNiche: "Corretor Imóveis",
      fictionalTestScenario: true,
      confirmedBusinessData: {
        business_name: "João Imóveis QA",
        business_context: "Corretor de imóveis residenciais que atende famílias e proprietários na Tijuca, Vila Isabel e Grajaú, no Rio de Janeiro.",
        offers: "Cenário fictício de intermediação de compra e venda de apartamentos de dois ou três quartos e casas residenciais. Apresentação de opções, organização de visitas e acompanhamento da negociação.",
        service: "Cenário fictício: primeiro contato por mensagem e visitas agendadas. Horários e contatos específicos não informados.",
        preferences: "Comunicação clara e acolhedora, sem afirmar credenciais, resultados, avaliações, preços, garantias ou diferenciais sem confirmação.",
      },
    },
  });
  if (!result.ok) {
    console.error("Agente Base — pesquisa indisponível:", result.reason);
    process.exitCode = 1;
    return;
  }
  console.log("=== AGENTE BASE — RESULTADO DA PESQUISA ===");
  console.log(result.value.text);
  console.log("\n=== FONTES WEB CONSULTADAS ===");
  for (const source of result.value.sources) console.log(source.url);
  console.log("\n=== METADADOS DA EXECUÇÃO ===");
  console.log(JSON.stringify({
    responseId: result.responseId,
    latencyMs: result.latencyMs,
    usage: result.usage,
    sources: result.value.sources.length,
  }, null, 2));
}

main().catch(() => {
  console.error("Falha na execução isolada do Agente Base (detalhes internos omitidos).");
  process.exitCode = 1;
});
