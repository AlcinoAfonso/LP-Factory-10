import "server-only";

import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";
import {
  COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
  COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS,
  type CommercialActivationResearchBlock,
  type ContentComposition,
  type ContentCompositionItem,
} from "../contracts";
import { isRecord } from "../validation";
import { resolveCommercialActivationCompositionForTaxon } from "./composition";
import { commercialActivationSectionRegistry } from "./registry";
import { resolveCommercialActivationRenderModel } from "./resolve";
import {
  commercialActivationContentV1Schema,
  type CommercialActivationContentV1,
  type CommercialActivationSectionVariant,
  type PlansCardsContent,
} from "./schemas";

const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";
export const COMMERCIAL_ACTIVATION_PILOT_TAXON_SLUG =
  "corretor-de-imoveis-de-medio-padrao";
const RESEARCH_VERSION = 1;
const SAFE_CTA_HREF = "/auth/sign-up";
const MODEL_ENV_NAME = "OPENAI_COMMERCIAL_ACTIVATION_MODEL";
const MAX_GENERATION_ATTEMPTS = 2;

const generatedCtaSchema = z
  .object({
    label: z.string().trim().min(1).max(40),
  })
  .strict();

const generatedCardSchema = z
  .object({
    title: z.string().trim().min(1).max(96),
    description: z.string().trim().min(1).max(480),
  })
  .strict();

const generatedOutputSchema = z
  .object({
    hero: z
      .object({
        eyebrow: z.string().trim().min(1).max(96),
        title: z.string().trim().min(1).max(140),
        description: z.string().trim().min(1).max(480),
        primary_cta: generatedCtaSchema,
      })
      .strict(),
    benefits: z
      .object({
        eyebrow: z.string().trim().min(1).max(96),
        title: z.string().trim().min(1).max(220),
        items: z.array(generatedCardSchema).min(2).max(6),
      })
      .strict(),
    services: z
      .object({
        eyebrow: z.string().trim().min(1).max(96),
        title: z.string().trim().min(1).max(220),
        items: z.array(z.string().trim().min(1).max(96)).min(3).max(8),
      })
      .strict(),
    plans: z
      .object({
        eyebrow: z.string().trim().min(1).max(96),
        title: z.string().trim().min(1).max(220),
        disclaimer: z.string().trim().min(1).max(480),
        plan_narratives: z
          .array(
            z
              .object({
                name: z.string().trim().min(1).max(96),
                description: z.string().trim().min(1).max(480),
                cta_label: z.string().trim().min(1).max(40),
                highlighted: z.boolean(),
              })
              .strict(),
          )
          .min(4)
          .max(4),
      })
      .strict(),
    differentials: z
      .object({
        eyebrow: z.string().trim().min(1).max(96),
        title: z.string().trim().min(1).max(220),
        items: z.array(generatedCardSchema).min(2).max(6),
      })
      .strict(),
    how_it_works: z
      .object({
        eyebrow: z.string().trim().min(1).max(96),
        title: z.string().trim().min(1).max(220),
        steps: z
          .array(
            z
              .object({
                label: z.string().trim().min(1).max(12),
                title: z.string().trim().min(1).max(96),
                description: z.string().trim().min(1).max(480),
              })
              .strict(),
          )
          .min(2)
          .max(6),
      })
      .strict(),
    faq: z
      .object({
        eyebrow: z.string().trim().min(1).max(96),
        title: z.string().trim().min(1).max(220),
        questions: z
          .array(
            z
              .object({
                question: z.string().trim().min(1).max(220),
                answer: z.string().trim().min(1).max(480),
              })
              .strict(),
          )
          .min(2)
          .max(8),
      })
      .strict(),
    final_cta: z
      .object({
        title: z.string().trim().min(1).max(220),
        description: z.string().trim().min(1).max(480),
        cta: generatedCtaSchema,
      })
      .strict(),
  })
  .strict();

type GeneratedOutput = z.infer<typeof generatedOutputSchema>;

