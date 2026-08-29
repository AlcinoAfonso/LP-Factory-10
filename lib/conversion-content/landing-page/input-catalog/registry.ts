import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogRegistry,
  LandingPageInputCatalogRegistryEntry,
  LandingPageInputCatalogTaxonIdentity,
  LandingPageInputEvidence,
  LandingPageInputFieldDefinition,
  LandingPageInputTypeValidationContract,
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

const catalogV1: LandingPageInputCatalogRegistryEntry = {
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
};

const starterV2Fields: readonly LandingPageInputFieldDefinition[] = [
  field({
    fieldKey: "primary_service_or_offer",
    purpose: "Declarar o serviço ou a oferta principal que será apresentado na landing page Starter.",
    valueType: "string",
    valueScope: "offer",
    expectedValueOrigin: "offer_provided",
    obligation: "required",
    validation: { kind: "type_only" },
    landingPageSubstitutionPolicy: "forbidden",
    evidence: evidence("O refinamento humano da E20.2 exige um serviço ou uma oferta principal no Starter.", "decision:e20-2-human"),
    createdInVersion: 2,
  }),
  field({
    fieldKey: "primary_service_or_offer_description",
    purpose: "Registrar uma descrição factual curta do que o serviço ou a oferta principal realmente entrega.",
    valueType: "string",
    valueScope: "offer",
    expectedValueOrigin: "offer_provided",
    obligation: "required",
    validation: { kind: "type_only" },
    landingPageSubstitutionPolicy: "forbidden",
    evidence: evidence("O refinamento humano da E20.2 exige uma descrição factual do serviço ou da oferta principal.", "decision:e20-2-human"),
    createdInVersion: 2,
  }),
  field({
    fieldKey: "brand_logo_asset",
    purpose: "Referenciar de forma opaca a logo ou o asset principal da marca, quando fornecido.",
    valueType: "asset_reference",
    valueScope: "business",
    expectedValueOrigin: "business_provided",
    obligation: "optional",
    validation: { kind: "asset_reference" },
    landingPageSubstitutionPolicy: "forbidden",
    evidence: evidence("O refinamento humano da E20.2 mantém a logo opcional e separa o campo do armazenamento operacional.", "decision:e20-2-human"),
    createdInVersion: 2,
  }),
  field({
    fieldKey: "brand_color_palette",
    purpose: "Confirmar a identidade visual mínima da conta por uma paleta reutilizável com papéis de cor explícitos.",
    valueType: "color_palette",
    valueScope: "business",
    expectedValueOrigin: "business_provided",
    obligation: "required",
    validation: { kind: "color_palette" },
    landingPageSubstitutionPolicy: "explicit_allowed",
    evidence: evidence("O refinamento humano da E20.2 exige identidade ou paleta visual confirmada para o Starter, mesmo sem logo.", "decision:e20-2-human"),
    createdInVersion: 2,
  }),
];

const catalogV2: LandingPageInputCatalogRegistryEntry = {
  version: 2,
  universal: {
    ...catalogV1.universal,
    entries: [
      catalogV1.universal.entries[0],
      ...starterV2Fields,
      ...catalogV1.universal.entries.slice(1),
    ],
  },
  taxonLayers: catalogV1.taxonLayers,
};

const catalogV3 = {
  ...cloneJson(catalogV2),
  version: 3,
} as LandingPageInputCatalogRegistryEntry;
const brokerV3Layer = catalogV3.taxonLayers[realEstateBrokerNicheTaxon.slug];
if (!brokerV3Layer) throw new Error("Real-estate broker input layer is unavailable.");
for (const entry of brokerV3Layer.entries) {
  if (
    entry.kind === "field" &&
    (entry.fieldKey === "financing_support_available" ||
      entry.fieldKey === "document_support_available")
  ) {
    (entry as LandingPageInputFieldDefinition & {
      capabilityBindings: LandingPageInputFieldDefinition["capabilityBindings"];
    }).capabilityBindings = [
      { slotKey: "applicable_capabilities", supportedWhenValue: true },
    ];
  }
}

const catalogV4 = {
  ...cloneJson(catalogV3),
  version: 4,
} as LandingPageInputCatalogRegistryEntry;
const brokerV4Layer = catalogV4.taxonLayers[realEstateBrokerNicheTaxon.slug];
if (!brokerV4Layer) throw new Error("Real-estate broker input layer is unavailable.");
const transactionIntentV4 = brokerV4Layer.entries.find(
  (entry) => entry.kind === "field" && entry.fieldKey === "transaction_intent",
);
if (
  !transactionIntentV4 ||
  transactionIntentV4.kind !== "field" ||
  transactionIntentV4.validation.kind !== "enum"
) {
  throw new Error("Real-estate broker transaction intent is unavailable.");
}
const mutableTransactionIntentV4 = transactionIntentV4 as unknown as {
  validation: { kind: "enum"; allowedValues: string[] };
  evidence: LandingPageInputEvidence;
};
mutableTransactionIntentV4.validation = {
  ...transactionIntentV4.validation,
  allowedValues: [...transactionIntentV4.validation.allowedValues, "rent"],
};
mutableTransactionIntentV4.evidence = evidence(
  "A pesquisa diferencia compra, venda, avaliação, fluxo híbrido e locação exclusiva.",
  "empirical:real-estate-research",
);

