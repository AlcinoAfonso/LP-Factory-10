import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";

import { LandingPageRenderer } from "../../components/lp-builder/LandingPageRenderer";
import type { CurrentLandingPageRevision } from "./adapters/landingPageRevisionAdapter";
import {
  LANDING_PAGE_PREVIEW_SIGNED_URL_TTL_SECONDS,
  loadLandingPagePreviewWithDependencies,
  resolveLandingPageRenderHref,
  type LandingPagePreviewDependencies,
  type LandingPageRenderModel,
} from "./landingPagePreview";

const ACCOUNT_ID = "10000000-0000-4000-8000-000000000001";
const LANDING_PAGE_ID = "20000000-0000-4000-8000-000000000002";
const REVISION_ID = "30000000-0000-4000-8000-000000000003";
const ATTEMPT_ID = "40000000-0000-4000-8000-000000000004";
const ASSET_PATH = `${ACCOUNT_ID}/${LANDING_PAGE_ID}/${ATTEMPT_ID}/main.webp`;
const SIGNED_URL = `https://project.supabase.co/storage/v1/object/sign/landing-page-revision-assets/${ASSET_PATH}?token=safe`;

const asset = {
  bucket: "landing-page-revision-assets",
  path: ASSET_PATH,
  origin: "generated",
  mimeType: "image/webp",
  width: 1536,
  height: 1024,
  bytes: 2048,
  alt: "Sala iluminada de um apartamento contemporâneo",
  imageWorkload: "landing_page_draft_image_generation",
  imageConfigVersion: "v2",
  visualBriefVersion: "e19.4-visual-brief-v1",
} as const;

const sections = [
  { kind: "header", layout: "standard", ctaLabel: "Conversar" },
  {
    kind: "hero",
    layout: "media_right",
    eyebrow: "Seu próximo endereço",
    heading: "Encontre clareza para escolher seu primeiro imóvel no Rio",
    body: "Organize prioridades e avance com orientação em cada etapa da busca.",
    ctaLabel: "Falar agora",
    mediaBrief: "Sala contemporânea, iluminada e acolhedora no Rio de Janeiro",
  },
  {
    kind: "text_media",
    layout: "media_left",
    heading: "Uma busca que começa pelo que importa para você",
    body: "Compare possibilidades com contexto antes de tomar uma decisão.",
    mediaBrief: null,
  },
  {
    kind: "cards_grid",
    layout: "grid_3",
    heading: "Apoio para decidir",
    intro: "Três pontos para orientar o caminho.",
    cards: [
      { title: "Prioridades", body: "Defina o que faz sentido para seu momento." },
      { title: "Possibilidades", body: "Entenda caminhos antes de avançar." },
      { title: "Conversa", body: "Leve suas dúvidas para o próximo passo." },
    ],
  },
  {
    kind: "steps",
    layout: "numbered",
    heading: "Como começar",
    intro: null,
    items: [
      { title: "Conte seu momento", body: "Compartilhe prioridades e dúvidas." },
      { title: "Organize a busca", body: "Avalie opções com mais contexto." },
    ],
  },
  {
    kind: "faq",
    layout: "accordion",
    heading: "Dúvidas frequentes",
    items: [
      { question: "Preciso já ter um imóvel em mente?", answer: "Não. A conversa pode começar pelas suas prioridades." },
      { question: "Qual é o próximo passo?", answer: "Use o botão para iniciar uma conversa." },
    ],
  },
  {
    kind: "cta",
    layout: "centered",
    heading: "Dê o primeiro passo com mais clareza",
    body: "Uma conversa pode ajudar a organizar sua busca.",
    ctaLabel: "Conversar pelo WhatsApp",
  },
  { kind: "footer", layout: "standard", tagline: "Escolhas imobiliárias com contexto." },
] as const;