type ResearchSource = {
  id: string;
  audienceScope: "business_buyer" | "end_customer";
  block: CommercialActivationResearchBlock;
  itemCount: number;
  items: Array<{
    key: string;
    text: string;
    priority: number;
    sortOrder: number;
  }>;
};

type CommercialPlan = {
  key: string;
  name: string;
  priceMonthly: string;
  maxLps: number;
  maxConversions: number;
  features: Record<string, unknown>;
};

type DraftContext = {
  taxon: {
    id: string;
    name: string;
    slug: string;
  };
  composition: ContentComposition;
  businessBuyerResearch: ResearchSource[];
  endCustomerResearch: ResearchSource[];
  plans: CommercialPlan[];
};

type ResponsesApiResponse = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: unknown;
    }>;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

type GenerateDraftSuccess = {
  ok: true;
  requestId: string;
  artifactId: string;
  artifactVersion: number;
  model: string;
};

type GenerateDraftFailure = {
  ok: false;
  requestId: string;
  status:
    | "blocked"
    | "failed";
  stage:
    | "env"
    | "preconditions"
    | "openai"
    | "validation"
    | "persistence";
  reason: string;
};

export type GenerateCommercialActivationDraftResult =
  | GenerateDraftSuccess
  | GenerateDraftFailure;

const COMMERCIAL_ACTIVATION_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "hero",
    "benefits",
    "services",
    "plans",
    "differentials",
    "how_it_works",
    "faq",
    "final_cta",
  ],
  properties: {
    hero: objectSchema(
      ["eyebrow", "title", "description", "primary_cta"],
      {
        eyebrow: shortString(96),
        title: shortString(140),
        description: shortString(480),
        primary_cta: ctaOutputSchema(),
      },
    ),
    benefits: sectionCardsSchema(),
    services: objectSchema(["eyebrow", "title", "items"], {
      eyebrow: shortString(96),
      title: shortString(220),
      items: arrayOf(shortString(96), 3, 8),
    }),
    plans: objectSchema(["eyebrow", "title", "disclaimer", "plan_narratives"], {
      eyebrow: shortString(96),
      title: shortString(220),
      disclaimer: shortString(480),
      plan_narratives: arrayOf(
        objectSchema(["name", "description", "cta_label", "highlighted"], {
          name: shortString(96),
          description: shortString(480),
          cta_label: shortString(40),
          highlighted: { type: "boolean" },
        }),
        4,
        4,
      ),
    }),
    differentials: sectionCardsSchema(),
    how_it_works: objectSchema(["eyebrow", "title", "steps"], {
      eyebrow: shortString(96),
      title: shortString(220),
      steps: arrayOf(
        objectSchema(["label", "title", "description"], {
          label: shortString(12),
          title: shortString(96),
          description: shortString(480),
        }),
        2,
        6,
      ),
    }),
    faq: objectSchema(["eyebrow", "title", "questions"], {
      eyebrow: shortString(96),
      title: shortString(220),
      questions: arrayOf(
        objectSchema(["question", "answer"], {
          question: shortString(220),
          answer: shortString(480),
        }),
        2,
        8,
      ),
    }),
    final_cta: objectSchema(["title", "description", "cta"], {
      title: shortString(220),
      description: shortString(480),
      cta: ctaOutputSchema(),
    }),
  },
} as const;

