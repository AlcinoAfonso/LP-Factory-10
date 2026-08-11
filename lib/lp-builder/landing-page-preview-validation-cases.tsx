import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  LandingPageMaterializedRenderer,
  resolveLandingPageMaterializedRendererModel,
  resolveLandingPageRootParameters,
  validateLandingPageGenerationContextSnapshotV1,
  validateLandingPageMaterializedContentV1,
  type LandingPageMaterializedContentV1,
} from "../conversion-content/landing-page";
import type { AccountLandingPageMaterialization } from "./landingPageMaterializationContracts";
import { getLandingPageDraftExperienceStateWithDependencies } from "./landingPagePreview";
import { validateStarterColorPalette } from "./onboardingConfiguration";

const ACCOUNT_ID = "6ecaf813-957e-4f2b-9ea7-3f2cb204a603";
const LANDING_PAGE_ID = "4d91020a-07e5-4bf9-a1aa-272bbc0366ff";
const ACTOR_ID = "9a6af815-42e9-4a12-8ce2-ddae9dac1e15";
const fixture = materializationFixture();

const cases: readonly Readonly<{ name: string; run: () => void | Promise<void> }>[] = [
  {
    name: "experience state validates readiness before tenant-scoped read",
    run: async () => {
      let reads = 0;
      const unavailable = await getLandingPageDraftExperienceStateWithDependencies(
        { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
        {
          probeReadiness: async () => ({ ok: false, ready: false, error: "MATERIALIZATION_STORAGE_UNAVAILABLE" }),
          readMaterialization: async () => {
            reads += 1;
            return { ok: true, value: null };
          },
        },
      );
      assert.deepEqual(unavailable, { status: "unavailable" });
      assert.equal(reads, 0);

      const empty = await getLandingPageDraftExperienceStateWithDependencies(
        { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
        readyDependencies(null),
      );
      assert.deepEqual(empty, { status: "empty" });

      const ready = await getLandingPageDraftExperienceStateWithDependencies(
        { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
        readyDependencies(fixture),
      );
      assert.equal(ready.status, "ready");
      assert.equal(ready.status === "ready" ? ready.materialization.landingPageId : null, LANDING_PAGE_ID);
      assert.deepEqual(
        await getLandingPageDraftExperienceStateWithDependencies({}, readyDependencies(null)),
        { status: "invalid" },
      );
    },
  },
  {
    name: "renderer reproduces frozen order appearance content and safe action",
    run: () => {
      const html = renderToStaticMarkup(createElement(LandingPageMaterializedRenderer, { content: fixture.content }));
      assert.match(html, /data-landing-page-schema-version="1"/);
      assert.match(html, /data-landing-page-root-version="1"/);
      assert.equal(html.includes(`max-width:${fixture.content.root.resolvedPreset.maxPageWidth}`), true);
      assert.match(html, /--lp-primary:#123456/);
      assert.match(html, /--lp-secondary:#234567/);
      assert.match(html, /--lp-accent:#345678/);
      assert.match(html, /--lp-background:#ffffff/i);
      assert.match(html, /--lp-text:#111111/);
      assert.match(html, /Encontre o imóvel ideal/);
      assert.match(html, /Dúvidas frequentes/);
      assert.equal(html.indexOf("Encontre o imóvel ideal") < html.indexOf("Dúvidas frequentes"), true);
      assert.match(html, /https:\/\/wa\.me\/5511999999999/);
    },
  },
  {
    name: "valid boundary palette keeps normal copy on opaque text roles",
    run: () => {
      const boundaryPalette = {
        primary: "#888888",
        secondary: "#777777",
        accent: "#0066CC",
        background: "#FFFFFF",
        text: "#111111",
      } as const;
      const paletteValidation = validateStarterColorPalette(boundaryPalette);
      assert.equal(paletteValidation.ok, true);
      if (!paletteValidation.ok) throw new Error("Boundary palette must satisfy the current Starter contract.");
      assert.equal(paletteValidation.contrast.text >= 4.5, true);
      assert.equal(paletteValidation.contrast.primary >= 3, true);
      assert.equal(paletteValidation.contrast.secondary >= 3, true);
      assert.equal(paletteValidation.contrast.accent >= 3, true);
      assert.equal(
        paletteValidation.contrast.primary < 4.5 || paletteValidation.contrast.secondary < 4.5,
        true,
      );

      const content = structuredClone(fixture.content);
      content.root.brandColorPalette = boundaryPalette;
      assert.equal(resolveLandingPageMaterializedRendererModel(content).ok, true);
      const standardHtml = renderToStaticMarkup(createElement(LandingPageMaterializedRenderer, { content }));
      const formContent = structuredClone(content);
      formContent.modules = [heroFormModule(), leadCaptureFormModule()];
      const formHtml = renderToStaticMarkup(createElement(LandingPageMaterializedRenderer, { content: formContent }));
      const renderedHtml = `${standardHtml}${formHtml}`;

      assert.match(renderedHtml, /--lp-primary:#888888/);
      assert.match(renderedHtml, /--lp-secondary:#777777/);
      assert.match(renderedHtml, /--lp-accent:#0066CC/i);
      assert.match(renderedHtml, /border-\[var\(--lp-primary\)\]/);
      assert.match(renderedHtml, /border-\[var\(--lp-secondary\)\]/);
      assert.match(renderedHtml, /focus-visible:ring-\[var\(--lp-accent\)\]/);
      assert.match(renderedHtml, /decoration-\[var\(--lp-accent\)\]/);

      const normalCopyTags = renderedHtml.match(
        /<(?:p|h1|h2|h3|summary|label)\b[^>]*class="[^"]*"[^>]*>/g,
      ) ?? [];
      assert.equal(normalCopyTags.length > 0, true);
      for (const tag of normalCopyTags) {
        assert.match(tag, /text-\[var\(--lp-text\)\]/);
        assert.doesNotMatch(tag, /opacity-/);
        assert.doesNotMatch(tag, /text-\[var\(--lp-(?:primary|secondary|accent)\)\]/);
      }

      const ctaTags = renderedHtml.match(
        /<(?:a|button)\b[^>]*class="[^"]*bg-\[var\(--lp-text\)\][^"]*text-\[var\(--lp-background\)\][^"]*"[^>]*>/g,
      ) ?? [];
      assert.equal(ctaTags.length, 3);
      for (const tag of ctaTags) assert.doesNotMatch(tag, /opacity-/);
    },
  },
  {
    name: "standard FAQ stays static and accordion uses the native contract",
    run: () => {
      const standard = structuredClone(fixture.content);
      standard.modules[1].variantKey = "faq.standard@v1";
      standard.modules[1].fieldContractKey = "faq.standard@v1";
      standard.modules[1].interactionContracts = [];
      const standardHtml = renderToStaticMarkup(createElement(LandingPageMaterializedRenderer, { content: standard }));
      const accordionHtml = renderToStaticMarkup(createElement(LandingPageMaterializedRenderer, { content: fixture.content }));
      assert.doesNotMatch(standardHtml, /<details/);
      assert.match(standardHtml, /<article/);
      assert.match(accordionHtml, /<details/);
      assert.match(accordionHtml, /<summary/);
      assert.match(accordionHtml, /name="landing-page-faq-1"/);
    },
  },
  {
    name: "unknown schema root identity or interaction fails explicitly",
    run: () => {
      const unsupportedIdentity = structuredClone(fixture.content);
      unsupportedIdentity.modules[0].variantKey = "hero.unknown@v1";
      unsupportedIdentity.modules[0].fieldContractKey = "hero.unknown@v1";
      assert.deepEqual(resolveLandingPageMaterializedRendererModel(unsupportedIdentity), {
        ok: false,
        error: "UNSUPPORTED_IDENTITY",
      });
      assert.deepEqual(resolveLandingPageMaterializedRendererModel({ schemaVersion: 2 }), {
        ok: false,
        error: "INVALID_CONTENT",
      });
      const unsupportedRoot = structuredClone(fixture.content);
      unsupportedRoot.root.rootVersion = 2;
      assert.deepEqual(resolveLandingPageMaterializedRendererModel(unsupportedRoot), {
        ok: false,
        error: "UNSUPPORTED_IDENTITY",
      });
      const formWithoutContract = structuredClone(fixture.content);
      formWithoutContract.modules = [heroFormModule()];
      formWithoutContract.modules[0].interactionContracts = [];
      assert.deepEqual(resolveLandingPageMaterializedRendererModel(formWithoutContract), {
        ok: false,
        error: "UNSUPPORTED_IDENTITY",
      });
      const missingRequiredField = structuredClone(fixture.content);
      missingRequiredField.modules[0].fields = missingRequiredField.modules[0].fields.filter(
        (field) => field.fieldKey !== "title",
      );
      assert.deepEqual(resolveLandingPageMaterializedRendererModel(missingRequiredField), {
        ok: false,
        error: "UNSUPPORTED_IDENTITY",
      });
      const unknownField = structuredClone(fixture.content);
      unknownField.modules[0].fields.push({ kind: "text", fieldKey: "unknown", value: "unsupported" });
      assert.deepEqual(resolveLandingPageMaterializedRendererModel(unknownField), {
        ok: false,
        error: "UNSUPPORTED_IDENTITY",
      });
      const invalidCollectionItem = structuredClone(fixture.content);
      const faqItems = invalidCollectionItem.modules[1].fields.find((field) => field.kind === "collection");
      assert.equal(faqItems?.kind, "collection");
      if (faqItems?.kind === "collection") faqItems.items[0].fields.pop();
      assert.deepEqual(resolveLandingPageMaterializedRendererModel(invalidCollectionItem), {
        ok: false,
        error: "UNSUPPORTED_IDENTITY",
      });
      const incompatibleForm = structuredClone(fixture.content);
      incompatibleForm.modules = [heroFormModule()];
      const form = incompatibleForm.modules[0].interactionContracts[0];
      assert.equal(form.kind, "form");
      if (form.kind === "form") form.fields[2].obligation = "required";
      assert.deepEqual(resolveLandingPageMaterializedRendererModel(incompatibleForm), {
        ok: false,
        error: "UNSUPPORTED_IDENTITY",
      });
    },
  },
  {
    name: "form variants expose native validation and deterministic invalid focus without backend",
    run: () => {
      const formContent = structuredClone(fixture.content);
      formContent.modules = [heroFormModule(), leadCaptureFormModule()];
      const html = renderToStaticMarkup(createElement(LandingPageMaterializedRenderer, { content: formContent }));
      assert.match(html, /id="hero-draft-form"/);
      assert.match(html, /id="lead-capture-draft-form"/);
      assert.equal((html.match(/<form/g) ?? []).length, 2);
      assert.equal((html.match(/type="submit"/g) ?? []).length, 2);
      assert.equal((html.match(/required=""/g) ?? []).length, 6);
      assert.match(html, /aria-describedby="hero-draft-form-instructions"/);
      assert.match(html, /aria-describedby="lead-capture-draft-form-instructions"/);
      assert.doesNotMatch(html, /<input[^>]+name=/);
      assert.doesNotMatch(html, /novalidate/);
      assert.match(html, /Nenhum dado será enviado/);
      assert.equal((html.match(/href="https:\/\/example\.com\/privacy"/g) ?? []).length, 2);
      assert.match(html, /política de privacidade/);
    },
  },
  {
    name: "long materialized tokens wrap without overflow masking",
    run: () => {
      const longToken = "x".repeat(256);
      const content = structuredClone(fixture.content);
      const title = content.modules[0].fields.find((candidate) => candidate.kind === "text" && candidate.fieldKey === "title");
      assert.equal(title?.kind, "text");
      if (title?.kind === "text") title.value = longToken;
      const html = renderToStaticMarkup(createElement(LandingPageMaterializedRenderer, { content }));
      assert.match(html, new RegExp(longToken));
      assert.match(html, /overflow-wrap:anywhere/);
      const rendererSource = readFileSync(
        new URL("../conversion-content/landing-page/materialized-renderer.tsx", import.meta.url),
        "utf8",
      );
      assert.doesNotMatch(rendererSource, /overflow-x-hidden|className="[^"]*overflow-hidden/);
    },
  },
  {
    name: "renderer and preview route read no mutable generation source",
    run: () => {
      const rendererSource = readFileSync(
        new URL("../conversion-content/landing-page/materialized-renderer.tsx", import.meta.url),
        "utf8",
      );
      const previewSource = readFileSync(
        new URL("../../app/a/[account]/landing-pages/[landingPageId]/preview/page.tsx", import.meta.url),
        "utf8",
      );
      assert.doesNotMatch(rendererSource, /module-catalog|generationContext|research|generationProfile|Supabase|OpenAI/i);
      assert.doesNotMatch(rendererSource, /brand-/);
      assert.doesNotMatch(previewSource, /generationContext|research|generationProfile|Supabase|OpenAI/i);
      assert.match(previewSource, /await getAccessContext/);
      assert.match(previewSource, /getLandingPageDraftExperienceState/);
      assert.match(previewSource, /LandingPageMaterializedRenderer/);
      assert.match(previewSource, /Draft/);
      assert.match(previewSource, /Não publicada/);
      assert.match(previewSource, /<p[^>]*>\s*Primeira landing page materializada\s*<\/p>/);
      assert.doesNotMatch(previewSource, /<h1[^>]*>\s*Primeira landing page materializada/);
      const readyHtml = renderToStaticMarkup(createElement(LandingPageMaterializedRenderer, { content: fixture.content }));
      assert.equal((readyHtml.match(/<h1/g) ?? []).length, 1);
    },
  },
  {
    name: "human action authorizes before the integral materialization boundary",
    run: () => {
      const actionSource = readFileSync(
        new URL("../../app/a/[account]/landing-page-actions.ts", import.meta.url),
        "utf8",
      );
      const accessIndex = actionSource.indexOf("await getAccessContext(");
      const materializationIndex = actionSource.indexOf("await materializeFirstLandingPageDraft(");
      assert.equal(accessIndex >= 0 && materializationIndex > accessIndex, true);
      assert.match(actionSource, /ctx\.role !== "owner" && ctx\.role !== "admin"/);
      assert.doesNotMatch(actionSource, /createServiceClient|\.from\(|responses\.create|fetch\(/i);
      assert.match(actionSource, /Nenhum conteúdo foi salvo/);
    },
  },
  {
    name: "operational journey exposes one pending-safe generation action or private preview",
    run: () => {
      const pageSource = readFileSync(new URL("../../app/a/[account]/page.tsx", import.meta.url), "utf8");
      const journeySource = readFileSync(
        new URL("../../app/a/[account]/_components/LandingPageDraftJourney.tsx", import.meta.url),
        "utf8",
      );
      assert.match(pageSource, /getLandingPageDraftExperienceState/);
      assert.match(pageSource, /LandingPageDraftJourney/);
      assert.match(journeySource, /experienceStatus === "empty"/);
      assert.match(journeySource, /disabled=\{pending\}/);
      assert.match(journeySource, /experienceStatus === "ready"/);
      assert.match(journeySource, /landing-pages\/\$\{props\.landingPageId\}\/preview/);
      assert.match(journeySource, /Draft/);
      assert.match(journeySource, /Não publicada/);
      assert.doesNotMatch(journeySource, /\.from\(|OpenAI|Supabase/i);
    },
  },
];

function readyDependencies(value: AccountLandingPageMaterialization | null) {
  return {
    probeReadiness: async () => ({ ok: true as const, ready: true as const, sample: null }),
    readMaterialization: async () => ({ ok: true as const, value }),
  };
}

function formInteractionContract() {
  return {
    kind: "form" as const,
    fields: [
      { fieldKey: "name", valueType: "text" as const, obligation: "required" as const, purposeKey: "contact_identity" },
      { fieldKey: "email", valueType: "email" as const, obligation: "required" as const, purposeKey: "reply_email" },
      { fieldKey: "phone", valueType: "phone" as const, obligation: "optional" as const, purposeKey: "optional_phone" },
    ],
    consent: {
      required: true as const,
      fieldKey: "privacyConsent" as const,
      purposeKey: "privacy_policy_consent",
      privacyPolicyInputFieldKey: "privacy_policy_url",
      privacyPolicyUrl: "https://example.com/privacy",
    },
    accessibility: {
      baseline: "WCAG 2.2" as const,
      labelsProgrammaticallyAssociated: true as const,
      instructionsProgrammaticallyAssociated: true as const,
      errorsProgrammaticallyAssociated: true as const,
      keyboardOperable: true as const,
      focusMovesToFirstInvalidField: true as const,
    },
    operationalBinding: {
      inputCatalogFieldKey: "primary_conversion_channel" as const,
      requiredValue: "form" as const,
    },
  };
}

function heroFormModule(): LandingPageMaterializedContentV1["modules"][number] {
  return {
    moduleKey: "hero",
    moduleVersion: 1,
    variantKey: "hero.form@v1",
    variantVersion: 1,
    fieldContractKey: "hero.form@v1",
    interactionContracts: [formInteractionContract()],
    fields: [
      { kind: "text", fieldKey: "title", value: "Receba atendimento" },
      { kind: "text", fieldKey: "subtitle", value: "Informe seus dados para validar o formulário." },
      { kind: "action", fieldKey: "primaryCta", label: "Validar dados", binding: { fieldKey: "primary_conversion_channel", channel: "form", destination: null } },
    ],
  };
}

function leadCaptureFormModule(): LandingPageMaterializedContentV1["modules"][number] {
  return {
    moduleKey: "lead_capture",
    moduleVersion: 1,
    variantKey: "lead_capture.form@v1",
    variantVersion: 1,
    fieldContractKey: "lead_capture.form@v1",
    interactionContracts: [formInteractionContract()],
    fields: [
      { kind: "text", fieldKey: "title", value: "Vamos conversar" },
      { kind: "text", fieldKey: "body", value: "Valide o formulário sem enviar dados." },
      { kind: "action", fieldKey: "primaryCta", label: "Validar contato", binding: { fieldKey: "primary_conversion_channel", channel: "form", destination: null } },
    ],
  };
}

function materializationFixture(): AccountLandingPageMaterialization {
  const root = resolveLandingPageRootParameters({ rootVersion: 1 });
  assert.equal(root.ok, true);
  const content = validateLandingPageMaterializedContentV1({
    schemaVersion: 1,
    family: "landing_page",
    root: {
      rootVersion: root.value.rootVersion,
      brandColorPalette: {
        primary: "#123456",
        secondary: "#234567",
        accent: "#345678",
        background: "#FFFFFF",
        text: "#111111",
      },
      resolvedPresetKey: root.value.resolvedPresetKey,
      resolvedPreset: root.value.resolvedPreset,
      effectiveSemanticRoles: root.value.semanticRoles,
      visualRoles: root.value.visualRoles,
      visualCriteria: root.value.visualCriteria,
    },
    modules: [
      {
        moduleKey: "hero",
        moduleVersion: 1,
        variantKey: "hero.standard@v1",
        variantVersion: 1,
        fieldContractKey: "hero.standard@v1",
        interactionContracts: [],
        fields: [
          { kind: "text", fieldKey: "title", value: "Encontre o imóvel ideal" },
          { kind: "text", fieldKey: "subtitle", value: "Atendimento direto e transparente." },
          {
            kind: "action",
            fieldKey: "primaryCta",
            label: "Fale conosco",
            binding: { fieldKey: "primary_conversion_channel", channel: "whatsapp", destination: "+55 11 99999-9999" },
          },
        ],
      },
      {
        moduleKey: "faq",
        moduleVersion: 1,
        variantKey: "faq.accordion@v1",
        variantVersion: 1,
        fieldContractKey: "faq.accordion@v1",
        interactionContracts: [{
          kind: "accordion",
          baseline: "WCAG 2.2",
          keyboardOperable: true,
          exposesExpandedState: true,
          associatesControlAndRegion: true,
          preservesFocus: true,
          initiallyCollapsed: true,
          singleExpandedItem: true,
        }],
        fields: [
          { kind: "text", fieldKey: "title", value: "Dúvidas frequentes" },
          {
            kind: "collection",
            fieldKey: "items",
            items: [
              { fields: [
                { kind: "text", fieldKey: "question", value: "Como funciona o atendimento?" },
                { kind: "text", fieldKey: "answer", value: "Conversamos para entender sua necessidade e orientar o próximo passo." },
              ] },
              { fields: [
                { kind: "text", fieldKey: "question", value: "A página já está publicada?" },
                { kind: "text", fieldKey: "answer", value: "Não. Esta é uma visualização privada em draft." },
              ] },
            ],
          },
        ],
      },
    ],
  });
  assert.equal(content.ok, true);
  const snapshot = validateLandingPageGenerationContextSnapshotV1({
    snapshotVersion: 1,
    generationContextContractVersion: 1,
    structuralIdentities: {
      planKey: "starter",
      servedTaxonId: "taxon-1",
      generationProfileId: "profile-1",
      versions: { rootVersion: 1 },
      modules: content.value.modules.map((module, order) => ({
        order,
        moduleKey: module.moduleKey,
        moduleVersion: module.moduleVersion,
        variantKey: module.variantKey,
        variantVersion: module.variantVersion,
        fieldContractKey: module.fieldContractKey,
      })),
    },
    exposedGenerationContext: {},
  });
  assert.equal(snapshot.ok, true);
  return {
    landingPageId: LANDING_PAGE_ID,
    accountId: ACCOUNT_ID,
    content: content.value,
    generationContextSnapshot: snapshot.value,
    createdBy: ACTOR_ID,
    createdAt: "2026-08-11T13:35:00.000Z",
  };
}

async function runValidationCases() {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

runValidationCases().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
