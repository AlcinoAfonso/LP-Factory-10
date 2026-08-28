import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  resolveLandingPageInputCatalog,
  realEstateSegmentTaxon,
} from "../../../../lib/conversion-content/landing-page/input-catalog";
import {
  decideAccountJourney,
  journeyScopeBelongsToStep,
  parseKeywordMapDraft,
  parseNumberRangeDraft,
  prepareJourneyStoredValues,
} from "./onboarding-journey-policy";

const cases: readonly Readonly<{ name: string; run: () => void }>[] = [
  {
    name: "account without entitlement stays in the commercial experience",
    run: () => {
      assert.deepEqual(
        decideAccountJourney({
          actorRole: "owner",
          isCommerciallyEligible: false,
          onboardingState: "not_loaded",
        }),
        { mode: "commercial", showFinancialActions: true },
      );
      assert.deepEqual(
        decideAccountJourney({
          actorRole: "admin",
          isCommerciallyEligible: false,
          onboardingState: "not_loaded",
        }),
        { mode: "waiting", showFinancialActions: false },
      );
    },
  },
  {
    name: "eligible owner or admin follows incomplete review and bound states",
    run: () => {
      for (const actorRole of ["owner", "admin"] as const) {
        assert.equal(
          decideAccountJourney({
            actorRole,
            isCommerciallyEligible: true,
            onboardingState: "incomplete",
          }).mode,
          "onboarding",
        );
        assert.equal(
          decideAccountJourney({
            actorRole,
            isCommerciallyEligible: true,
            onboardingState: "complete_unbound",
          }).mode,
          "review",
        );
        assert.equal(
          decideAccountJourney({
            actorRole,
            isCommerciallyEligible: true,
            onboardingState: "complete_bound",
          }).mode,
          "operational",
        );
      }
    },
  },
  {
    name: "migration-unavailable state preserves the previous commercial surface",
    run: () => {
      assert.deepEqual(
        decideAccountJourney({
          actorRole: "owner",
          isCommerciallyEligible: true,
          onboardingState: "unavailable",
        }),
        { mode: "commercial", showFinancialActions: false },
      );
    },
  },
  {
    name: "unauthorized role and authoritative failures remain blocked",
    run: () => {
      for (const actorRole of ["editor", "viewer"] as const) {
        assert.equal(
          decideAccountJourney({
            actorRole,
            isCommerciallyEligible: true,
            onboardingState: "incomplete",
          }).mode,
          "blocked",
        );
      }
      assert.equal(
        decideAccountJourney({
          actorRole: "owner",
          isCommerciallyEligible: true,
          onboardingState: "blocked",
        }).mode,
        "blocked",
      );
    },
  },
  {
    name: "journey keeps persistence in the boundary and exposes accessible resume controls",
    run: () => {
      const component = readFileSync(
        new URL("./OnboardingConfigurationJourney.tsx", import.meta.url),
        "utf8",
      );
      const action = readFileSync(
        new URL("../onboarding-configuration-actions.ts", import.meta.url),
        "utf8",
      );

      assert.match(component, /name="intent"[\s\S]+value="exit"/);
      assert.match(component, /value="back"/);
      assert.match(component, /Avançar e salvar/);
      assert.match(component, /aria-describedby/);
      assert.match(component, /aria-invalid/);
      assert.match(component, /aria-required/);
      assert.match(component, /<fieldset/);
      assert.match(component, /field\.purpose/);
      assert.match(component, /landing_page_offering_scope: "Escopo comercial da página"/);
      assert.match(component, /single: "Uma oferta"/);
      assert.match(component, /multiple: "Algumas ofertas"/);
      assert.match(component, /portfolio: "Todo o portfólio"/);
      assert.match(component, /type="radio"/);
      assert.match(component, /Entrada livre: não usamos catálogo, whitelist nem derivação do resumo do negócio/);
      assert.match(component, /\.split\("\\n"\)/);
      assert.match(component, /same_commercial_work_confirmed/);
      assert.doesNotMatch(component, /name="catalog_version"/);
      assert.match(component, /humanizeFieldKey/);
      assert.doesNotMatch(component, /\.from\(/);
      assert.match(action, /saveAccountLandingPageOnboardingConfiguration/);
      assert.match(action, /getAccessContext/);
      assert.match(action, /revalidatePath\(route\)/);
      assert.doesNotMatch(action, /\.from\(/);
    },
  },
  {
    name: "completion review keeps draft discovery and mutation inside lp-builder boundaries",
    run: () => {
      const component = readFileSync(
        new URL("./OnboardingCompletionJourney.tsx", import.meta.url),
        "utf8",
      );
      const action = readFileSync(
        new URL("../onboarding-configuration-actions.ts", import.meta.url),
        "utf8",
      );
      const page = readFileSync(new URL("../page.tsx", import.meta.url), "utf8");
      const journey = readFileSync(
        new URL("./OnboardingConfigurationJourney.tsx", import.meta.url),
        "utf8",
      );

      assert.match(page, /listAccountLandingPageDrafts/);
      assert.match(page, /complete_unbound/);
      assert.match(page, /complete_bound/);
      assert.doesNotMatch(page, /\.from\(/);
      assert.match(component, /props\.drafts\.length === 0/);
      assert.match(component, /type="radio"/);
      assert.match(component, /name="landing_page_id"/);
      assert.match(component, /Nenhum novo rascunho será criado/);
      assert.match(component, /edit_onboarding=1/);
      assert.match(component, /Editar dados confirmados ou opcionais/);
      assert.doesNotMatch(component, /defaultChecked|checked=\{true\}/);
      assert.doesNotMatch(component, /\.from\(/);
      assert.match(page, /editOnboarding/);
      assert.match(page, /reviewMode/);
      assert.match(journey, /Voltar à revisão/);
      assert.match(journey, /brand_logo_asset: "Logo da marca"/);
      assert.match(journey, /business_offerings_summary: "O que seu negócio oferece"/);
      assert.match(journey, /primary_conversion_goal: "Objetivo principal da página"/);
      assert.match(journey, /rent: "Locação"/);
      for (const [technicalToken, friendlyLabel] of [
        ["contact", "Entrar em contato"],
        ["schedule", "Agendar"],
        ["request_quote", "Solicitar orçamento"],
        ["purchase", "Comprar"],
        ["register_interest", "Demonstrar interesse"],
      ]) {
        assert.match(
          journey,
          new RegExp(`${technicalToken}: "${friendlyLabel}"`),
        );
      }
      assert.match(journey, /OPTION_LABELS\[value\] \?\? value/);
      assert.match(journey, /OPTION_LABELS\[item\] \?\? item/);
      assert.match(
        journey,
        /function optionLabel\(option: string\)[\s\S]+OPTION_LABELS\[option\]/,
      );
      assert.match(action, /getAccountLandingPageOnboardingConfiguration/);
      assert.match(action, /listAccountLandingPageDrafts/);
      assert.match(action, /drafts\.drafts\.length > 0/);
      assert.match(action, /createAccountLandingPage/);
      assert.match(action, /bindAccountLandingPageOnboardingConfiguration/);
      assert.doesNotMatch(action, /\.from\(/);
      assert.doesNotMatch(
        component + action,
        /\bOpenAI\b|generateContent|publishLandingPage|\bCRM\b/i,
      );
    },
  },
  {
    name: "invalid hidden conditional value is omitted while a valid one is preserved",
    run: () => {
      const catalog = resolveLandingPageInputCatalog({
        version: 2,
        plan: "starter",
        taxonChain: { segment: realEstateSegmentTaxon },
      });
      assert.equal(catalog.ok, true);
      const base = {
        whatsapp_destination: {
          scope: "landing_page" as const,
          value: "telefone-invalido",
        },
      };
      const hiddenInvalid = prepareJourneyStoredValues({
        fields: catalog.value.fields,
        storedValues: base,
        effectiveValues: { primary_conversion_channel: "email" },
      });
      assert.deepEqual(hiddenInvalid, {});

      const hiddenValid = prepareJourneyStoredValues({
        fields: catalog.value.fields,
        storedValues: {
          whatsapp_destination: {
            scope: "landing_page",
            value: "+5511999999999",
          },
        },
        effectiveValues: { primary_conversion_channel: "email" },
      });
      assert.equal(
        hiddenValid.whatsapp_destination?.value,
        "+5511999999999",
      );
    },
  },
  {
    name: "keyword map draft remains incremental until it becomes valid",
    run: () => {
      assert.deepEqual(parseKeywordMapDraft("termo |"), [
        { keyword_or_cluster: "termo", message_anchor: "" },
      ]);
      assert.deepEqual(parseKeywordMapDraft("termo | mensagem"), [
        { keyword_or_cluster: "termo", message_anchor: "mensagem" },
      ]);
    },
  },
  {
    name: "optional number range can return completely to absence",
    run: () => {
      assert.deepEqual(parseNumberRangeDraft("100", "200"), {
        minimum: 100,
        maximum: 200,
        currency: "BRL",
      });
      assert.equal(parseNumberRangeDraft("", ""), undefined);
    },
  },
  {
    name: "brand step offers palette confirmation without logo upload or asset persistence",
    run: () => {
      const catalog = resolveLandingPageInputCatalog({
        version: 2,
        plan: "starter",
        taxonChain: { segment: realEstateSegmentTaxon },
      });
      assert.equal(catalog.ok, true);
      const prepared = prepareJourneyStoredValues({
        fields: catalog.value.fields,
        storedValues: {
          brand_logo_asset: {
            scope: "business",
            value: { asset_id: "asset-existente" },
          },
        },
        effectiveValues: {},
      });
      assert.deepEqual(prepared, {});

      const component = readFileSync(
        new URL("./OnboardingConfigurationJourney.tsx", import.meta.url),
        "utf8",
      );
      assert.match(component, /Identidade visual/);
      assert.match(component, /type="color"/);
      assert.match(component, /validateStarterColorPalette/);
      assert.match(component, /Você pode continuar sem logo/);
      assert.doesNotMatch(component, /type="file"/);
      assert.doesNotMatch(component, /upload/i);
    },
  },
  {
    name: "brand step never repeats business campaign or landing-page fields",
    run: () => {
      for (const scope of [
        "account",
        "business",
        "offer",
        "campaign",
        "landing_page",
      ] as const) {
        assert.equal(journeyScopeBelongsToStep("brand_identity", scope), false);
      }
      assert.equal(
        journeyScopeBelongsToStep("landing_page", "campaign"),
        true,
      );
      assert.equal(
        journeyScopeBelongsToStep("landing_page", "landing_page"),
        true,
      );
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}