export async function generateCommercialActivationDraftForTaxon(input: {
  taxonSlug?: string;
  requestId?: string;
} = {}): Promise<GenerateCommercialActivationDraftResult> {
  const requestId = input.requestId ?? crypto.randomUUID();
  const taxonSlug =
    input.taxonSlug?.trim() || COMMERCIAL_ACTIVATION_PILOT_TAXON_SLUG;
  const model = process.env[MODEL_ENV_NAME]?.trim() ?? "";
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";

  if (!apiKey || !model) {
    logDraftEvent("commercial_activation_draft_generation_blocked", {
      requestId,
      taxonId: null,
      status: "blocked",
      reason: "missing_openai_env",
    });
    return {
      ok: false,
      requestId,
      status: "blocked",
      stage: "env",
      reason: "missing_openai_env",
    };
  }

  try {
    const context = await readDraftContext({ taxonSlug });
    const generated = await generateWithOpenAi({ context, model, apiKey });
    const content = buildContentJson({ context, generated });
    const validation = validateCommercialActivationContent({
      composition: context.composition,
      content,
    });

    if (!validation.ok) {
      logDraftEvent("commercial_activation_draft_generation_failed", {
        requestId,
        taxonId: context.taxon.id,
        status: "failed",
        reason: validation.reason,
      });
      return {
        ok: false,
        requestId,
        status: "failed",
        stage: "validation",
        reason: validation.reason,
      };
    }

    const persisted = await persistDraft({
      requestId,
      context,
      content,
      model,
    });

    logDraftEvent("commercial_activation_draft_generation_completed", {
      requestId,
      taxonId: context.taxon.id,
      status: "ok",
      artifactVersion: persisted.artifactVersion,
    });

    return {
      ok: true,
      requestId,
      artifactId: persisted.artifactId,
      artifactVersion: persisted.artifactVersion,
      model,
    };
  } catch (error) {
    const safeError = toSafeErrorReason(error);
    logDraftEvent("commercial_activation_draft_generation_failed", {
      requestId,
      taxonId: null,
      status: "failed",
      reason: safeError,
    });
    return {
      ok: false,
      requestId,
      status: "failed",
      stage: inferFailureStage(safeError),
      reason: safeError,
    };
  }
}