function revisionFixture(): CurrentLandingPageRevision {
  return {
    id: REVISION_ID,
    accountId: ACCOUNT_ID,
    landingPageId: LANDING_PAGE_ID,
    revisionNumber: 3,
    attemptId: ATTEMPT_ID,
    content: {
      contractVersion: 1,
      presentation: { contractVersion: 1, sections },
      binding: {
        channel: "whatsapp",
        destinationFieldKey: "whatsapp_destination",
        destination: "+5521979658483",
      },
      media: { mainImage: { ...asset } },
    },
    snapshot: {
      snapshotVersion: 1,
      attemptId: ATTEMPT_ID,
      requestId: "request-preview-proof",
      generatedAt: "2026-08-18T12:00:00.000Z",
      promptVersion: "e19.4-presentation-v2",
      presentationContractVersion: 1,
      generationContext: {
        contractVersion: 3,
        identities: {
          accountId: ACCOUNT_ID,
          landingPage: { id: LANDING_PAGE_ID, status: "draft" },
          planKey: "starter",
          servedTaxon: { id: "taxon-1", slug: "corretor-imoveis", name: "Corretor de imóveis" },
          taxonChain: {},
          historicalConfigurationCatalogVersion: 2,
          effectiveInputCatalogVersion: 4,
          configurationRevision: 8,
          rootVersion: 1,
          endCustomerResearchVersion: 1,
        },
        modelContext: {
          research: {
            taxonSlug: "corretor-imoveis",
            audienceScope: "end_customer",
            researchVersion: 1,
            content: "RESEARCH_MUST_NEVER_REACH_THE_RENDER_MODEL",
          },
          facts: [
            {
              fieldKey: "business_display_name",
              purpose: "business identity",
              valueType: "string",
              value: "Imóveis com Alcino",
              source: "account_configuration",
              provenance: [],
            },
            {
              fieldKey: "artificial_internal_fact",
              purpose: "must stay private",
              valueType: "string",
              value: "ARTIFICIAL_FACT_MUST_NOT_LEAK",
              source: "account_configuration",
              provenance: [],
            },
          ],
          editorialLimits: { semanticRoles: [], semanticHierarchy: ["h1", "h2", "h3"] },
        },
        bindingFacts: [],
      },
      workloads: {
        text: {
          configuration: {
            workload: "landing_page_draft_generation",
            source: "repo_catalog",
            revision: "v2",
            model: "gpt-5.6-luna",
            reasoningEffort: "max",
          },
          responseId: "response-private",
          usage: {
            inputTokens: 100,
            cachedInputTokens: 0,
            cacheWriteTokens: null,
            outputTokens: 200,
            reasoningTokens: 50,
            totalTokens: 300,
          },
          latencyMs: 1000,
          estimatedCost: null,
          costStatus: "unavailable",
        },
        image: {
          configuration: {
            workload: "landing_page_draft_image_generation",
            source: "repo_catalog",
            revision: "v2",
            model: "gpt-image-2",
            size: "1536x1024",
            quality: "medium",
            format: "webp",
            compression: 80,
            moderation: "auto",
          },
          providerRequestId: "image-request-private",
          latencyMs: 1200,
          estimatedCost: null,
          costStatus: "unavailable",
        },
      },
      media: { mainImage: { ...asset } },
      validators: { presentation: "passed", binding: "passed", image: "passed" },
    },
    createdBy: "50000000-0000-4000-8000-000000000005",
    createdAt: "2026-08-18T12:00:01.000Z",
  } as unknown as CurrentLandingPageRevision;
}

function dependencies(
  calls: string[],
  overrides: Partial<LandingPagePreviewDependencies> = {},
): LandingPagePreviewDependencies {
  return {
    authorizeViewer: async () => {
      calls.push("access");
      return { ok: true, accountId: ACCOUNT_ID };
    },
    loadEntitlement: async () => {
      calls.push("entitlement");
      return true;
    },
    loadLandingPage: async () => {
      calls.push("landing_page");
      return {
        ok: true,
        landingPage: {
          id: LANDING_PAGE_ID,
          account_id: ACCOUNT_ID,
          name: "Primeiro imóvel no Rio",
          slug: "primeiro-imovel-no-rio",
          status: "draft",
        },
      };
    },
    readCurrentRevision: async () => {
      calls.push("revision");
      return { ok: true, value: revisionFixture() };
    },
    signAsset: async () => {
      calls.push("sign");
      return { ok: true, signedUrl: SIGNED_URL };
    },
    ...overrides,
  };
}

