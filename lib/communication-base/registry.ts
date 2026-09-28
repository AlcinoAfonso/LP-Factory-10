export type CommunicationSectionFormat = "text" | "items" | "faq";
export type CommunicationSectionStage = 1 | 2;

export type CommunicationSectionDefinition = Readonly<{
  key: string;
  label: string;
  stage: CommunicationSectionStage;
  format: CommunicationSectionFormat;
  group: string;
}>;

export const communicationSections = [
  { key: "business_name", label: "Nome público", stage: 1, format: "text", group: "Negócio" },
  { key: "business_context", label: "Atuação", stage: 1, format: "text", group: "Negócio" },
  { key: "offers", label: "Ofertas", stage: 1, format: "items", group: "Ofertas" },
  { key: "service", label: "Atendimento, horários, contatos e agendamento", stage: 1, format: "text", group: "Atendimento" },
  { key: "proof", label: "Provas, credenciais e resultados", stage: 1, format: "items", group: "Provas" },
  { key: "materials", label: "Materiais e identidade", stage: 1, format: "items", group: "Materiais" },
  { key: "preferences", label: "Preferências e limites", stage: 1, format: "text", group: "Preferências" },
  { key: "about", label: "Quem somos", stage: 2, format: "text", group: "Inteligência" },
  { key: "audience", label: "Público e contexto", stage: 2, format: "text", group: "Inteligência" },
  { key: "market_insights", label: "Dores, desejos, crenças e objeções", stage: 2, format: "items", group: "Inteligência" },
  { key: "value_proposition", label: "Proposta de valor", stage: 2, format: "text", group: "Inteligência" },
  { key: "benefits", label: "Benefícios", stage: 2, format: "items", group: "Inteligência" },
  { key: "differentiators", label: "Diferenciais", stage: 2, format: "items", group: "Inteligência" },
  { key: "faq", label: "Perguntas frequentes", stage: 2, format: "faq", group: "Inteligência" },
] as const satisfies readonly CommunicationSectionDefinition[];

export type CommunicationSectionKey = (typeof communicationSections)[number]["key"];

export function getCommunicationSection(key: string): CommunicationSectionDefinition | null {
  return communicationSections.find((section) => section.key === key) ?? null;
}