async function readDraftContext(input: { taxonSlug: string }): Promise<DraftContext> {
  const supabase = createServiceClient();

  const { data: taxonRow, error: taxonError } = await supabase
    .from("business_taxons")
    .select("id,name,slug,is_active")
    .eq("slug", input.taxonSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (taxonError) throw new Error("taxon_read_failed");
  if (!isRecord(taxonRow) || typeof taxonRow.id !== "string") {
    throw new Error("pilot_taxon_missing");
  }

  const compositionResult = await resolveCommercialActivationCompositionForTaxon({
    taxonId: taxonRow.id,
  });
  if (compositionResult.status !== "ready") {
    throw new Error(compositionResult.status);
  }

  const research = await readResearchSources({
    taxonId: taxonRow.id,
  });

  const plans = await readPlans();

  return {
    taxon: {
      id: taxonRow.id,
      name: String(taxonRow.name),
      slug: String(taxonRow.slug),
    },
    composition: compositionResult.composition,
    businessBuyerResearch: research.filter(
      (source) => source.audienceScope === "business_buyer",
    ),
    endCustomerResearch: research.filter(
      (source) => source.audienceScope === "end_customer",
    ),
    plans,
  };
}

async function readResearchSources(input: {
  taxonId: string;
}): Promise<ResearchSource[]> {
  const supabase = createServiceClient();
  const { data: researchRows, error: researchError } = await supabase
    .from("taxon_market_research")
    .select("id,taxon_id,research_block,audience_scope,version,status")
    .eq("taxon_id", input.taxonId)
    .eq("version", RESEARCH_VERSION)
    .eq("status", "active")
    .in("audience_scope", ["business_buyer", "end_customer"])
    .order("audience_scope", { ascending: true })
    .order("research_block", { ascending: true });

  if (researchError) throw new Error("research_read_failed");

  const sources = (researchRows ?? [])
    .map(normalizeResearchRow)
    .filter((source): source is ResearchSource => source !== null);
  if (!hasExpectedResearchCoverage(sources)) {
    throw new Error("research_preconditions_missing");
  }

  const researchIds = sources.map((source) => source.id);
  const { data: itemRows, error: itemError } = await supabase
    .from("taxon_market_research_items")
    .select("research_id,item_key,item_text,priority,sort_order,is_active")
    .in("research_id", researchIds)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("sort_order", { ascending: true });

  if (itemError) throw new Error("research_items_read_failed");

  const itemsByResearch = new Map<string, ResearchSource["items"]>();
  for (const item of itemRows ?? []) {
    if (!isRecord(item) || typeof item.research_id !== "string") continue;
    const current = itemsByResearch.get(item.research_id) ?? [];
    current.push({
      key: String(item.item_key ?? ""),
      text: String(item.item_text ?? ""),
      priority: typeof item.priority === "number" ? item.priority : 0,
      sortOrder: typeof item.sort_order === "number" ? item.sort_order : 999,
    });
    itemsByResearch.set(item.research_id, current);
  }

  const hydrated = sources.map((source) => ({
    ...source,
    itemCount: itemsByResearch.get(source.id)?.length ?? 0,
    items: itemsByResearch.get(source.id) ?? [],
  }));

  if (hydrated.some((source) => source.itemCount === 0)) {
    throw new Error("research_items_missing");
  }

  return hydrated;
}

async function readPlans(): Promise<CommercialPlan[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("plans")
    .select("name,price_monthly,max_lps,max_conversions,features")
    .order("price_monthly", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) throw new Error("plans_read_failed");

  const plans = (data ?? [])
    .map(normalizePlanRow)
    .filter((plan): plan is CommercialPlan => plan !== null);
  const planNames = new Set(plans.map((plan) => plan.name));
  const expected = ["Starter", "Lite", "Pro", "Ultra"];
  if (
    plans.length !== 4 ||
    !expected.every((name) => planNames.has(name)) ||
    planNames.has("Light")
  ) {
    throw new Error("plans_preconditions_invalid");
  }

  return expected.map((name) => {
    const plan = plans.find((item) => item.name === name);
    if (!plan) throw new Error("plans_preconditions_invalid");
    return plan;
  });
}

async function generateWithOpenAi(input: {
  context: DraftContext;
  model: string;
  apiKey: string;
}): Promise<GeneratedOutput> {
  const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      input: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(buildPromptPayload(input.context)),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "commercial_activation_draft_v1",
          strict: true,
          schema: COMMERCIAL_ACTIVATION_OUTPUT_SCHEMA,
        },
      },
      max_output_tokens: 5000,
    }),
  });

  if (!response.ok) {
    throw new Error(`openai_http_${response.status}`);
  }

  const data = (await response.json()) as ResponsesApiResponse;
  if (data.error) {
    throw new Error(data.error.type ?? "openai_response_error");
  }

  const outputText = extractOutputText(data);
  if (!outputText) throw new Error("missing_output_text");

  const parsed = parseJsonObject(outputText);
  const validated = generatedOutputSchema.safeParse(parsed);
  if (!validated.success) throw new Error("generated_output_invalid");

  return validated.data;
}

function buildContentJson(input: {
  context: DraftContext;
  generated: GeneratedOutput;
}): CommercialActivationContentV1 {
  const contentByVariant: Record<CommercialActivationSectionVariant, unknown> = {
    "hero.default": {
      ...input.generated.hero,
      primary_cta: withSafeHref(input.generated.hero.primary_cta),
    },
    "benefits.cards": input.generated.benefits,
    "services.list": input.generated.services,
    "plans.cards": buildCanonicalPlansContent({
      generated: input.generated.plans,
      plans: input.context.plans,
    }),
    "differentials.cards": input.generated.differentials,
    "how_it_works.steps": input.generated.how_it_works,
    "faq.accordion": input.generated.faq,
    "final_cta.simple": {
      ...input.generated.final_cta,
      cta: withSafeHref(input.generated.final_cta.cta),
    },
  };

  return {
    schema_version: 1,
    sections: input.context.composition.items.map((item) => {
      assertKnownVariant(item);
      const content = contentByVariant[item.variantKey];
      if (!isRecord(content)) {
        throw new Error("generated_section_content_invalid");
      }

      return {
        composition_item_id: item.id,
        content,
      };
    }),
  };
}

