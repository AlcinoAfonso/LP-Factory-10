import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogRegistry,
  LandingPageInputCatalogTaxonIdentity,
  LandingPageInputEvidence,
  LandingPageInputFieldDefinition,
  LandingPageInputValidation,
} from "./contracts";

const allPlans = ["starter", "lite", "pro", "ultra"] as const;

export const realEstateSegmentTaxon = taxon({
  id: "f9ba36cd-fcd9-478b-9823-c2f003cf037a",
  name: "Imobiliário",
  slug: "imobiliario",
  level: "segment",
  isActive: true,
  parentId: null,
});

export const realEstateBrokerNicheTaxon = taxon({
  id: "c7952d16-678c-4615-9483-a003e57d94aa",
  name: "Corretor Imóveis",
  slug: "corretor-imoveis",
  level: "niche",
  isActive: true,
  parentId: realEstateSegmentTaxon.id,
});

export const mediumStandardRealEstateBrokerTaxon = taxon({
  id: "a8e986cc-070f-4ab4-9857-e6b1ce9fdb75",
  name: "Corretor de imóveis de médio padrão",
  slug: "corretor-de-imoveis-de-medio-padrao",
  level: "ultra_niche",
  isActive: true,
  parentId: realEstateBrokerNicheTaxon.id,
});

const conversionChannelCondition = (value: string) => ({
  fieldKey: "primary_conversion_channel",
  operator: "equals" as const,
  value,
});

