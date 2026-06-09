import type {
  CommercialResearch,
  CommercialTemplateDefinition,
} from "../contracts";

export const ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_TEMPLATE = {
  key: "account_dashboard.commercial_page",
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