function buildCanonicalPlansContent(input: {
  generated: GeneratedOutput["plans"];
  plans: CommercialPlan[];
}): PlansCardsContent {
  const narrativeByName = new Map(
    input.generated.plan_narratives.map((plan) => [plan.name, plan]),
  );

  return {
    eyebrow: input.generated.eyebrow,
    title: input.generated.title,
    disclaimer: input.generated.disclaimer,
    plans: input.plans.map((plan) => {
      const narrative = narrativeByName.get(plan.name);
      return {
        key: plan.key,
        name: plan.name,
        price: formatPrice(plan.priceMonthly),
        period: "/mes",
        description:
          narrative?.description ??
          `Plano ${plan.name} da LP Factory com limites oficiais cadastrados.`,
        features: buildPlanFeatures(plan),
        highlighted: narrative?.highlighted ?? plan.name === "Pro",
        cta: {
          label: narrative?.cta_label ?? "Comecar agora",
          href: SAFE_CTA_HREF,
        },
      };
    }),
  };
}

function validateCommercialActivationContent(input: {
  composition: ContentComposition;
  content: CommercialActivationContentV1;
}): { ok: true } | { ok: false; reason: string } {
  const parsed = commercialActivationContentV1Schema.safeParse(input.content);
  if (!parsed.success) return { ok: false, reason: "content_envelope_invalid" };

  if (containsForbiddenString(input.content)) {
    return { ok: false, reason: "content_forbidden_string" };
  }

  const renderModel = resolveCommercialActivationRenderModel({
    composition: input.composition,
    contentJson: input.content,
  });

  if (renderModel.status !== "ready") {
    return { ok: false, reason: renderModel.reason };
  }

  const expectedIds = new Set(input.composition.items.map((item) => item.id));
  const actualIds = new Set(input.content.sections.map((section) => section.composition_item_id));

  if (
    expectedIds.size !== actualIds.size ||
    [...expectedIds].some((id) => !actualIds.has(id))
  ) {
    return { ok: false, reason: "content_composition_mismatch" };
  }

  return { ok: true };
}

async function persistDraft(input: {
  requestId: string;
  context: DraftContext;
  content: CommercialActivationContentV1;
  model: string;
}): Promise<{ artifactId: string; artifactVersion: number }> {
  const supabase = createServiceClient();

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const artifactVersion = await getNextArtifactVersion(input.context);
    const provenance = buildProvenanceJson({
      context: input.context,
      model: input.model,
      requestId: input.requestId,
      artifactVersion,
    });

    const { data: artifactRow, error: artifactError } = await supabase
      .from("content_artifacts")
      .insert({
        template_id: input.context.composition.template.id,
        composition_id: input.context.composition.id,
        taxon_id: input.context.taxon.id,
        audience_scope: COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
        template_version: input.context.composition.template.version,
        composition_version: input.context.composition.version,
        research_version: RESEARCH_VERSION,
        artifact_version: artifactVersion,
        status: "draft",
        content_json: input.content,
        provenance_json: provenance,
        published_at: null,
        archived_at: null,
      })
      .select("id,artifact_version")
      .single();

    if (artifactError) {
      if (artifactError.code === "23505" && attempt < MAX_GENERATION_ATTEMPTS) {
        continue;
      }
      throw new Error("artifact_insert_failed");
    }

    if (!isRecord(artifactRow) || typeof artifactRow.id !== "string") {
      throw new Error("artifact_insert_missing_return");
    }

    const sourceRows = input.context.businessBuyerResearch.map((source) => ({
      artifact_id: artifactRow.id,
      research_id: source.id,
      taxon_id: input.context.taxon.id,
      audience_scope: COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
      research_version: RESEARCH_VERSION,
    }));

    const { error: sourceError } = await supabase
      .from("content_artifact_research_sources")
      .insert(sourceRows);

    if (sourceError) {
      const compensated = await archiveIncompleteDraft({
        artifactId: artifactRow.id,
        requestId: input.requestId,
        taxonId: input.context.taxon.id,
        artifactVersion,
      });

      if (!compensated) {
        throw new Error("artifact_sources_insert_failed_compensation_failed");
      }

      throw new Error("artifact_sources_insert_failed_compensated");
    }

    return {
      artifactId: artifactRow.id,
      artifactVersion:
        typeof artifactRow.artifact_version === "number"
          ? artifactRow.artifact_version
          : artifactVersion,
    };
  }

  throw new Error("artifact_version_conflict");
}

