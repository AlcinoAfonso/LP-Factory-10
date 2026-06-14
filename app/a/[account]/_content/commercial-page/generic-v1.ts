export const GENERIC_COMMERCIAL_PAGE_VARIANT = "generic-v1" as const;

export type CommercialPlanKey = "starter" | "lite" | "pro" | "ultra";

export const genericCommercialPageContent = {
  variant: GENERIC_COMMERCIAL_PAGE_VARIANT,
  hero: {
    eyebrow: "Landing pages para apresentar e vender melhor",
    title: "Uma página clara, responsiva e pronta para conduzir o próximo contato.",
    description:
      "A LP Factory organiza conteúdo, design, chamada para ação e publicação em uma entrega simples para o seu negócio.",
    primaryCta: "Ver planos",
    secondaryCta: "Como funciona",
  },
  benefits: [
    {
      title: "Oferta fácil de entender",
      description:
        "Hierarquia de conteúdo pensada para deixar claro o que você oferece e qual é o próximo passo.",
    },
    {
      title: "Experiência responsiva",
      description:
        "Layout preparado para leitura e navegação em celular, tablet e desktop.",
    },
    {
      title: "Estrutura orientada ao contato",
      description:
        "Seções, benefícios e CTAs organizados para reduzir distrações ao longo da página.",
    },
  ],
  services: [
    "Organização da proposta e das seções",
    "Design e implementação responsiva",
    "Configuração do CTA principal",
    "Publicação e ajustes conforme o plano",
  ],
  plans: [
    {
      key: "starter" as CommercialPlanKey,
      name: "Starter",
      price: "R$ 50",
      period: "/mês",
      description: "Uma página essencial para começar.",
      features: [
        "1 landing page",
        "Layout responsivo",
        "CTA principal",
        "Publicação assistida",
      ],
      highlighted: false,
    },
    {
      key: "lite" as CommercialPlanKey,
      name: "Lite",
      price: "R$ 100",
      period: "/mês",
      description: "Mais flexibilidade para sua presença digital.",
      features: [
        "Até 2 landing pages",
        "Personalização de marca",
        "Formulário ou WhatsApp",
        "Ajustes básicos",
      ],
      highlighted: false,
    },
    {
      key: "pro" as CommercialPlanKey,
      name: "Pro",
      price: "R$ 200",
      period: "/mês",
      description: "Estrutura ampliada para campanhas e ofertas.",
      features: [
        "Até 5 landing pages",
        "Adaptação de copy",
        "Seções de conversão",
        "Tracking essencial",
      ],
      highlighted: true,
    },
    {
      key: "ultra" as CommercialPlanKey,
      name: "Ultra",
      price: "R$ 300",
      period: "/mês",
      description: "Maior capacidade e acompanhamento recorrente.",
      features: [
        "Até 10 landing pages",
        "Prioridade de atendimento",
        "Revisões periódicas",
        "Otimização orientada por dados",
      ],
      highlighted: false,
    },
  ],
  plansDisclaimer:
    "Valores e serviços ilustrativos para validação visual. Não constituem oferta comercial definitiva.",
  differentiators: [
    {
      title: "Escopo objetivo",
      description:
        "Cada plano deixa visível o que está incluído, sem acrescentar etapas desnecessárias ao MVP.",
    },
    {
      title: "Base pronta para evoluir",
      description:
        "A página nasce genérica e pode orientar futuras versões específicas por nicho.",
    },
    {
      title: "Entrega focada no essencial",
      description:
        "Conteúdo, responsividade, CTA e publicação são tratados como uma única experiência.",
    },
  ],
  process: [
    {
      step: "01",
      title: "Escolha o ponto de partida",
      description: "Compare os planos ilustrativos e identifique o volume necessário.",
    },
    {
      step: "02",
      title: "Alinhe a oferta",
      description: "A equipe organiza as informações essenciais da página e do CTA.",
    },
    {
      step: "03",
      title: "Valide a página",
      description: "Revise a experiência em desktop e mobile antes da publicação.",
    },
    {
      step: "04",
      title: "Publique e evolua",
      description: "A página entra no ar e recebe os ajustes previstos no plano.",
    },
  ],
  faq: [
    {
      question: "Os preços desta página já estão valendo?",
      answer:
        "Não. Os valores e serviços são ilustrativos e existem apenas para validar a apresentação visual desta primeira versão.",
    },
    {
      question: "A página funciona no celular?",
      answer:
        "A primeira entrega foi organizada para desktop e mobile, com leitura, comparação de planos e CTAs responsivos.",
    },
    {
      question: "Posso ter mais de uma landing page?",
      answer:
        "Os planos ilustrativos variam de uma a dez landing pages. O escopo comercial definitivo ainda será validado.",
    },
    {
      question: "O conteúdo será específico para meu nicho?",
      answer:
        "Esta versão é genérica. A personalização por nicho pertence a uma etapa futura e não faz parte desta entrega.",
    },
  ],
  finalCta: {
    title: "Vamos avaliar a primeira landing page do seu negócio?",
    description:
      "Envie uma mensagem para a equipe da LP Factory e informe qual plano ilustrativo mais se aproxima da sua necessidade.",
    label: "Falar com a LP Factory",
    href: "https://wa.me/5521979658483?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20landing%20page%20da%20LP%20Factory.",
  },
} as const;
