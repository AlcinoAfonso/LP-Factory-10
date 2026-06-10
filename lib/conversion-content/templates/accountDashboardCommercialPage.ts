import type {
  CommercialGeneratedContent,
  CommercialResearch,
  CommercialTemplateDefinition,
} from "../contracts";

export const ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_TEMPLATE = {
  key: "account_dashboard.commercial_page",
  version: 1,
  name: "Account Dashboard - Pagina comercial",
  channel: "account_dashboard",
  objective: "commercial_page",
  audienceScope: "business_buyer",
  outputFields: [
    "headline",
    "primary_promise",
    "context",
    "commercial_cards",
    "primary_cta",
    "secondary_cta",
    "proof_or_benefit_blocks",
    "missing_data_alerts",
  ],
} as const satisfies CommercialTemplateDefinition;

export const ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_FALLBACK_CONTENT = {
  headline: "Transforme sua comunicacao em uma entrega pronta para avancar",
  primaryPromise:
    "Organize sua mensagem comercial com clareza, foco e proximos passos objetivos.",
  context:
    "A LP Factory combina estrutura, orientacao comercial e execucao para ajudar sua empresa a apresentar melhor sua oferta.",
  commercialCards: [
    {
      key: "landing_page",
      title: "Landing page comercial",
      body: "Estruture uma pagina focada em apresentar sua oferta e conduzir o visitante para a proxima acao.",
    },
    {
      key: "commercial_guidance",
      title: "Orientacao de comunicacao",
      body: "Organize promessa, beneficios e chamadas para acao antes de publicar ou investir em trafego.",
    },
    {
      key: "first_delivery",
      title: "Primeira entrega",
      body: "Avance com um briefing objetivo para transformar sua necessidade em uma entrega comercial.",
    },
  ],
  primaryCta: {
    label: "Solicitar primeira entrega",
    supportingText: "Inicie o briefing da sua primeira comunicacao comercial.",
  },
  secondaryCta: {
    label: "Falar com atendimento",
    supportingText: "Tire duvidas antes de escolher o melhor proximo passo.",
  },
  proofOrBenefitBlocks: [
    {
      key: "clarity",
      title: "Mais clareza",
      body: "Uma estrutura objetiva reduz duvidas sobre o que comunicar e como apresentar a oferta.",
    },
    {
      key: "speed",
      title: "Mais velocidade",
      body: "Comece com uma base comercial pronta para ser adaptada, validada e evoluida.",
    },
  ],
  missingDataAlerts: ["generic_commercial_content_used"],
} satisfies CommercialGeneratedContent;

export const ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_GENERIC_RESEARCH = {
  strategic_core: [
    {
      key: "generic_positioning",
      text: "Apresente a LP Factory como apoio para transformar uma oferta em uma entrega comercial clara e pronta para avancar.",
      priority: 100,
      sortOrder: 10,
    },
    {
      key: "generic_primary_promise",
      text: "Destaque clareza, velocidade de preparacao e orientacao para conversao sem prometer resultados garantidos.",
      priority: 90,
      sortOrder: 20,
    },
  ],
  lp_overview: [
    {
      key: "generic_narrative",
      text: "Use narrativa direta, profissional e consultiva, com pouco jargao e foco no proximo passo comercial.",
      priority: 100,
      sortOrder: 10,
    },
  ],
  lp_sections: [
    {
      key: "generic_section_order",
      text: "Organize a pagina em promessa, contexto, opcoes comerciais, beneficios ou provas e chamadas para acao.",
      priority: 100,
      sortOrder: 10,
    },
  ],
  seo: [
    {
      key: "generic_seo_scope",
      text: "SEO nao e requisito da pagina interna; preserve apenas linguagem clara e termos compreensiveis para o comprador.",
      priority: 50,
      sortOrder: 10,
    },
  ],
} satisfies CommercialResearch;