async function archiveIncompleteDraft(input: {
  artifactId: string;
  requestId: string;
  taxonId: string;
  artifactVersion: number;
}): Promise<boolean> {
  const supabase = createServiceClient();
  const archivedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("content_artifacts")
    .update({
      status: "archived",
      archived_at: archivedAt,
      provenance_json: {
        generator: "e10_7_phase_2_admin_ai_draft",
        request_id: input.requestId,
        taxon_id: input.taxonId,
        audience_scope: COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
        research_version: RESEARCH_VERSION,
        invalidated_at: archivedAt,
        invalidation_reason: "artifact_sources_insert_failed",
        artifact_version: input.artifactVersion,
      },
    })
    .eq("id", input.artifactId)
    .eq("status", "draft")
    .is("published_at", null)
    .is("archived_at", null)
    .select("id")
    .single();

  if (error || !data) {
    logDraftEvent("commercial_activation_draft_compensation_failed", {
      requestId: input.requestId,
      taxonId: input.taxonId,
      status: "failed",
      artifactVersion: input.artifactVersion,
      reason: "artifact_archive_failed",
    });
    return false;
  }

  logDraftEvent("commercial_activation_draft_compensated", {
    requestId: input.requestId,
    taxonId: input.taxonId,
    status: "archived",
    artifactVersion: input.artifactVersion,
    reason: "artifact_sources_insert_failed",
  });
  return true;
}

async function getNextArtifactVersion(context: DraftContext): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("content_artifacts")
    .select("artifact_version")
    .eq("template_id", context.composition.template.id)
    .eq("composition_id", context.composition.id)
    .eq("taxon_id", context.taxon.id)
    .eq("audience_scope", COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE)
    .eq("research_version", RESEARCH_VERSION)
    .order("artifact_version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("artifact_version_read_failed");

  if (isRecord(data) && typeof data.artifact_version === "number") {
    return data.artifact_version + 1;
  }

  return 1;
}

function buildProvenanceJson(input: {
  context: DraftContext;
  model: string;
  requestId: string;
  artifactVersion: number;
}) {
  return {
    generator: "e10_7_phase_2_admin_ai_draft",
    request_id: input.requestId,
    generated_at: new Date().toISOString(),
    taxon_id: input.context.taxon.id,
    taxon_slug: input.context.taxon.slug,
    audience_scope: COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
    research_version: RESEARCH_VERSION,
    template_id: input.context.composition.template.id,
    template_version: input.context.composition.template.version,
    composition_id: input.context.composition.id,
    composition_version: input.context.composition.version,
    artifact_version: input.artifactVersion,
    model_env_var: MODEL_ENV_NAME,
    model: input.model,
    cta_href_policy: {
      allowed_internal_href: SAFE_CTA_HREF,
    },
    business_buyer_sources: input.context.businessBuyerResearch.map((source) => ({
      research_id: source.id,
      research_block: source.block,
      version: RESEARCH_VERSION,
      active_item_count: source.itemCount,
    })),
    end_customer_context: input.context.endCustomerResearch.map((source) => ({
      research_id: source.id,
      research_block: source.block,
      version: RESEARCH_VERSION,
      active_item_count: source.itemCount,
    })),
    plans: input.context.plans.map((plan) => ({
      name: plan.name,
      price_monthly: plan.priceMonthly,
      max_lps: plan.maxLps,
      max_conversions: plan.maxConversions,
      features: plan.features,
    })),
  };
}

