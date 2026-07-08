import type { LandingPageComposition } from "./contracts";
import type { LandingPageContentV1 } from "./schemas";

export const landingPageFixtureComposition: LandingPageComposition = {
  id: "99999999-9999-4999-8999-999999999999",
  items: [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab101",
      moduleKey: "hero",
      variantKey: "hero.lead_capture",
      sortOrder: 10,
      isRequired: true,
      config: { anchor_id: "inicio", spacing: "spacious" },
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab102",
      moduleKey: "benefits",
      variantKey: "benefits.cards",
      sortOrder: 20,
      isRequired: true,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab103",
      moduleKey: "offer",
      variantKey: "offer.summary",
      sortOrder: 30,
      isRequired: true,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab104",
      moduleKey: "social_proof",
      variantKey: "social_proof.simple",
      sortOrder: 40,
      isRequired: true,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab105",
      moduleKey: "how_it_works",
      variantKey: "how_it_works.steps",
      sortOrder: 50,
      isRequired: false,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab106",
      moduleKey: "faq",
      variantKey: "faq.accordion",
      sortOrder: 60,
      isRequired: false,
      config: { anchor_id: "duvidas", spacing: "compact" },
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab107",
      moduleKey: "final_cta",
      variantKey: "final_cta.simple",
      sortOrder: 70,
      isRequired: true,
      config: { anchor_id: "contato-final" },
    },
  ],
};

export const landingPageFixtureContent: LandingPageContentV1 = {
  schema_version: 1,
  channel: "landing_page",
  sections: [
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab101",
      content: {
        eyebrow: "Landing page de exemplo",
        title: "Uma oferta clara para um publico especifico.",
        description:
          "Fixture sintetica para validar contratos de landing_page sem criar registros de banco ou LP teste.",
        primary_cta: { label: "Quero conversar", href: "/contato" },
        secondary_cta: { label: "Ver como funciona", href: "/como-funciona" },
        lead_prompt: "Receba uma proposta inicial",
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab102",
      content: {
        eyebrow: "Beneficios",
        title: "Motivos objetivos para avancar",
        items: [
          {
            title: "Mensagem focada",
            description:
              "A pagina apresenta a promessa e os ganhos esperados sem depender de estrutura comercial fixa.",
          },
          {
            title: "Composicao controlada",
            description:
              "Cada secao usa modulo e variante conhecidos pelo registry de landing_page.",
          },
          {
            title: "Validacao executavel",
            description:
              "Conteudo invalido e barrado antes de chegar ao renderer minimo.",
          },
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab103",
      content: {
        eyebrow: "Oferta",
        title: "Resumo da entrega principal",
        description:
          "Use esta secao para explicar a oferta, servico ou produto sem exigir cards de planos.",
        bullets: [
          "Escopo inicial bem delimitado",
          "Proximo passo de contato claro",
          "Sem pricing obrigatorio no primeiro uso",
        ],
        cta: { label: "Entender a oferta", href: "/oferta" },
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab104",
      content: {
        eyebrow: "Confianca",
        title: "Sinais simples de seguranca",
        proof_items: [
          {
            title: "Evidencia controlada",
            description:
              "A prova social inicial e textual e nao depende de integracoes externas.",
          },
          {
            title: "Sem compatibilidade automatica",
            description:
              "Os modulos comerciais existentes continuam apenas como referencia comparativa.",
          },
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab105",
      content: {
        eyebrow: "Processo",
        title: "Como funciona",
        steps: [
          {
            label: "01",
            title: "Envio do contexto",
            description: "A pessoa interessada informa o objetivo da demanda.",
          },
          {
            label: "02",
            title: "Avaliacao inicial",
            description:
              "O time avalia fit, escopo e proximos passos possiveis.",
          },
          {
            label: "03",
            title: "Resposta objetiva",
            description:
              "A pagina conduz para uma conversa ou proposta sem automacao ampla.",
          },
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab106",
      content: {
        eyebrow: "Duvidas",
        title: "Perguntas frequentes",
        questions: [
          {
            question: "Esta fixture cria uma LP real?",
            answer:
              "Nao. Ela valida contrato tecnico local sem rota publica, banco ou publicacao.",
          },
          {
            question: "O renderer comercial e reutilizado?",
            answer:
              "Nao automaticamente. A compatibilidade precisa ser explicita por canal.",
          },
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab107",
      content: {
        title: "Pronto para o proximo passo",
        description:
          "O contrato minimo de landing_page pode ser evoluido nas fases seguintes com resolver e validacao de composicao.",
        cta: { label: "Continuar", href: "/contato" },
      },
    },
  ],
};