export const landingPageInputCatalogRegistry = deepFreeze({
  1: {
    version: 1,
    universal: {
      level: "universal",
      entries: [
        field({
          fieldKey: "business_display_name",
          purpose: "Identificar factual e publicamente o negócio ou profissional atendido.",
          valueType: "string",
          valueScope: "business",
          expectedValueOrigin: "business_provided",
          obligation: "required",
          validation: { kind: "type_only" },
          evidence: evidence("Toda landing page precisa identificar o negócio ou profissional atendido.", "decision:lp-planning", "technical:current-contracts"),
        }),
        field({
          fieldKey: "funnel_stage",
          purpose: "Informar a intenção de funil da landing page sem confundi-la com o canal.",
          valueType: "enum",
          valueScope: "landing_page",
          expectedValueOrigin: "landing_page_provided",
          obligation: "required",
          validation: { kind: "enum", allowedValues: ["bofu", "mofu", "tofu"] },
          evidence: evidence("O planejamento separa BOFU, MOFU e TOFU do canal landing_page.", "decision:lp-planning"),
        }),
        field({
          fieldKey: "traffic_source",
          purpose: "Identificar a origem de tráfego separadamente da intenção da landing page.",
          valueType: "enum",
          valueScope: "campaign",
          expectedValueOrigin: "campaign_provided",
          obligation: "optional",
          validation: { kind: "enum", allowedValues: ["paid_search", "paid_social", "organic", "whatsapp", "qr_code", "other"] },
          evidence: evidence("O planejamento separa origem de tráfego da intenção da landing page.", "decision:lp-planning"),
        }),
        field({
          fieldKey: "primary_conversion_channel",
          purpose: "Selecionar o destino operacional principal de conversão da landing page.",
          valueType: "enum",
          valueScope: "landing_page",
          expectedValueOrigin: "landing_page_provided",
          obligation: "required",
          validation: { kind: "enum", allowedValues: ["whatsapp", "form", "phone", "email", "external_url"] },
          evidence: evidence("Pesquisa, piloto e decisão humana confirmam os destinos operacionais explícitos.", "empirical:real-estate-research", "context:real-estate-pilot", "decision:e20-2-human"),
        }),
        field({
          fieldKey: "whatsapp_destination",
          purpose: "Fornecer o destino E.164 quando WhatsApp for o canal principal.",
          valueType: "phone",
          valueScope: "landing_page",
          expectedValueOrigin: "landing_page_provided",
          obligation: "conditional",
          requiredWhen: conversionChannelCondition("whatsapp"),
          applicableWhen: conversionChannelCondition("whatsapp"),
          validation: { kind: "e164" },
          evidence: evidence("WhatsApp é CTA recorrente na pesquisa e canal real do piloto.", "empirical:real-estate-research", "context:real-estate-pilot"),
        }),
        field({
          fieldKey: "phone_destination",
          purpose: "Fornecer o telefone E.164 quando telefone for o canal principal.",
          valueType: "phone",
          valueScope: "landing_page",
          expectedValueOrigin: "landing_page_provided",
          obligation: "conditional",
          requiredWhen: conversionChannelCondition("phone"),
          applicableWhen: conversionChannelCondition("phone"),
          validation: { kind: "e164" },
          evidence: evidence("O telefone foi mantido como destino operacional explícito.", "decision:e20-2-human"),
        }),
        field({
          fieldKey: "email_destination",
          purpose: "Fornecer um e-mail único quando e-mail for o canal principal.",
          valueType: "email",
          valueScope: "landing_page",
          expectedValueOrigin: "landing_page_provided",
          obligation: "conditional",
          requiredWhen: conversionChannelCondition("email"),
          applicableWhen: conversionChannelCondition("email"),
          validation: { kind: "email" },
          evidence: evidence("E-mail é canal previsto no produto e no piloto.", "technical:current-contracts", "context:real-estate-pilot"),
        }),
        field({
          fieldKey: "external_url_destination",
          purpose: "Fornecer URL HTTPS quando URL externa for o canal principal.",
          valueType: "url",
          valueScope: "landing_page",
          expectedValueOrigin: "landing_page_provided",
          obligation: "conditional",
          requiredWhen: conversionChannelCondition("external_url"),
          applicableWhen: conversionChannelCondition("external_url"),
          validation: { kind: "https_url" },
          evidence: evidence("URL externa foi mantida como destino operacional explícito.", "decision:e20-2-human"),
        }),
        field({
          fieldKey: "privacy_policy_url",
          purpose: "Fornecer a política de privacidade HTTPS quando formulário for o canal principal.",
          valueType: "url",
          valueScope: "business",
          expectedValueOrigin: "business_provided",
          obligation: "conditional",
          requiredWhen: conversionChannelCondition("form"),
          applicableWhen: conversionChannelCondition("form"),
          validation: { kind: "https_url" },
          evidence: evidence("A pesquisa exige política e consentimento quando existe formulário.", "empirical:real-estate-research"),
        }),
        field({
          fieldKey: "paid_search_keyword_map",
          purpose: "Alinhar cluster de busca, contexto do anúncio e âncora factual sem produzir copy.",
          valueType: "keyword_map",
          valueScope: "campaign",
          expectedValueOrigin: "campaign_provided",
          obligation: "optional",
          applicableWhen: { fieldKey: "traffic_source", operator: "equals", value: "paid_search" },
          validation: { kind: "keyword_map" },
          evidence: evidence("O planejamento autoriza message match opcional e a pesquisa confirma busca por localização, tipologia e intenção.", "decision:lp-planning", "empirical:real-estate-research"),
        }),
      ],
    },
    taxonLayers: {
      [realEstateSegmentTaxon.slug]: {
        level: "segment",
        taxon: realEstateSegmentTaxon,
        entries: [
          field({
            fieldKey: "service_locations",
            purpose: "Declarar cidades, bairros ou regiões reais de atendimento.",
            originTaxon: realEstateSegmentTaxon,
            valueType: "string_list",
            valueScope: "business",
            expectedValueOrigin: "business_provided",
            obligation: "required",
            validation: { kind: "string_list" },
            evidence: evidence("A descoberta imobiliária e o piloto são orientados por localização e região.", "empirical:real-estate-research", "context:real-estate-pilot"),
          }),
          field({
            fieldKey: "property_types",
            purpose: "Declarar as tipologias reais abrangidas pela oferta.",
            originTaxon: realEstateSegmentTaxon,
            valueType: "string_list",
            valueScope: "offer",
            expectedValueOrigin: "offer_provided",
            obligation: "optional",
            validation: { kind: "string_list" },
            evidence: evidence("Portais e pesquisa estruturam descoberta por tipologia, dependente da oferta real.", "empirical:real-estate-research"),
          }),
          field({
            fieldKey: "property_price_range",
            purpose: "Declarar a faixa real de preço da oferta em BRL.",
            originTaxon: realEstateSegmentTaxon,
            valueType: "number_range",
            valueScope: "offer",
            expectedValueOrigin: "offer_provided",
            obligation: "optional",
            validation: { kind: "number_range", currency: "BRL", minimum: 0 },
            evidence: evidence("Preço e capacidade financeira são filtros e insumos recorrentes.", "empirical:real-estate-research", "context:real-estate-pilot"),
          }),
          field({
            fieldKey: "property_stage",
            purpose: "Declarar o estágio real dos imóveis abrangidos pela oferta.",
            originTaxon: realEstateSegmentTaxon,
            valueType: "enum",
            valueScope: "offer",
            expectedValueOrigin: "offer_provided",
            obligation: "optional",
            validation: { kind: "enum", allowedValues: ["launch", "under_construction", "ready", "used", "mixed"] },
            evidence: evidence("Pesquisa e piloto distinguem lançamentos, construção, prontos e usados.", "empirical:real-estate-research", "context:real-estate-pilot"),
          }),
        ],
      },
      [realEstateBrokerNicheTaxon.slug]: {
        level: "niche",
        taxon: realEstateBrokerNicheTaxon,
        entries: [
          field({
            fieldKey: "transaction_intent",
            purpose: "Declarar a intenção comercial específica da landing page do corretor.",
            originTaxon: realEstateBrokerNicheTaxon,
            valueType: "enum",
            valueScope: "landing_page",
            expectedValueOrigin: "landing_page_provided",
            obligation: "required",
            validation: { kind: "enum", allowedValues: ["buy", "sell", "valuation", "mixed"] },
            evidence: evidence("A pesquisa diferencia compra, venda, avaliação e fluxo híbrido.", "empirical:real-estate-research"),
          }),
          field({
            fieldKey: "financing_support_available",
            purpose: "Informar se o corretor oferece apoio em financiamento.",
            originTaxon: realEstateBrokerNicheTaxon,
            valueType: "boolean",
            valueScope: "business",
            expectedValueOrigin: "business_provided",
            obligation: "optional",
            validation: { kind: "type_only" },
            evidence: evidence("Financiamento é apoio possível do corretor, não propriedade universal do segmento.", "empirical:real-estate-research", "context:real-estate-pilot"),
          }),
          field({
            fieldKey: "document_support_available",
            purpose: "Informar se o corretor oferece orientação documental.",
            originTaxon: realEstateBrokerNicheTaxon,
            valueType: "boolean",
            valueScope: "business",
            expectedValueOrigin: "business_provided",
            obligation: "optional",
            validation: { kind: "type_only" },
            evidence: evidence("Orientação documental é apoio possível do corretor.", "empirical:real-estate-research", "context:real-estate-pilot"),
          }),
          field({
            fieldKey: "creci_registration",
            purpose: "Declarar a credencial CRECI a ser confirmada por fonte oficial antes do uso como prova.",
            originTaxon: realEstateBrokerNicheTaxon,
            valueType: "string",
            valueScope: "business",
            expectedValueOrigin: "business_provided",
            obligation: "required",
            validation: { kind: "type_only" },
            evidence: evidence("CRECI é credencial verificável e o piloto trata atuação profissional.", "empirical:real-estate-research", "context:real-estate-pilot"),
          }),
          field({
            fieldKey: "attendance_modes",
            purpose: "Declarar modos reais de atendimento do corretor.",
            originTaxon: realEstateBrokerNicheTaxon,
            valueType: "string_list",
            valueScope: "business",
            expectedValueOrigin: "business_provided",
            obligation: "optional",
            validation: { kind: "string_list", allowedValues: ["in_person", "remote"] },
            evidence: evidence("O processo comercial pode combinar atendimento presencial e remoto.", "empirical:real-estate-research", "context:real-estate-pilot"),
          }),
        ],
      },
    },
  },
} satisfies LandingPageInputCatalogRegistry);

function field(
  input: Omit<LandingPageInputFieldDefinition, "kind" | "originLayer" | "allowedPlans" | "snapshotPolicy" | "createdInVersion"> & {
    originTaxon?: LandingPageInputCatalogTaxonIdentity;
    allowedPlans?: readonly LandingPageInputCatalogPlan[];
    validation: LandingPageInputValidation;
  },
): LandingPageInputFieldDefinition {
  return {
    kind: "field",
    ...input,
    originLayer: input.originTaxon?.level ?? "universal",
    allowedPlans: input.allowedPlans ?? allPlans,
    snapshotPolicy: "include_if_used",
    createdInVersion: 1,
  };
}

function evidence(
  summary: string,
  ...references: LandingPageInputEvidence["references"]
): LandingPageInputEvidence {
  return { summary, references };
}

function taxon<T extends LandingPageInputCatalogTaxonIdentity>(value: T): T {
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const property of Object.getOwnPropertyNames(value)) {
      const nested = value[property as keyof T];
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value;
}