function buildSystemPrompt(): string {
  return [
    "Voce gera um draft JSON para uma pagina comercial da LP Factory.",
    "Responda apenas JSON valido no schema solicitado.",
    "Use portugues do Brasil, tom claro e comercial, sem promessa de resultado garantido.",
    "Nao gere HTML, JSX, CSS, Tailwind, scripts, markdown ou nomes livres de modulo.",
    "Nao invente planos, precos, descontos, garantias, checkout, URLs comerciais ou condicoes promocionais.",
    "Nao use a palavra checkout no conteudo gerado.",
    "Use public.plans apenas como fonte parcial de nome, preco, limites e features dos planos.",
    "Os CTAs nao devem conter href; o servidor aplicara o href interno seguro aprovado.",
    "Use pesquisas business_buyer como fonte principal.",
    "Use pesquisas end_customer apenas como contexto de linguagem e objecoes.",
  ].join("\n");
}

function buildPromptPayload(context: DraftContext) {
  return {
    taxon: context.taxon,
    target_audience_scope: COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
    research_version: RESEARCH_VERSION,
    template: {
      id: context.composition.template.id,
      key: context.composition.template.key,
      version: context.composition.template.version,
      family: context.composition.template.family,
    },
    composition: {
      id: context.composition.id,
      version: context.composition.version,
      items: context.composition.items.map((item) => ({
        composition_item_id: item.id,
        module_key: item.module.key,
        variant_key: item.variantKey,
        sort_order: item.sortOrder,
        is_required: item.isRequired,
      })),
    },
    business_buyer_research: context.businessBuyerResearch.map(toPromptResearch),
    end_customer_context: context.endCustomerResearch.map(toPromptResearch),
    plans_source: context.plans.map((plan) => ({
      name: plan.name,
      price_monthly: plan.priceMonthly,
      max_lps: plan.maxLps,
      max_conversions: plan.maxConversions,
      features: plan.features,
    })),
    safe_cta_href: SAFE_CTA_HREF,
    prohibitions: [
      "no_html",
      "no_jsx",
      "no_css",
      "no_tailwind",
      "no_scripts",
      "no_free_modules",
      "no_free_variants",
      "no_section_reordering",
      "no_fake_plans",
      "no_fake_prices",
      "no_fake_guarantees",
      "no_fake_checkout_url",
      "no_checkout_word",
      "no_result_promises",
      "no_undocumented_commercial_conditions",
    ],
  };
}

function toPromptResearch(source: ResearchSource) {
  return {
    research_id: source.id,
    audience_scope: source.audienceScope,
    research_block: source.block,
    version: RESEARCH_VERSION,
    items: source.items.map((item) => ({
      item_key: item.key,
      item_text: item.text,
      priority: item.priority,
      sort_order: item.sortOrder,
    })),
  };
}

function normalizeResearchRow(value: unknown): ResearchSource | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    (value.audience_scope !== "business_buyer" &&
      value.audience_scope !== "end_customer") ||
    !COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS.includes(
      value.research_block as CommercialActivationResearchBlock,
    )
  ) {
    return null;
  }

  return {
    id: value.id,
    audienceScope: value.audience_scope,
    block: value.research_block as CommercialActivationResearchBlock,
    itemCount: 0,
    items: [],
  };
}

function hasExpectedResearchCoverage(sources: Array<ResearchSource | null>): sources is ResearchSource[] {
  const validSources = sources.filter((source): source is ResearchSource => source !== null);
  return ["business_buyer", "end_customer"].every((audienceScope) =>
    COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS.every((block) =>
      validSources.some(
        (source) => source.audienceScope === audienceScope && source.block === block,
      ),
    ),
  );
}

function normalizePlanRow(value: unknown): CommercialPlan | null {
  if (!isRecord(value) || typeof value.name !== "string") return null;
  const priceMonthly =
    typeof value.price_monthly === "string"
      ? value.price_monthly
      : typeof value.price_monthly === "number"
        ? value.price_monthly.toFixed(2)
        : null;

  if (
    !priceMonthly ||
    typeof value.max_lps !== "number" ||
    typeof value.max_conversions !== "number"
  ) {
    return null;
  }

  return {
    key: value.name.toLowerCase(),
    name: value.name,
    priceMonthly,
    maxLps: value.max_lps,
    maxConversions: value.max_conversions,
    features: isRecord(value.features) ? value.features : {},
  };
}