const cases = [
  {
    name: "authorized loader validates every gate before signing the current revision",
    run: async () => {
      const calls: string[] = [];
      const before = revisionFixture();
      const beforeJson = JSON.stringify(before);
      const result = await loadLandingPagePreviewWithDependencies(
        { accountSlug: "account", landingPageId: LANDING_PAGE_ID },
        dependencies(calls, {
          readCurrentRevision: async () => {
            calls.push("revision");
            return { ok: true, value: before };
          },
        }),
      );
      assert.equal(result.status, "ready");
      assert.deepEqual(calls, ["access", "entitlement", "landing_page", "revision", "sign"]);
      assert.equal(JSON.stringify(before), beforeJson, "persisted revision must remain unaltered");
      if (result.status !== "ready") return;
      assert.equal(result.model.revision.number, 3);
      assert.equal(result.model.revision.attemptId, ATTEMPT_ID);
      assert.equal(result.model.conversion.href, "https://wa.me/5521979658483");
      assert.notEqual(result.model.conversion.href, before.content.binding.destination);
    },
  },
  {
    name: "account membership entitlement landing-page and tenant drift fail before signing",
    run: async () => {
      const scenarios: Array<{
        expected: string;
        override: Partial<LandingPagePreviewDependencies>;
      }> = [
        { expected: "denied", override: { authorizeViewer: async () => ({ ok: false }) } },
        { expected: "unavailable", override: { loadEntitlement: async () => false } },
        { expected: "not_found", override: { loadLandingPage: async () => ({ ok: false, error: "not_found" }) } },
        {
          expected: "unavailable",
          override: {
            readCurrentRevision: async () => ({
              ok: true,
              value: { ...revisionFixture(), accountId: "60000000-0000-4000-8000-000000000006" },
            }),
          },
        },
      ];
      for (const scenario of scenarios) {
        let signed = false;
        const result = await loadLandingPagePreviewWithDependencies(
          { accountSlug: "account", landingPageId: LANDING_PAGE_ID },
          dependencies([], {
            ...scenario.override,
            signAsset: async () => {
              signed = true;
              return { ok: true, signedUrl: SIGNED_URL };
            },
          }),
        );
        assert.equal(result.status, scenario.expected);
        assert.equal(signed, false);
      }
    },
  },
  {
    name: "empty invalid CTA and signing failure have explicit fail-closed states",
    run: async () => {
      const empty = await loadLandingPagePreviewWithDependencies(
        { accountSlug: "account", landingPageId: LANDING_PAGE_ID },
        dependencies([], { readCurrentRevision: async () => ({ ok: true, value: null }) }),
      );
      assert.equal(empty.status, "empty");

      const invalidCtaRevision = revisionFixture();
      invalidCtaRevision.content.binding.destination = "(21) 99999-9999";
      const invalidCta = await loadLandingPagePreviewWithDependencies(
        { accountSlug: "account", landingPageId: LANDING_PAGE_ID },
        dependencies([], { readCurrentRevision: async () => ({ ok: true, value: invalidCtaRevision }) }),
      );
      assert.equal(invalidCta.status, "invalid_cta");

      const signingFailure = await loadLandingPagePreviewWithDependencies(
        { accountSlug: "account", landingPageId: LANDING_PAGE_ID },
        dependencies([], { signAsset: async () => ({ ok: false }) }),
      );
      assert.equal(signingFailure.status, "unavailable");
    },
  },
  {
    name: "CTA hrefs are constructed only after channel-specific validation",
    run: () => {
      assert.equal(resolveLandingPageRenderHref({ channel: "whatsapp", destinationFieldKey: "whatsapp_destination", destination: "+5521979658483" }), "https://wa.me/5521979658483");
      assert.equal(resolveLandingPageRenderHref({ channel: "phone", destinationFieldKey: "phone_destination", destination: "+5521979658483" }), "tel:+5521979658483");
      assert.equal(resolveLandingPageRenderHref({ channel: "email", destinationFieldKey: "email_destination", destination: "contato@example.com" }), "mailto:contato%40example.com");
      assert.equal(resolveLandingPageRenderHref({ channel: "external_url", destinationFieldKey: "external_url_destination", destination: "https://example.com/conversar" }), "https://example.com/conversar");
      for (const invalid of [
        { channel: "whatsapp", destinationFieldKey: "whatsapp_destination", destination: "21999999999" },
        { channel: "phone", destinationFieldKey: "whatsapp_destination", destination: "+5521979658483" },
        { channel: "email", destinationFieldKey: "email_destination", destination: "not-an-email" },
        { channel: "external_url", destinationFieldKey: "external_url_destination", destination: "http://example.com" },
        { channel: "form", destinationFieldKey: "form_destination", destination: "value" },
      ]) assert.equal(resolveLandingPageRenderHref(invalid), null);
    },
  },
  {
    name: "read model is an allowlist and excludes research storage paths and provider details",
    run: async () => {
      const result = await loadLandingPagePreviewWithDependencies(
        { accountSlug: "account", landingPageId: LANDING_PAGE_ID },
        dependencies([]),
      );
      assert.equal(result.status, "ready");
      if (result.status !== "ready") return;
      const serialized = JSON.stringify(result.model);
      assert.match(serialized, /Imóveis com Alcino/);
      assert.doesNotMatch(serialized, /RESEARCH_MUST_NEVER|ARTIFICIAL_FACT_MUST_NOT_LEAK/);
      assert.doesNotMatch(serialized, /"bucket":|"path":|response-private|image-request-private/);
      assert.doesNotMatch(serialized, /modelContext|serverContext|bindingFacts|mediaBrief|supabaseClient|serviceRole/i);
      assert.match(serialized, /gpt-5\.6-luna/);
      assert.match(serialized, /gpt-image-2/);
    },
  },
  {
    name: "pure renderer covers all eight variants with one H1 and rejects an unknown kind safely",
    run: async () => {
      const result = await loadLandingPagePreviewWithDependencies(
        { accountSlug: "account", landingPageId: LANDING_PAGE_ID },
        dependencies([]),
      );
      assert.equal(result.status, "ready");
      if (result.status !== "ready") return;
      const html = renderToStaticMarkup(<LandingPageRenderer model={result.model} />);
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      for (const kind of ["header", "hero", "text_media", "cards_grid", "steps", "faq", "cta", "footer"]) {
        assert.match(html, new RegExp(`data-section-kind="${kind}"`));
      }
      assert.match(html, /alt="Sala iluminada de um apartamento contemporâneo"/);

      const events: string[] = [];
      const previousError = console.error;
      console.error = (value) => events.push(String(value));
      try {
        const invalidModel = {
          ...result.model,
          sections: [{ kind: "unknown" }],
        } as unknown as LandingPageRenderModel;
        assert.doesNotThrow(() => renderToStaticMarkup(<LandingPageRenderer model={invalidModel} />));
      } finally {
        console.error = previousError;
      }
      assert.match(events.join("\n"), /landing_page_renderer_invalid_section/);
    },
  },
  {
    name: "source boundaries preserve max-revision read viewer access TTL and no mutable recompilation",
    run: () => {
      const revisionAdapter = readFileSync(new URL("./adapters/landingPageRevisionAdapter.ts", import.meta.url), "utf8");
      const storageAdapter = readFileSync(new URL("./adapters/landingPageRevisionStorageAdapter.ts", import.meta.url), "utf8");
      const previewAdapter = readFileSync(new URL("./adapters/landingPagePreviewAdapter.ts", import.meta.url), "utf8");
      const previewCore = readFileSync(new URL("./landingPagePreview.ts", import.meta.url), "utf8");
      const renderer = readFileSync(new URL("../../components/lp-builder/LandingPageRenderer.tsx", import.meta.url), "utf8");
      const page = readFileSync(new URL("../../app/a/[account]/landing-pages/[landingPageId]/preview/page.tsx", import.meta.url), "utf8");
      const action = readFileSync(new URL("../../app/a/[account]/landing-pages/[landingPageId]/preview/actions.ts", import.meta.url), "utf8");

      assert.match(revisionAdapter, /order\("revision_number", \{ ascending: false \}\)/);
      assert.match(revisionAdapter, /\.limit\(1\)/);
      assert.equal(LANDING_PAGE_PREVIEW_SIGNED_URL_TTL_SECONDS, 300);
      assert.match(storageAdapter, /createSignedUrl\(asset\.path, LANDING_PAGE_PREVIEW_SIGNED_URL_TTL_SECONDS\)/);
      assert.match(previewAdapter, /access\.status !== "active"/);
      assert.doesNotMatch(previewAdapter, /requireAccountMembersManager/);
      assert.match(action, /requireAccountMembersManager/);
      assert.doesNotMatch(`${previewAdapter}\n${previewCore}\n${renderer}\n${page}`, /compileLandingPageGenerationContextForDraft/);
      assert.doesNotMatch(`${previewCore}\n${renderer}`, /createServiceClient|OpenAI|openai|research\.content|generationContextAdapter/);
      assert.match(page, /status === "invalid_cta"/);
      assert.match(page, /status === "empty"/);
      assert.match(page, /status === "ready"/);
    },
  },
];

void runCases();

async function runCases() {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}
