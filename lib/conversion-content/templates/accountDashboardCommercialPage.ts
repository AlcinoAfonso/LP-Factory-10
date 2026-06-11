import type {
  CommercialGeneratedContent,
  CommercialResearch,
  CommercialTemplateDefinition,
} from "../contracts";

export const ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_TEMPLATE = {
  key: "account_dashboard.commercial_page",
  version: 1,
  name: "Account Dashboard - Página comercial",
  channel: "account_dashboard",
  objective: "commercial_page",
  audienceScope: "business_buyer",
  outputFields: [
    "headline",
    "primaryPromise",
    "context",
    "commercialCards",
    "primaryCta",
    "secondaryCta",
    "proofOrBenefitBlocks",
    "missingDataAlerts",
  ],
} as const satisfies CommercialTemplateDefinition;

export const ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_FALLBACK_CONTENT = {
  headline: "Transforme sua comunicação em uma entrega pronta para avançar",
  primaryPromise:
    "Organize sua mensagem comercial com clareza, foco e próximos passos objetivos.",
  context:
    "A LP Factory combina estrutura, orientação comercial e execução para ajudar sua empresa a apresentar melhor sua oferta.",
  commercialCards: [
    {
      key: "landing_page",
      title: "Landing page comercial",
      body: "Estruture uma página focada em apresentar sua oferta e conduzir o visitante para a próxima ação.",
    },
    {
      key: "commercial_guidance",
      title: "Orientação de comunicação",
      body: "Organize promessa, benefícios e chamadas para ação antes de publicar ou investir em tráfego.",
    },
    {
      key: "first_delivery",
      title: "Primeira entrega",
      body: "Avance com um briefing objetivo para transformar sua necessidade em uma entrega comercial.",
    },
  ],
  primaryCta: {
    label: "Solicitar primeira entrega",
    supportingText: "Inicie o briefing da sua primeira comunicação comercial.",
  },
  secondaryCta: {
    label: "Falar com atendimento",
    supportingText: "Tire dúvidas antes de escolher o melhor próximo passo.",
  },
  proofOrBenefitBlocks: [
    {
      key: "clarity",
      title: "Mais clareza",
      body: "Uma estrutura objetiva reduz dúvidas sobre o que comunicar e como apresentar a oferta.",
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
      text: "Apresente a LP Factory como apoio para transformar uma oferta em uma entrega comercial clara e pronta para avançar.",
      priority: 100,
      sortOrder: 10,
    },
    {
      key: "generic_primary_promise",
      text: "Destaque clareza, velocidade de preparação e orientação para conversão sem prometer resultados garantidos.",
      priority: 90,
      sortOrder: 20,
    },
  ],
  lp_overview: [
    {
      key: "generic_narrative",
      text: "Use narrativa direta, profissional e consultiva, com pouco jargão e foco no próximo passo comercial.",
      priority: 100,
      sortOrder: 10,
    },
  ],
  lp_sections: [
    {
      key: "generic_section_order",
      text: "Organize a página em promessa, contexto, opções comerciais, benefícios ou provas e chamadas para ação.",
      priority: 100,
      sortOrder: 10,
    },
  ],
  seo: [
    {
      key: "generic_seo_scope",
      text: "SEO não é requisito da página interna; preserve apenas linguagem clara e termos compreensíveis para o comprador.",
      priority: 50,
      sortOrder: 10,
    },
  ],
} satisfies CommercialResearch;