function buildPlanFeatures(plan: CommercialPlan): string[] {
  const features = [
    plan.maxLps === -1 ? "LPs ilimitadas" : `${plan.maxLps} LPs`,
    plan.maxConversions === -1
      ? "Conversoes ilimitadas"
      : `${plan.maxConversions} conversoes`,
  ];

  if (typeof plan.features.analytics === "string") {
    features.push(`Analytics ${translateAnalytics(plan.features.analytics)}`);
  }

  if (plan.features.custom_domain === true) {
    features.push("Dominio personalizado");
  }

  if (plan.features.white_label === true) {
    features.push("White label");
  }

  return features.slice(0, 8);
}

function translateAnalytics(value: string): string {
  if (value === "basic") return "basico";
  if (value === "advanced") return "avancado";
  if (value === "premium") return "premium";
  return value;
}

function formatPrice(value: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `R$ ${value}`;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numeric);
}

function withSafeHref(input: { label: string }) {
  return {
    label: input.label,
    href: SAFE_CTA_HREF,
  };
}

function assertKnownVariant(
  item: ContentCompositionItem,
): asserts item is ContentCompositionItem & {
  variantKey: CommercialActivationSectionVariant;
} {
  if (!(item.variantKey in commercialActivationSectionRegistry)) {
    throw new Error("composition_variant_unknown");
  }
}

function extractOutputText(data: ResponsesApiResponse): string | null {
  if (typeof data.output_text === "string") return data.output_text;

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function containsForbiddenString(value: unknown): boolean {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return [
      "<script",
      "<div",
      "<section",
      "class=",
      "tailwind",
      "http://",
      "checkout",
      "garantia de resultado",
    ].some((needle) => lower.includes(needle));
  }

  if (Array.isArray(value)) return value.some(containsForbiddenString);

  if (isRecord(value)) return Object.values(value).some(containsForbiddenString);

  return false;
}

function inferFailureStage(reason: string): GenerateDraftFailure["stage"] {
  if (reason.startsWith("openai_") || reason === "missing_output_text") {
    return "openai";
  }
  if (
    reason.includes("insert") ||
    reason.includes("artifact_version") ||
    reason.includes("persistence")
  ) {
    return "persistence";
  }
  if (reason.includes("invalid") || reason.includes("forbidden")) {
    return "validation";
  }
  return "preconditions";
}

function toSafeErrorReason(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 120);
  }

  return "commercial_activation_draft_generation_error";
}

function logDraftEvent(
  event: string,
  details: {
    requestId: string;
    taxonId: string | null;
    status: string;
    artifactVersion?: number;
    reason?: string;
  },
) {
  console.log(
    JSON.stringify({
      event,
      request_id: details.requestId,
      taxon_id: details.taxonId,
      status: details.status,
      artifact_version: details.artifactVersion,
      reason: details.reason,
    }),
  );
}

function objectSchema(required: string[], properties: Record<string, unknown>) {
  return {
    type: "object",
    additionalProperties: false,
    required,
    properties,
  };
}

function shortString(maxLength: number) {
  return {
    type: "string",
    minLength: 1,
    maxLength,
  };
}

function arrayOf(items: unknown, minItems: number, maxItems: number) {
  return {
    type: "array",
    items,
    minItems,
    maxItems,
  };
}

function ctaOutputSchema() {
  return objectSchema(["label"], {
    label: shortString(40),
  });
}

function sectionCardsSchema() {
  return objectSchema(["eyebrow", "title", "items"], {
    eyebrow: shortString(96),
    title: shortString(220),
    items: arrayOf(
      objectSchema(["title", "description"], {
        title: shortString(96),
        description: shortString(480),
      }),
      2,
      6,
    ),
  });
}
