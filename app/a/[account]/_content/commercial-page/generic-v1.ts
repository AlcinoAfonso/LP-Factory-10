export type CommercialPlanKey = "starter" | "lite" | "pro" | "ultra";

export const genericCommercialPageContent = {
  variant: "generic-v1",
  supportEmail: "suporte@lpfactory.com.br",
  hero: {
    eyebrow: "Landing pages para vender com mais clareza",
    title: "Transforme sua oferta em uma página pronta para apresentar e converter.",
    description:
      "A LP Factory organiza conteúdo, design responsivo e publicação em uma entrega objetiva, para sua empresa validar a oferta sem montar uma estrutura complexa.",
    primaryCta: "Conhecer os planos",
    secondaryCta: "Falar com a equipe",
  },
  benefits: [
    {
      title: "Oferta fácil de entender",
      description:
        "Hierarquia visual e conteúdo organizados para o visitante reconhecer rapidamente o que você oferece e qual é o próximo passo.",
    },
    {
      title: "Experiência responsiva",
      description:
        "Layout preparado para leitura, comparação e ação em telas de celular e desktop.",
    },
    {
      title: "Entrega sem excesso de estrutura",
      description:
        "Escopo enxuto, publicação assistida e evolução baseada no que realmente precisa ser validado.",
    },
  ],
  services: [
    {
      title: "Estrutura da página",
      description:
        "Organização das seções, da proposta principal, dos benefícios e das chamadas para ação.",
    },
    {
      title: "Adaptação de conteúdo",
      description:
        "Ajustes de mensagem para deixar a oferta mais direta, legível e coerente com o objetivo da página.",
    },
    {
      title: "Design responsivo",
      description:
        "Composição visual preparada para funcionar com clareza em diferentes tamanhos de tela.",
    },
    {
      title: "Publicação e ajustes",
      description:
        "Apoio para colocar a página no ar e realizar os refinamentos previstos no plano escolhido.",
    },
  ],
  plans: [
    {
      key: "starter" as CommercialPlanKey,
      name: "Starter",
      price: "R$ 50",
      period: "/mês",
      description: "Para validar uma primeira página com escopo essencial.",
      features: ["1 landing page", "Layout responsivo", "CTA principal", "Publicação assistida"],
      cta: "Quero o Starter",
    },
    {
      key: "lite" as CommercialPlanKey,
      name: "Lite",
      price: "R$ 100",
      period: "/mês",
      description: "Para uma operação pequena que precisa de mais personalização.",
      features: [
        "Até 2 landing pages",
        "Personalização de marca",
        "Formulário ou WhatsApp",
        "Ajustes básicos",
      ],
      cta: "Quero o Lite",
    },
    {
      key: "pro" as CommercialPlanKey,
      name: "Pro",
      price: "R$ 200",
      period: "/mês",
      description: "Para testar ofertas com mais páginas e elementos de conversão.",
      features: [
        "Até 5 landing pages",
        "Adaptação de copy",
        "Seções de conversão",
        "Tracking essencial",
      ],
      cta: "Quero o Pro",
      highlighted: true,
    },
    {
      key: "ultra" as CommercialPlanKey,
      name: "Ultra",
      price: "R$ 300",
      period: "/mês",
      description: "Para uma operação com maior volume e ciclo contínuo de ajustes.",
      features: [
        "Até 10 landing pages",
        "Prioridade de atendimento",
        "Revisões periódicas",
        "Otimização orientada por dados",
      ],
      cta: "Quero o Ultra",
    },
  ],
  disclaimer:
    "Valores e serviços ilustrativos para validação visual. Não constituem oferta comercial definitiva.",
  differentiators: [
    {
      title: "Escopo objetivo",
      description: "A entrega começa pelo necessário para validar a página, sem antecipar complexidade.",
    },
    {
      title: "Clareza antes de volume",
      description: "A prioridade é tornar a oferta reconhecível e o próximo passo evidente.",
    },
    {
      title: "Evolução controlada",
      description: "Novas páginas e refinamentos entram conforme a necessidade real da operação.",
    },
  ],
  steps: [
    {
      title: "Escolha o ponto de partida",
      description: "Compare os planos ilustrativos e selecione o escopo mais próximo da sua necessidade.",
    },
    {
      title: "Alinhe a oferta",
      description: "A equipe organiza objetivo, conteúdo, CTA e referências necessárias para a página.",
    },
    {
      title: "Receba a página",
      description: "A entrega reúne estrutura, conteúdo e design responsivo em uma experiência única.",
    },
    {
      title: "Valide e refine",
      description: "A página é revisada no uso real antes de qualquer expansão de escopo.",
    },
  ],
  faq: [
    {
      question: "O que é entregue em uma landing page?",
      answer:
        "Uma página focada em uma oferta e em um próximo passo claro, com estrutura, conteúdo, design responsivo e CTA conforme o escopo do plano.",
    },
    {
      question: "A página funciona no celular?",
      answer:
        "Sim. A primeira entrega considera responsividade, legibilidade, navegação por teclado e ausência de cortes ou sobreposições.",
    },
    {
      question: "Posso usar formulário ou WhatsApp?",
      answer:
        "O plano Lite prevê formulário ou WhatsApp como opção ilustrativa. A configuração final depende do escopo aprovado para a entrega real.",
    },
    {
      question: "Os preços desta página já são definitivos?",
      answer:
        "Não. Os valores e serviços apresentados servem para validação visual e não constituem oferta comercial definitiva.",
    },
    {
      question: "É possível começar com uma página e ampliar depois?",
      answer:
        "Sim. A proposta é iniciar com o escopo necessário e evoluir somente quando houver uma necessidade real de novas páginas ou ajustes.",
    },
  ],
  finalCta: {
    title: "Pronto para transformar sua oferta em uma página mais clara?",
    description:
      "Converse com a equipe da LP Factory para avaliar o melhor ponto de partida para sua operação.",
    label: "Falar com a equipe",
  },
} as const;
