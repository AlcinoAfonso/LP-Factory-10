import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  areLandingPageOfferingScopesMateriallyEqual,
  parseLandingPageOfferingScope,
  resolveLandingPageInputCatalog,
  realEstateSegmentTaxon,
} from "../../../../lib/conversion-content/landing-page/input-catalog";
import {
  decideAccountJourney,
  deriveOfferingScopeDraft,
  isUnhandledOnboardingActionSuccess,
  journeyScopeBelongsToStep,
  onboardingFieldErrorFocusTargetId,
  parseKeywordMapDraft,
  parseNumberRangeDraft,
  prepareJourneyStoredValues,
  recoverCorrectableOnboardingSubmission,
} from "./onboarding-journey-policy";
import type { OnboardingConfigurationActionState } from "./onboarding-configuration-action-contract";
import { evaluateLandingPageCommercialIdentityMutation } from "../../../../lib/lp-builder/landingPageWorkspace";
import { resolveAccountLandingPageOnboardingConfiguration } from "../../../../lib/lp-builder/onboardingConfiguration";

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
      assert.match(component, /landing_page_offering_scope: "O que esta landing page vai divulgar\?"/);
      assert.match(component, /single: "Uma oferta"/);
      assert.match(component, /multiple: "Algumas ofertas"/);
      assert.match(component, /portfolio: "Todo o portfólio"/);
      const offeringControl = component.slice(
        component.indexOf("function OfferingScopeControl"),
        component.indexOf("function isRequired"),
      );
      assert.doesNotMatch(offeringControl, /type="radio"|landingPageOfferingScopeModes/);
      assert.match(offeringControl, /type="checkbox"/);
      assert.match(offeringControl, /checked=\{representsPortfolio\}/);
      assert.match(offeringControl, /deriveOfferingScopeDraft\(event.target.value, representsPortfolio\)/);
      assert.match(offeringControl, /deriveOfferingScopeDraft\(offerings, event.target.checked\)/);
      assert.match(offeringControl, /Esta lista representa todo o portfólio que quero divulgar nesta landing page/);
      assert.match(offeringControl, /Marque somente se a lista acima representar todo o portfólio abrangido por esta página/);
      assert.match(offeringControl, /focus-within:ring-2/);
      assert.match(offeringControl, /portfolio-hint/);
      assert.match(component, /Entrada livre: não usamos catálogo, whitelist nem derivação do resumo do negócio/);
      assert.match(offeringControl, /placeholder="Uma oferta por linha"/);
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
    name: "offering list derives modes while only portfolio requires a human declaration",
    run: () => {
      for (const [text, portfolio, mode] of [
        [" Oferta livre ", false, "single"],
        [" Oferta livre \nOutra oferta", false, "multiple"],
        [" Oferta livre ", false, "single"],
        ["Oferta livre\nOutra oferta", true, "portfolio"],
        ["Oferta editada\nOutra oferta\nMais uma", true, "portfolio"],
        ["Oferta editada", true, "portfolio"],
        ["Oferta editada", false, "single"],
        ["Oferta editada\nOutra oferta", false, "multiple"],
      ] as const) {
        const draft = deriveOfferingScopeDraft(text, portfolio);
        assert.equal(draft.mode, mode);
        assert.equal(draft.offerings.join("\n"), text);
        const parsed = parseLandingPageOfferingScope(draft);
        assert.equal(parsed.ok, true);
        assert.deepEqual(parsed.value, {
          mode,
          offerings: text.split("\n").map((item) => item.trim()),
        });
      }
    },
  },
  {
    name: "offering editing preserves raw lines and never hides empty or duplicate items from the parser",
    run: () => {
      for (const text of ["", "   ", "Oferta\n", "Oferta\n \nOutra", " Oferta \noferta"]) {
        for (const portfolio of [false, true]) {
          const draft = deriveOfferingScopeDraft(text, portfolio);
          assert.equal(draft.offerings.join("\n"), text);
          assert.equal(parseLandingPageOfferingScope(draft).ok, false);
        }
      }
      const corrected = deriveOfferingScopeDraft(" Oferta \nOutra", false);
      assert.equal(parseLandingPageOfferingScope(corrected).ok, true);
      assert.equal(areLandingPageOfferingScopesMateriallyEqual(
        corrected,
        { mode: "multiple", offerings: ["OUTRA", "oferta"] },
      ), true);
    },
  },
  {
    name: "derived modes survive canonical v6 resolution and reload without bypassing commercial identity",
    run: () => {
      const baseline = { mode: "single", offerings: ["Oferta livre"] };
      for (const [text, portfolio] of [
        [" Oferta livre ", false],
        [" Oferta livre \n Outra oferta ", false],
        [" Oferta livre \n Outra oferta ", true],
        [" Oferta livre ", true],
      ] as const) {
        const input = {
          accountId: "account-test",
          landingPageId: "landing-page-test",
          catalogVersion: 6,
          revision: 3,
          planKey: "starter",
          taxonChain: { segment: realEstateSegmentTaxon },
          storedValues: {
            landing_page_offering_scope: {
              scope: "landing_page" as const,
              value: deriveOfferingScopeDraft(text, portfolio),
            },
          },
          authoritativeValues: {},
        };
        const resolved = resolveAccountLandingPageOnboardingConfiguration(input);
        assert.equal(resolved.ok, true);
        const storedValues = resolved.configuration.storedValues;
        assert.deepEqual(storedValues.landing_page_offering_scope.value, {
          mode: portfolio ? "portfolio" : text.includes("\n") ? "multiple" : "single",
          offerings: text.split("\n").map((item) => item.trim()),
        });
        const reloaded = resolveAccountLandingPageOnboardingConfiguration({
          ...input,
          storedValues: JSON.parse(JSON.stringify(storedValues)),
        });
        assert.equal(reloaded.ok, true);
        assert.deepEqual(reloaded.configuration.storedValues, storedValues);
        const identityInput = {
          generationContextSnapshots: [{
            generationContext: {
              modelContext: {
                facts: [{ fieldKey: "landing_page_offering_scope", value: baseline }],
              },
            },
          }],
          currentConfiguredOfferingScope: baseline,
          values: storedValues,
          sameCommercialWorkConfirmed: false,
        };
        assert.deepEqual(evaluateLandingPageCommercialIdentityMutation(identityInput),
          portfolio || text.includes("\n")
            ? { ok: false, error: "offer_change_confirmation_required", fieldKey: "landing_page_offering_scope" }
            : { ok: true },
        );
        assert.deepEqual(evaluateLandingPageCommercialIdentityMutation({
          ...identityInput,
          sameCommercialWorkConfirmed: true,
        }), { ok: true });
      }
    },
  },
  {
    name: "offering errors preserve state and focus invalid values separately from missing confirmation",
    run: () => {
      const submittedValues = {
        funnel_stage: { scope: "landing_page" as const, value: "bofu" },
        primary_conversion_channel: {
          scope: "landing_page" as const,
          value: "whatsapp",
        },
        whatsapp_destination: {
          scope: "landing_page" as const,
          value: "+5511999999999",
        },
        primary_conversion_goal: {
          scope: "landing_page" as const,
          value: "contact",
        },
        transaction_intent: {
          scope: "landing_page" as const,
          value: "buy",
        },
        landing_page_offering_scope: {
          scope: "landing_page" as const,
          value: {
            mode: "single",
            offerings: ["Oferta livre", "  oferta livre  "],
          },
        },
      };
      const invalidScope = parseLandingPageOfferingScope(
        submittedValues.landing_page_offering_scope.value,
      );
      assert.equal(invalidScope.ok, false);

      const recovered = recoverCorrectableOnboardingSubmission({
        status: "error",
        fieldErrors: {
          landing_page_offering_scope: "Revise este valor antes de continuar.",
        },
        submittedValues,
        submittedRevision: 3,
        submittedSharedRevision: 2,
      });
      assert.deepEqual(recovered, {
        values: submittedValues,
        revision: 3,
        sharedRevision: 2,
      });
      assert.equal(
        recoverCorrectableOnboardingSubmission({
          status: "error",
          formError: "A configuração mudou em outra sessão. Recarregue a página.",
        }),
        null,
      );
      assert.equal(
        onboardingFieldErrorFocusTargetId("landing_page_offering_scope"),
        "onboarding-landing_page_offering_scope-offerings",
      );
      assert.equal(
        onboardingFieldErrorFocusTargetId("same_commercial_work_confirmed"),
        "onboarding-same_commercial_work_confirmed",
      );

      const correctedScope = parseLandingPageOfferingScope({
        mode: "single",
        offerings: [" Oferta livre "],
      });
      assert.deepEqual(correctedScope, {
        ok: true,
        value: { mode: "single", offerings: ["Oferta livre"] },
      });

      const component = readFileSync(
        new URL("./OnboardingConfigurationJourney.tsx", import.meta.url),
        "utf8",
      );
      const sharedAction = readFileSync(
        new URL("../onboarding-configuration-actions.ts", import.meta.url),
        "utf8",
      );
      const workspaceAction = readFileSync(
        new URL("../landing-pages/[landingPageId]/configuration-actions.ts", import.meta.url),
        "utf8",
      );
      assert.match(component, /recoverCorrectableOnboardingSubmission\(actionState\)/);
      assert.match(component, /requestAnimationFrame\(\(\) =>/);
      assert.match(component, /onboardingFieldErrorFocusTargetId\(firstFieldKey\)/);
      assert.match(sharedAction, /submittedValues: values,[\s\S]+submittedRevision: expectedRevision/);
      assert.match(
        workspaceAction,
        /submittedValues: values,[\s\S]+submittedRevision: expectedLandingPageRevision,[\s\S]+submittedSharedRevision: expectedSharedRevision/,
      );
      assert.match(
        workspaceAction,
        /offer_change_confirmation_required[\s\S]+fieldErrors: \{[\s\S]+same_commercial_work_confirmed:/,
      );
      assert.match(
        workspaceAction,
        /invalid_values[\s\S]+fieldErrors: \{ \[result\.fieldKey\]: "Revise este valor antes de continuar\." \}/,
      );
      assert.match(component, /id="onboarding-same_commercial_work_confirmed"/);
      assert.match(
        component,
        /aria-describedby=\{[\s\S]+onboarding-same_commercial_work_confirmed-error/,
      );
      assert.match(component, /id="onboarding-same_commercial_work_confirmed-error"/);
    },
  },
  {
    name: "each success result is handled once even when a workspace no-op preserves revisions",
    run: () => {
      const firstWorkspaceSuccess = {
        status: "success" as const,
        intent: "next" as const,
        revision: 3,
        sharedRevision: 2,
      };
      let lastHandled: OnboardingConfigurationActionState | null = null;
      assert.equal(
        isUnhandledOnboardingActionSuccess(
          firstWorkspaceSuccess,
          lastHandled,
        ),
        true,
      );
      lastHandled = firstWorkspaceSuccess;
      assert.equal(
        isUnhandledOnboardingActionSuccess(
          firstWorkspaceSuccess,
          lastHandled,
        ),
        false,
      );

      const recovered = recoverCorrectableOnboardingSubmission({
        status: "error",
        fieldErrors: {
          landing_page_offering_scope: "Revise este valor antes de continuar.",
        },
        submittedValues: {
          landing_page_offering_scope: {
            scope: "landing_page",
            value: {
              mode: "single",
              offerings: ["Oferta duplicada", " oferta DUPLICADA "],
            },
          },
        },
        submittedRevision: 3,
        submittedSharedRevision: 2,
      });
      assert.equal(recovered?.revision, 3);
      assert.equal(recovered?.sharedRevision, 2);

      const correctedScope = parseLandingPageOfferingScope({
        mode: "single",
        offerings: ["  Assessoria para compra do primeiro imóvel  "],
      });
      assert.deepEqual(correctedScope, {
        ok: true,
        value: {
          mode: "single",
          offerings: ["Assessoria para compra do primeiro imóvel"],
        },
      });

      const correctedNoOpSuccess = {
        status: "success" as const,
        intent: "next" as const,
        revision: 3,
        sharedRevision: 2,
      };
      assert.equal(
        isUnhandledOnboardingActionSuccess(
          correctedNoOpSuccess,
          lastHandled,
        ),
        true,
      );
      lastHandled = correctedNoOpSuccess;
      assert.equal(
        isUnhandledOnboardingActionSuccess(
          correctedNoOpSuccess,
          lastHandled,
        ),
        false,
      );
      const e192Success = {
        status: "success" as const,
        intent: "next" as const,
        revision: 4,
      };
      assert.equal(
        isUnhandledOnboardingActionSuccess(e192Success, lastHandled),
        true,
      );

      const component = readFileSync(
        new URL("./OnboardingConfigurationJourney.tsx", import.meta.url),
        "utf8",
      );
      assert.match(component, /lastHandledSuccess/);
      assert.match(component, /isUnhandledOnboardingActionSuccess\(/);
      assert.doesNotMatch(component, /lastHandledRevision/);
    },
  },
  {
    name: "journey disables every editable control while the form action is pending",
    run: () => {
      const component = readFileSync(
        new URL("./OnboardingConfigurationJourney.tsx", import.meta.url),
        "utf8",
      );
      const pendingControlsStart = component.indexOf("<fieldset disabled={pending}");
      const pendingControlsEnd = component.indexOf("</fieldset>", pendingControlsStart);
      assert.ok(pendingControlsStart >= 0);
      assert.ok(pendingControlsEnd > pendingControlsStart);
      const pendingControls = component.slice(pendingControlsStart, pendingControlsEnd);
      assert.match(pendingControls, /<BrandIdentityStep/);
      assert.match(pendingControls, /<OnboardingField/);
      assert.match(pendingControls, /name="same_commercial_work_confirmed"/);
      assert.ok(component.indexOf('name="values_json"') < pendingControlsStart);
      assert.ok(component.indexOf('disabled={pending}', pendingControlsEnd) > pendingControlsEnd);
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
