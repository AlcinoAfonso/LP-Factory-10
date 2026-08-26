const LANDING_PAGE_INPUT_PRESENTATION_LABELS: Readonly<Record<string, string>> =
  Object.freeze({
    bofu: "Pronto para conversar ou comprar",
    mofu: "Comparando alternativas",
    tofu: "Conhecendo o tema",
    paid_search: "Busca paga",
    paid_social: "Redes sociais pagas",
    organic: "Busca ou conteúdo orgânico",
    whatsapp: "WhatsApp",
    qr_code: "QR code",
    other: "Outra origem",
    form: "Formulário",
    phone: "Telefone",
    email: "E-mail",
    external_url: "Link externo",
    contact: "Entrar em contato",
    schedule: "Agendar",
    request_quote: "Solicitar orçamento",
    purchase: "Comprar",
    register_interest: "Demonstrar interesse",
    launch: "Lançamento",
    under_construction: "Em construção",
    ready: "Pronto",
    used: "Usado",
    mixed: "Mais de um estágio",
    buy: "Compra",
    sell: "Venda",
    valuation: "Avaliação",
    rent: "Locação",
    in_person: "Presencial",
    remote: "Remoto",
  });

export function landingPageInputPresentationLabel(value: string) {
  return LANDING_PAGE_INPUT_PRESENTATION_LABELS[value];
}