const v5UniversalFields: readonly LandingPageInputFieldDefinition[] = [
  field({
    fieldKey: "business_offerings_summary",
    purpose: "Resumir de forma livre e não exaustiva o que o negócio oferece; não é catálogo, whitelist ou restrição de primary_service_or_offer e não limita ofertas diferentes, mais amplas ou mais específicas na landing page.",
    valueType: "string",
    valueScope: "business",
    expectedValueOrigin: "business_provided",
    obligation: "optional",
    validation: { kind: "type_only" },
    landingPageSubstitutionPolicy: "forbidden",
    evidence: evidence("A decisão humana da E20.2 separa o resumo livre do negócio de uma oferta concreta da landing page e não cria whitelist.", "decision:e20-2-human"),
    createdInVersion: 5,
  }),
  field({
    fieldKey: "primary_conversion_goal",
    purpose: "Declarar a ação ou conversão principal pretendida pela landing page, independentemente do canal autorizado usado para realizá-la, sem confundi-la com funnel_stage, transaction_intent, primary_service_or_offer ou primary_conversion_channel.",
    valueType: "enum",
    valueScope: "landing_page",
    expectedValueOrigin: "landing_page_provided",
    obligation: "required",
    validation: { kind: "enum", allowedValues: ["contact", "schedule", "request_quote", "purchase", "register_interest"] },
    landingPageSubstitutionPolicy: "not_applicable",
    evidence: evidence("A decisão humana da E20.2 separa a ação ou conversão pretendida do estágio, da intenção comercial específica, da oferta e do canal de conversão.", "decision:e20-2-human"),
    createdInVersion: 5,
  }),
];

const catalogV5Base = cloneJson(catalogV4);
const catalogV5: LandingPageInputCatalogRegistryEntry = {
  ...catalogV5Base,
  version: 5,
  universal: {
    ...catalogV5Base.universal,
    entries: [...catalogV5Base.universal.entries, ...v5UniversalFields],
  },
};

const catalogV6Base = cloneJson(catalogV5);
for (const entry of catalogV6Base.universal.entries) {
  if (entry.kind !== "field") continue;
  if (
    entry.fieldKey === "primary_service_or_offer" ||
    entry.fieldKey === "primary_service_or_offer_description"
  ) {
    (entry as LandingPageInputFieldDefinition & { retiredInVersion: number }).retiredInVersion = 6;
  }
  if (entry.fieldKey === "business_offerings_summary") {
    (entry as LandingPageInputFieldDefinition & { purpose: string }).purpose =
      "Resumir de forma livre e não exaustiva o que o negócio oferece; não é catálogo, whitelist ou restrição de landing_page_offering_scope e não limita ofertas diferentes, mais amplas ou mais específicas na landing page.";
  }
  if (entry.fieldKey === "primary_conversion_goal") {
    (entry as LandingPageInputFieldDefinition & { purpose: string }).purpose =
      "Declarar a ação ou conversão principal pretendida pela landing page, independentemente do canal autorizado usado para realizá-la, sem confundi-la com funnel_stage, transaction_intent, landing_page_offering_scope ou primary_conversion_channel.";
  }
}

const v6UniversalFields: readonly LandingPageInputFieldDefinition[] = [
  field({
    fieldKey: "landing_page_offering_scope",
    purpose: "Representar o escopo comercial informado livremente para a landing page.",
    valueType: "offering_scope",
    valueScope: "landing_page",
    expectedValueOrigin: "landing_page_provided",
    obligation: "required",
    validation: { kind: "offering_scope" },
    landingPageSubstitutionPolicy: "not_applicable",
    evidence: evidence("Decisão humana E20.2.9 consolidada no plano-base v2.", "decision:e20-2-human"),
    createdInVersion: 6,
  }),
  field({
    fieldKey: "landing_page_offering_scope_description",
    purpose: "Descrever factualmente o escopo comercial da landing page.",
    valueType: "string",
    valueScope: "landing_page",
    expectedValueOrigin: "landing_page_provided",
    obligation: "required",
    validation: { kind: "type_only" },
    landingPageSubstitutionPolicy: "not_applicable",
    evidence: evidence("Decisão humana E20.2.9 consolidada no plano-base v2.", "decision:e20-2-human"),
    createdInVersion: 6,
  }),
];

const catalogV6: LandingPageInputCatalogRegistryEntry = {
  ...catalogV6Base,
  version: 6,
  universal: {
    ...catalogV6Base.universal,
    entries: [...catalogV6Base.universal.entries, ...v6UniversalFields],
  },
};

export const landingPageInputCatalogRegistry = deepFreeze({
  1: catalogV1,
  2: catalogV2,
  3: catalogV3,
  4: catalogV4,
  5: catalogV5,
  6: catalogV6,
} satisfies LandingPageInputCatalogRegistry);

function field(
  input: Omit<LandingPageInputFieldDefinition, "kind" | "originLayer" | "allowedPlans" | "snapshotPolicy" | "createdInVersion" | "valueType" | "validation"> &
    LandingPageInputTypeValidationContract & {
    originTaxon?: LandingPageInputCatalogTaxonIdentity;
    allowedPlans?: readonly LandingPageInputCatalogPlan[];
    createdInVersion?: number;
  },
): LandingPageInputFieldDefinition {
  return {
    kind: "field",
    ...input,
    originLayer: input.originTaxon?.level ?? "universal",
    allowedPlans: input.allowedPlans ?? allPlans,
    snapshotPolicy: "include_if_used",
    createdInVersion: input.createdInVersion ?? 1,
  } as LandingPageInputFieldDefinition;
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

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
