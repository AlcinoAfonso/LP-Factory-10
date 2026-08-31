import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { createElement, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

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

      const loader = readFileSync(new URL("../account-journey-loader.ts", import.meta.url), "utf8");
      assert.match(loader, /listAccountLandingPageDrafts/);
      assert.match(loader, /complete_unbound/);
      assert.match(loader, /complete_bound/);
      assert.doesNotMatch(loader, /\.from\(/);
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

// Integral executable page from fcafbab250eba48ce1df1538a1f220b25ef9b52e.
// Git blob 18cadc73ea71aadbd67e6506de7143e8d0a21cd7; captured before extraction.
// Frozen independently: never reconstructed from candidate logic or fixtures.
const originalPageSource = [
  "import { getAccessContext } from \"@/lib/access/getAccessContext\";",
  "import { getCommercialActivationHierarchicalBundle } from \"@/conversion-content\";",
  "import { getCommercialEntitlementSignal } from \"../../../lib/commercial-entitlements\";",
  "import {",
  "  getAccountLandingPageOnboardingConfiguration,",
  "  isLandingPageWorkspaceEnabled,",
  "  listAccountLandingPageDrafts,",
  "  listAccountLandingPageWorkspace,",
  "  type AccountLandingPage,",
  "  type AccountLandingPageOnboardingConfiguration,",
  "} from \"../../../lib/lp-builder\";",
  "import { getActionableNicheResolutionForAccount } from \"../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter\";",
  "import { getActivePrimaryAccountTaxon } from \"../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter\";",
  "import { PendingSetupFirstSteps } from \"./_components/PendingSetupFirstSteps\";",
  "import { NicheResolutionCard } from \"./_components/NicheResolutionCard\";",
  "import { OnboardingConfigurationJourney } from \"./_components/OnboardingConfigurationJourney\";",
  "import { OnboardingCompletionJourney } from \"./_components/OnboardingCompletionJourney\";",
  "import { LandingPageWorkspace } from \"./_components/LandingPageWorkspace\";",
  "import { GenericCommercialPage } from \"./_components/commercial-page/GenericCommercialPage\";",
  "import { PublishedCommercialActivationPage } from \"./_components/commercial-page/PublishedCommercialActivationPage\";",
  "import {",
  "  decideAccountJourney,",
  "  type AccountOnboardingState,",
  "} from \"./_components/onboarding-journey-policy\";",
  "",
  "type DashState = \"auth\" | \"onboarding\" | \"public\";",
  "",
  "type PageProps = {",
  "  params: Promise<{ account: string }> | { account: string };",
  "  searchParams?:",
  "    | Promise<Record<string, string | string[] | undefined>>",
  "    | Record<string, string | string[] | undefined>;",
  "};",
  "",
  "export default async function Page({ params, searchParams }: PageProps) {",
  "  const resolvedParams = await params;",
  "  const resolvedSearchParams = searchParams ? await searchParams : {};",
  "  const accountSubdomain = (resolvedParams.account ?? \"\").trim().toLowerCase();",
  "  const editOnboarding = resolvedSearchParams.edit_onboarding === \"1\";",
  "",
  "  const isHome = accountSubdomain === \"home\";",
  "  const ctx = isHome",
  "    ? null",
  "    : await getAccessContext({",
  "        params: { account: accountSubdomain },",
  "        route: `/a/${accountSubdomain}`,",
  "      });",
  "  const hasCtx = Boolean(ctx?.account || ctx?.member);",
  "",
  "  const state: DashState = (() => {",
  "    if (isHome && !hasCtx) return \"onboarding\";",
  "    if (hasCtx) return \"auth\";",
  "    return \"public\";",
  "  })();",
  "",
  "  if (state === \"auth\") {",
  "    const accountStatus = (ctx?.account?.status ?? null) as",
  "      | \"pending_setup\"",
  "      | \"active\"",
  "      | \"inactive\"",
  "      | \"suspended\"",
  "      | null;",
  "",
  "    if (accountStatus === \"pending_setup\") {",
  "      return <PendingSetupFirstSteps accountSubdomain={accountSubdomain} ctx={ctx} />;",
  "    }",
  "",
  "    if (accountStatus !== \"active\") {",
  "      return (",
  "        <main className=\"mx-auto max-w-5xl px-6 py-10\">",
  "          <section className=\"rounded-xl border bg-white p-6 shadow-sm\">",
  "            <h1 className=\"text-2xl font-semibold\">Dashboard</h1>",
  "            <p className=\"mt-2 text-sm text-gray-600\">",
  "              Esta conta não está disponível para exibir a página comercial.",
  "            </p>",
  "          </section>",
  "        </main>",
  "      );",
  "    }",
  "",
  "    const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;",
  "    const [commercialEntitlement, nicheResolution, primaryTaxon] = accountId",
  "      ? await Promise.all([",
  "          getCommercialEntitlementSignal({ accountId }),",
  "          getActionableNicheResolutionForAccount({ accountId, accountStatus }),",
  "          getActivePrimaryAccountTaxon({ accountId }),",
  "        ])",
  "      : [null, null, null];",
  "    const actorRole = ctx?.role ?? \"viewer\";",
  "    const isCommerciallyEligible =",
  "      commercialEntitlement?.isCommerciallyEligible === true;",
  "    const workspace =",
  "      accountId && isCommerciallyEligible && isLandingPageWorkspaceEnabled()",
  "        ? await listAccountLandingPageWorkspace({",
  "            accountId,",
  "            cursor:",
  "              typeof resolvedSearchParams.workspace_cursor === \"string\"",
  "                ? resolvedSearchParams.workspace_cursor",
  "                : undefined,",
  "          })",
  "        : null;",
  "    if (",
  "      workspace?.ok &&",
  "      actorRole !== \"owner\" &&",
  "      actorRole !== \"admin\"",
  "    ) {",
  "      return (",
  "        <LandingPageWorkspace",
  "          accountSubdomain={accountSubdomain}",
  "          workspace={workspace}",
  "          error={",
  "            typeof resolvedSearchParams.workspace_error === \"string\"",
  "              ? resolvedSearchParams.workspace_error",
  "              : undefined",
  "          }",
  "        />",
  "      );",
  "    }",
  "    let onboardingState: AccountOnboardingState = \"not_loaded\";",
  "    let onboardingConfiguration: AccountLandingPageOnboardingConfiguration | null =",
  "      null;",
  "    let onboardingDrafts: readonly AccountLandingPage[] | null = null;",
  "",
  "    if (",
  "      accountId &&",
  "      isCommerciallyEligible &&",
  "      (actorRole === \"owner\" || actorRole === \"admin\")",
  "    ) {",
  "      const onboardingResult =",
  "        await getAccountLandingPageOnboardingConfiguration({ accountId });",
  "      if (onboardingResult.ok) {",
  "        onboardingConfiguration = onboardingResult.configuration;",
  "        if (!onboardingResult.configuration.complete) {",
  "          onboardingState = \"incomplete\";",
  "        } else if (onboardingResult.configuration.landingPageId) {",
  "          onboardingState = \"complete_bound\";",
  "        } else {",
  "          const draftsResult = await listAccountLandingPageDrafts({ accountId });",
  "          if (draftsResult.ok) {",
  "            onboardingDrafts = draftsResult.drafts;",
  "            onboardingState = \"complete_unbound\";",
  "          } else {",
  "            onboardingState = \"blocked\";",
  "          }",
  "        }",
  "      } else {",
  "        onboardingState =",
  "          onboardingResult.error === \"configuration_unavailable\"",
  "            ? \"unavailable\"",
  "            : \"blocked\";",
  "      }",
  "    } else if (isCommerciallyEligible) {",
  "      onboardingState = \"blocked\";",
  "    }",
  "",
  "    const accountJourney = decideAccountJourney({",
  "      actorRole,",
  "      isCommerciallyEligible,",
  "      onboardingState,",
  "    });",
  "",
  "    if (accountJourney.mode === \"waiting\") {",
  "      return <CommercialWaitingState />;",
  "    }",
  "    if (accountJourney.mode === \"onboarding\" && onboardingConfiguration) {",
  "      return (",
  "        <OnboardingConfigurationJourney",
  "          accountSubdomain={accountSubdomain}",
  "          configuration={onboardingConfiguration}",
  "        />",
  "      );",
  "    }",
  "    if (",
  "      accountJourney.mode === \"review\" &&",
  "      onboardingConfiguration &&",
  "      onboardingDrafts",
  "    ) {",
  "      if (editOnboarding) {",
  "        return (",
  "          <OnboardingConfigurationJourney",
  "            accountSubdomain={accountSubdomain}",
  "            configuration={onboardingConfiguration}",
  "            reviewMode",
  "          />",
  "        );",
  "      }",
  "      return (",
  "        <OnboardingCompletionJourney",
  "          accountSubdomain={accountSubdomain}",
  "          configuration={onboardingConfiguration}",
  "          drafts={onboardingDrafts}",
  "        />",
  "      );",
  "    }",
  "    if (accountJourney.mode === \"operational\") {",
  "      if (!accountId || !onboardingConfiguration?.landingPageId) {",
  "        return <OnboardingBlockedState />;",
  "      }",
  "      if (!isLandingPageWorkspaceEnabled()) return <WorkspaceRolloutPendingState />;",
  "      if (!workspace?.ok) return <WorkspaceUnavailableState />;",
  "      return (",
  "        <LandingPageWorkspace",
  "          accountSubdomain={accountSubdomain}",
  "          workspace={workspace}",
  "          error={",
  "            typeof resolvedSearchParams.workspace_error === \"string\"",
  "              ? resolvedSearchParams.workspace_error",
  "              : undefined",
  "          }",
  "        />",
  "      );",
  "    }",
  "    if (accountJourney.mode === \"blocked\") {",
  "      return <OnboardingBlockedState />;",
  "    }",
  "",
  "    const commercialActivation = primaryTaxon",
  "      ? await getCommercialActivationHierarchicalBundle({",
  "          taxonId: primaryTaxon.taxonId,",
  "        })",
  "      : null;",
  "    const commercialPage =",
  "      commercialActivation?.status === \"ready\" && commercialActivation.bundle ? (",
  "        <PublishedCommercialActivationPage",
  "          accountSubdomain={accountSubdomain}",
  "          bundle={commercialActivation.bundle}",
  "          showFinancialActions={accountJourney.showFinancialActions}",
  "        />",
  "      ) : (",
  "        <GenericCommercialPage",
  "          accountSubdomain={accountSubdomain}",
  "          showFinancialActions={accountJourney.showFinancialActions}",
  "        />",
  "      );",
  "",
  "    return (",
  "      <main className=\"mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10\">",
  "        <div className=\"space-y-6\">",
  "          {nicheResolution ? (",
  "            <NicheResolutionCard",
  "              accountSubdomain={accountSubdomain}",
  "              resolution={nicheResolution}",
  "            />",
  "          ) : null}",
  "",
  "          {commercialPage}",
  "        </div>",
  "      </main>",
  "    );",
  "  }",
  "",
  "  if (state === \"onboarding\") {",
  "    return <DashboardOnboarding />;",
  "  }",
  "",
  "  return <DashboardPublic />;",
  "}",
  "",
  "function OnboardingBlockedState() {",
  "  return (",
  "    <main className=\"mx-auto flex min-h-[60vh] max-w-5xl items-center px-4 py-10 sm:px-6\">",
  "      <section className=\"w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card sm:p-10\">",
  "        <p className=\"text-sm font-semibold uppercase tracking-[0.16em] text-amber-800\">",
  "          Configuração indisponível",
  "        </p>",
  "        <h1 className=\"mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl\">",
  "          A conta precisa de uma revisão antes de continuar.",
  "        </h1>",
  "        <p className=\"mt-4 max-w-2xl text-sm leading-6 text-graytech-700 sm:text-base\">",
  "          Somente o proprietário ou um administrador ativo pode concluir esta configuração. Se você já tem esse acesso, confirme os dados da conta e tente novamente.",
  "        </p>",
  "      </section>",
  "    </main>",
  "  );",
  "}",
  "",
  "function WorkspaceUnavailableState() {",
  "  return (",
  "    <main className=\"mx-auto flex min-h-[60vh] max-w-5xl items-center px-4 py-10 sm:px-6\">",
  "      <section className=\"w-full rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-10\">",
  "        <p className=\"text-sm font-semibold uppercase tracking-[0.16em] text-brand-700\">",
  "          Workspace indisponível",
  "        </p>",
  "        <h1 className=\"mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl\">",
  "          A configuração operacional não pôde ser carregada.",
  "        </h1>",
  "        <p className=\"mt-4 max-w-2xl text-sm leading-6 text-graytech-700 sm:text-base\">",
  "          Nenhuma coleção parcial foi exibida e nenhuma configuração, revisão ou aprovação foi alterada. Tente novamente após confirmar o rollout do ambiente.",
  "        </p>",
  "      </section>",
  "    </main>",
  "  );",
  "}",
  "",
  "function WorkspaceRolloutPendingState() {",
  "  return (",
  "    <main className=\"mx-auto flex min-h-[60vh] max-w-5xl items-center px-4 py-10 sm:px-6\">",
  "      <section className=\"w-full rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-10\">",
  "        <p className=\"text-sm font-semibold uppercase tracking-[0.16em] text-brand-700\">",
  "          Configuração concluída",
  "        </p>",
  "        <h1 className=\"mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl\">",
  "          Sua conta está vinculada a uma landing page em rascunho.",
  "        </h1>",
  "        <p className=\"mt-4 max-w-2xl text-sm leading-6 text-graytech-700 sm:text-base\">",
  "          A próxima etapa de geração está temporariamente indisponível enquanto o novo fluxo é validado. Nenhuma geração, materialização ou visualização será iniciada nesta tela.",
  "        </p>",
  "      </section>",
  "    </main>",
  "  );",
  "}",
  "",
  "function CommercialWaitingState() {",
  "  return (",
  "    <main className=\"mx-auto flex min-h-[60vh] max-w-5xl items-center px-4 py-10 sm:px-6\">",
  "      <section className=\"w-full rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-10\">",
  "        <p className=\"text-sm font-semibold uppercase tracking-[0.16em] text-brand-700\">",
  "          Ativação comercial",
  "        </p>",
  "        <h1 className=\"mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl\">",
  "          Esta conta aguarda ativação comercial pelo proprietário.",
  "        </h1>",
  "        <p className=\"mt-4 max-w-2xl text-sm leading-6 text-graytech-600 sm:text-base\">",
  "          O proprietário da conta pode concluir a contratação. Seus acessos existentes permanecem disponíveis.",
  "        </p>",
  "      </section>",
  "    </main>",
  "  );",
  "}",
  "",
  "function DashboardOnboarding() {",
  "  return (",
  "    <main className=\"mx-auto max-w-5xl px-6 py-10\">",
  "      <div className=\"space-y-2\">",
  "        <h1 className=\"text-2xl font-semibold\">Onboarding</h1>",
  "        <p className=\"text-sm text-gray-600\">Faca login ou crie sua conta para continuar.</p>",
  "      </div>",
  "    </main>",
  "  );",
  "}",
  "",
  "function DashboardPublic() {",
  "  return (",
  "    <main className=\"mx-auto max-w-5xl px-6 py-10\">",
  "      <div className=\"space-y-2\">",
  "        <h1 className=\"text-2xl font-semibold\">LP Factory</h1>",
  "        <p className=\"text-sm text-gray-600\">Acesse sua conta ou visite a home publica.</p>",
  "      </div>",
  "    </main>",
  "  );",
  "}",
  "",
].join("\n");

assert.equal(createHash("sha256").update(originalPageSource).digest("hex"),
  "ba69d812a5da84ca63787a477a3afaee5793c45a64228f4d33f0622577a3c9a9");
const candidatePageSource = readFileSync(new URL("../page.tsx", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const loaderSource = readFileSync(new URL("../account-journey-loader.ts", import.meta.url), "utf8").replace(/\r\n/g, "\n");
assert.notEqual(candidatePageSource, originalPageSource);
assert.equal(candidatePageSource.slice(candidatePageSource.indexOf("function OnboardingBlockedState")),
  originalPageSource.slice(originalPageSource.indexOf("function OnboardingBlockedState")), "all local JSX helpers unchanged");
assert.equal(candidatePageSource.slice(candidatePageSource.indexOf("type PageProps"), candidatePageSource.indexOf("  const journey =")),
  originalPageSource.slice(originalPageSource.indexOf("type PageProps"), originalPageSource.indexOf("  const isHome")), "params and search normalization unchanged");
assert.match(loaderSource, /^import "server-only";/);
assert.doesNotMatch(loaderSource, /from ["']react|<\w+\s|\.from\(|createClient|cache\(/);
assert.doesNotMatch(candidatePageSource, /getAccessContext|getCommercialEntitlementSignal|decideAccountJourney|listAccountLandingPage|from .*lib\//);

// These are shared opaque identities, not replacements for the page, loader or policy.
// Client interactions are outside this render/props harness; unchanged leaf sources are verified by the scoped diff.
const leafNames = ["PendingSetupFirstSteps", "NicheResolutionCard", "OnboardingConfigurationJourney",
  "OnboardingCompletionJourney", "LandingPageWorkspace", "GenericCommercialPage", "PublishedCommercialActivationPage"];
const leaves = new Map(leafNames.map(name => [name, function OpaqueLeaf() {
  return createElement("div", { "data-aa09-leaf": name });
}]));
const leafImports = (source: string) => source.split("\n").filter(line =>
  line.startsWith("import {") && leafNames.some(name => line.includes("{ " + name + " }")));
assert.deepEqual(leafImports(candidatePageSource), leafImports(originalPageSource), "same component module/export identities");
const requireValidation = createRequire(import.meta.url);
function compile(source: string) {
  return new Function("require", "module", "exports", ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText) as (require: (id: string) => unknown, module: { exports: Record<string, unknown> }, exports: Record<string, unknown>) => void;
}
const originalExecutable = compile(originalPageSource);
const candidateExecutable = compile(candidatePageSource);
const loaderExecutable = compile(loaderSource);
type Scenario = {
  name: string; ctx?: unknown; account?: unknown; search?: Record<string, unknown>; promised?: boolean;
  entitlement?: unknown; flags?: boolean[]; workspace?: unknown; onboarding?: unknown; drafts?: unknown;
  niche?: unknown; taxon?: unknown; activation?: unknown; fail?: string; flagFailAt?: number;
  resolveOrder?: string[];
};
const parallelReads = ["entitlement", "niche", "taxon"];
const syntheticConfigurationResult = resolveAccountLandingPageOnboardingConfiguration({
  accountId: "account-test", landingPageId: null, catalogVersion: 6, revision: 3, planKey: "starter",
  taxonChain: { segment: realEstateSegmentTaxon }, storedValues: {}, authoritativeValues: {},
});
assert.equal(syntheticConfigurationResult.ok, true);
const syntheticConfiguration = syntheticConfigurationResult.configuration;
const configuration = (complete: boolean, landingPageId: string | null = null) => ({
  ...syntheticConfiguration, complete, landingPageId,
});
const activeContext = (role: string | null = "owner") => ({
  account: { id: "account-test", status: "active" }, account_id: "fallback-id", member: { id: "member-test" },
  role, blocked: false, user: { id: "user-test" },
});
function treeSnapshot(value: unknown): unknown {
  if (isValidElement(value)) {
    const element = value as ReactElement<Record<string, unknown>>;
    const type = element.type;
    const shared = [...leaves.values()].some(leaf => leaf === type);
    // Local helpers have separate JS instances; source/name identify them and their bodies are compared above.
    const identity = typeof type === "function" && !shared ? { local: type.name, source: type.toString() } : type;
    return { type: identity, key: element.key, props: treeSnapshot(element.props) };
  }
  if (Array.isArray(value)) return value.map(treeSnapshot);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, treeSnapshot(item)]));
  return value;
}
async function executePage(executable: ReturnType<typeof compile>, scenario: Scenario) {
  const trace: unknown[] = [];
  const values: Record<string, unknown> = {
    access: Object.hasOwn(scenario, "ctx") ? scenario.ctx : activeContext(),
    entitlement: Object.hasOwn(scenario, "entitlement") ? scenario.entitlement : { isCommerciallyEligible: true },
    niche: Object.hasOwn(scenario, "niche") ? scenario.niche : { status: "ready", synthetic: { entire: [1, null, "niche"] } },
    taxon: Object.hasOwn(scenario, "taxon") ? scenario.taxon : { taxonId: "taxon-test" },
    workspace: Object.hasOwn(scenario, "workspace") ? scenario.workspace : { ok: true, items: [], nextCursor: null, synthetic: { entire: [false, 1] } },
    onboarding: Object.hasOwn(scenario, "onboarding") ? scenario.onboarding : { ok: true, configuration: configuration(true, "lp-test") },
    drafts: Object.hasOwn(scenario, "drafts") ? scenario.drafts : { ok: true, drafts: [] },
    activation: Object.hasOwn(scenario, "activation") ? scenario.activation : { status: "ready", bundle: { synthetic: { entire: ["bundle", 2] } } },
  };
  const injectedError = Object.assign(new Error("synthetic IO failure: " + scenario.fail), { code: "AA09_IO", detail: { synthetic: true } });
  const pending = new Map<string, () => void>();
  let flagCalls = 0;
  function io(name: string, args: unknown) {
    trace.push(["start", name, args]);
    return new Promise<unknown>((resolve, reject) => {
      const settle = () => {
        if (scenario.fail === name) {
          trace.push(["reject", name, injectedError.name, injectedError.message, injectedError.code]);
          reject(injectedError);
        } else {
          trace.push(["resolve", name, values[name]]);
          resolve(values[name]);
        }
      };
      if (parallelReads.includes(name)) pending.set(name, settle);
      else settle();
    });
  }
  const dependencies: Record<string, unknown> = {
    "server-only": {}, "react/jsx-runtime": requireValidation("react/jsx-runtime"),
    "@/lib/access/getAccessContext": { getAccessContext: (args: unknown) => io("access", args) },
    "@/conversion-content": { getCommercialActivationHierarchicalBundle: (args: unknown) => io("activation", args) },
    "../../../lib/commercial-entitlements": { getCommercialEntitlementSignal: (args: unknown) => io("entitlement", args) },
    "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter": { getActionableNicheResolutionForAccount: (args: unknown) => io("niche", args) },
    "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter": { getActivePrimaryAccountTaxon: (args: unknown) => io("taxon", args) },
    "../../../lib/lp-builder": {
      listAccountLandingPageWorkspace: (args: unknown) => io("workspace", args),
      getAccountLandingPageOnboardingConfiguration: (args: unknown) => io("onboarding", args),
      listAccountLandingPageDrafts: (args: unknown) => io("drafts", args),
      isLandingPageWorkspaceEnabled: () => {
        const index = flagCalls++;
        trace.push(["start", "flag", []]);
        if (scenario.flagFailAt === index) { trace.push(["reject", "flag"]); throw injectedError; }
        const flags = scenario.flags ?? [true, true];
        const result = flags[Math.min(index, flags.length - 1)];
        trace.push(["resolve", "flag", result]);
        return result;
      },
    },
    "./_components/onboarding-journey-policy": { decideAccountJourney: (args: Parameters<typeof decideAccountJourney>[0]) => {
      trace.push(["start", "policy", args]);
      const result = decideAccountJourney(args);
      trace.push(["resolve", "policy", result]);
      return result;
    } },
  };
  for (const line of leafImports(originalPageSource)) {
    const [, name, moduleId] = line.match(/import \{ (\w+) \} from "([^"]+)"/) ?? [];
    dependencies[moduleId] = { [name]: leaves.get(name) };
  }
  const controlledRequire = (id: string) => {
    assert.ok(Object.hasOwn(dependencies, id), "unexpected dependency / cycle: " + id);
    return dependencies[id];
  };
  const loaderModule = { exports: {} as Record<string, unknown> };
  loaderExecutable(controlledRequire, loaderModule, loaderModule.exports);
  dependencies["./account-journey-loader"] = loaderModule.exports;
  const pageModule = { exports: {} as Record<string, unknown> };
  executable(controlledRequire, pageModule, pageModule.exports);
  const params = { account: Object.hasOwn(scenario, "account") ? scenario.account : " ACCOUNT-TEST " };
  const search = scenario.search ?? {};
  const props = { params: scenario.promised ? Promise.resolve(params) : params,
    searchParams: scenario.promised ? Promise.resolve(search) : scenario.search };
  const run = pageModule.exports.default as (props: unknown) => Promise<ReactElement>;
  let settled = false;
  const result = run(props).then(tree => ({ tree, error: null }), error => ({ tree: null, error })).finally(() => { settled = true; });
  // No timers: drain page/access microtasks, stopping before any of the three external reads settles.
  for (let turn = 0; turn < 30 && pending.size < 3 && !settled; turn++) await Promise.resolve();
  if (pending.size) {
    assert.deepEqual([...pending.keys()], parallelReads, "three starts before any resolution (no serialized Promise.all)");
    assert.equal(settled, false);
    const starts = trace.filter((entry): entry is unknown[] => Array.isArray(entry) && entry[0] === "start");
    assert.deepEqual(starts.slice(-3).map(entry => entry[1]), parallelReads);
    for (const name of scenario.resolveOrder ?? parallelReads) { pending.get(name)!(); await Promise.resolve(); }
  }
  const outcome = await result;
  if (outcome.error) {
    if (scenario.fail || scenario.flagFailAt !== undefined) assert.equal(outcome.error, injectedError, "same thrown IO error identity");
    return { trace, error: { name: outcome.error.name, message: outcome.error.message, code: outcome.error.code, detail: outcome.error.detail }, tree: null, html: null };
  }
  assert.ok(outcome.tree);
  return { trace, error: null, tree: treeSnapshot(outcome.tree), html: renderToStaticMarkup(outcome.tree) };
}

async function validatePageEquivalence() {
  const scenarios: Scenario[] = [];
  const configurations = [
    { ok: true, configuration: configuration(false) },
    { ok: true, configuration: configuration(true, "lp-test") },
    { ok: true, configuration: configuration(true) },
    { ok: false, error: "configuration_unavailable" },
    { ok: false, error: "unauthorized" },
    { ok: true, configuration: null }, // inconsistent API state: preserve original thrown error, no hardening
  ];
  for (const role of ["owner", "admin", "editor", "viewer"]) {
    for (const eligible of [false, true]) {
      for (const flags of [[false, false], [true, true], [true, false], [false, true]]) {
        for (const workspace of [{ ok: true, items: [], nextCursor: "next-test" }, { ok: false, error: "unavailable" }]) {
          for (const onboarding of configurations) {
            scenarios.push({ name: [role, eligible, flags.join("/"), workspace.ok, JSON.stringify(onboarding)].join("/"),
              ctx: activeContext(role), entitlement: { isCommerciallyEligible: eligible }, flags, workspace, onboarding });
          }
        }
      }
    }
  }
  for (const role of ["owner", "admin"]) for (const drafts of [[], [{ id: "draft-one" }], [{ id: "draft-one" }, { id: "draft-two" }], null]) {
    for (const edit of ["1", "0", ["1"], undefined]) scenarios.push({ name: "drafts/edit/" + role + "/" + JSON.stringify([drafts, edit]),
      ctx: activeContext(role), onboarding: { ok: true, configuration: configuration(true) },
      drafts: drafts === null ? { ok: false, error: "unavailable" } : { ok: true, drafts }, search: { edit_onboarding: edit }, promised: true });
  }
  for (const status of ["pending_setup", "active", "inactive", "suspended", null, undefined, "unknown"]) {
    for (const role of ["owner", "admin", "editor", "viewer"]) scenarios.push({ name: "status/" + status + "/" + role,
      ctx: { ...activeContext(role), account: { id: "account-test", status } } });
  }
  for (const ctx of [null, undefined, {}, { account_id: "orphan" }, { member: {} }, { account: {} },
    { account: { status: "active" }, role: "owner" },
    { account: { status: "active" }, account_id: "fallback-id", role: "owner" },
    { ...activeContext(), blocked: true }, { ...activeContext(), user: null }, activeContext(null),
    { ...activeContext(), account: { id: "", status: "active" } }]) scenarios.push({ name: "context/" + JSON.stringify(ctx), ctx });
  for (const account of [" HOME ", "home", "", undefined, " PuBliC "]) scenarios.push({ name: "slug/" + account, account, ctx: null, promised: true });
  for (const value of ["cursor-test", "", ["array"], undefined, null, 1]) {
    for (const role of ["owner", "viewer"]) scenarios.push({ name: "search/" + role + "/" + JSON.stringify(value), ctx: activeContext(role), search: { workspace_cursor: value, workspace_error: value } });
  }
  for (const entitlement of [null, {}, { isCommerciallyEligible: "true" }]) scenarios.push({ name: "entitlement/" + JSON.stringify(entitlement), entitlement });
  for (const eligible of [false, true]) for (const niche of [null, { synthetic: ["niche", null] }]) {
    for (const taxon of [null, { taxonId: "taxon-test" }]) for (const activation of [null, { status: "unavailable" }, { status: "ready", bundle: null }, { status: "ready", bundle: { synthetic: ["bundle", false] } }, { status: "blocked", bundle: { ignored: true } }]) {
      scenarios.push({ name: "commercial/" + JSON.stringify([eligible, niche, taxon, activation]), entitlement: { isCommerciallyEligible: eligible },
        onboarding: { ok: false, error: "configuration_unavailable" }, niche, taxon, activation });
    }
  }
  for (const fail of ["access", ...parallelReads, "workspace", "onboarding", "drafts", "activation"]) scenarios.push({
    name: "IO rejection/" + fail, fail,
    onboarding: fail === "activation" ? { ok: false, error: "configuration_unavailable" } : { ok: true, configuration: configuration(true) },
  });
  for (const flagFailAt of [0, 1]) scenarios.push({ name: "flag throw/" + flagFailAt, flagFailAt });
  for (const resolveOrder of [["entitlement", "niche", "taxon"], ["entitlement", "taxon", "niche"], ["niche", "entitlement", "taxon"],
    ["niche", "taxon", "entitlement"], ["taxon", "entitlement", "niche"], ["taxon", "niche", "entitlement"]]) {
    for (const fail of [undefined, ...parallelReads]) scenarios.push({ name: "concurrency/" + resolveOrder.join("/") + "/" + fail, resolveOrder, fail });
  }
  for (const scenario of scenarios) {
    const original = await executePage(originalExecutable, scenario);
    const candidate = await executePage(candidateExecutable, scenario);
    assert.deepEqual(candidate, original, scenario.name + ": full React tree, component identity, props, HTML, ordered IO args/results/errors and real policy");
    if (scenario.account === " HOME " || scenario.account === "home") assert.deepEqual(original.trace, [], "home never reads access");
  }
  console.log("ok - AA09 original page vs actual page+loader: " + scenarios.length + " scenarios; full tree/props/HTML/ordered traces and controlled concurrency");
}
void validatePageEquivalence().catch(error => { console.error(error); process.exitCode = 1; });
