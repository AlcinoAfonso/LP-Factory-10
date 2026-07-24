import assert from "node:assert/strict";

import {
  landingPageFieldKinds,
  landingPageFunnelTreatmentKeysByProfile,
  landingPageModuleKeys,
  landingPageVariantCapabilities,
  type LandingPageModuleKey,
  type LandingPageVariantKey,
} from "./contracts";
import { deriveLandingPageVariantCapabilities } from "./capabilities";
import {
  landingPageModuleCatalogRegistry,
  withDerivedCapabilities,
  type LandingPageModuleCatalogDefinition,
} from "./registry";
import {
  landingPageCopySourceMapSchema,
  landingPageModuleCatalogSchema,
} from "./schema";
import {
  resolveLandingPageModuleCatalog,
  resolveLandingPageModuleCatalogFromRegistry,
} from "./resolver";
import * as publicModuleCatalog from "./index";
import { resolveLandingPageRootParameters } from "../index";

type Case = Readonly<{
  name: string;
  run: () => void;
}>;

const cases: readonly Case[] = [
  {
    name: "the versioned catalog and all registered modules are valid",
    run: () => {
      const result = landingPageModuleCatalogSchema.safeParse(
        landingPageModuleCatalogRegistry,
      );

      assert.equal(result.success, true);
      assert.equal(landingPageModuleCatalogRegistry.family, "landing_page");
      assert.equal(landingPageModuleCatalogRegistry.moduleCatalogVersion, 1);
      assert.deepEqual(
        landingPageModuleCatalogRegistry.compatibleRootVersions,
        [1],
      );
      assert.deepEqual(
        Object.keys(landingPageModuleCatalogRegistry.modules).sort(),
        [...landingPageModuleKeys].sort(),
      );
    },
  },
  {
    name: "benefits is a bounded reusable module without operational registry coupling",
    run: () => {
      const benefits = landingPageModuleCatalogRegistry.modules.benefits;

      assert.equal(benefits.family, "landing_page");
      assert.equal(benefits.moduleKey, "benefits");
      assert.equal(benefits.moduleVersion, 1);
      assert.equal(benefits.lifecycleStatus, "hypothesis");
      assert.equal(benefits.purpose, "controlled_test");
      assert.equal(benefits.compatibleRootVersion, 1);
      assert.deepEqual(benefits.rootDelta, { textRanges: [] });
      assert.equal(
        benefits.structuralFunction,
        "Present practical benefits supported by research and real operational capabilities.",
      );
      assert.deepEqual(benefits.invariants, [
        "Benefits are distinct, practical and reusable across landing-page compositions.",
        "Research may guide a benefit but does not prove an operational capability.",
        "Factual benefit claims require applicable operational support.",
      ]);
      assert.deepEqual(benefits.boundaries, [
        "No action, form, social proof, price, offer detail or media.",
        "No taxon-specific key or dependency on an operational input registry.",
      ]);
      assert.equal(
        JSON.stringify(benefits).includes("real_estate"),
        false,
      );
      assert.equal(
        JSON.stringify(benefits).includes("inputCatalog"),
        false,
      );
      assertDeeplyFrozen(benefits);
    },
  },
  {
    name: "module identities are closed and scoped to landing_page",
    run: () => {
      const qualifiedIdentities = Object.values(
        landingPageModuleCatalogRegistry.modules,
      ).map((moduleDefinition) => {
        assert.equal(moduleDefinition.family, "landing_page");
        assert.equal(moduleDefinition.moduleVersion, 1);
        assert.equal(moduleDefinition.lifecycleStatus, "hypothesis");
        assert.equal(moduleDefinition.purpose, "controlled_test");
        return `${moduleDefinition.family}:${moduleDefinition.moduleKey}@v${moduleDefinition.moduleVersion}`;
      });

      assert.equal(new Set(qualifiedIdentities).size, landingPageModuleKeys.length);
      assert.equal(
        qualifiedIdentities.some((identity) =>
          identity.startsWith("commercial_activation:"),
        ),
        false,
      );
    },
  },
  {
    name: "registry values are deeply immutable",
    run: () => {
      assertDeeplyFrozen(landingPageModuleCatalogRegistry);
    },
  },
  {
    name: "module contracts do not anticipate later catalog phases",
    run: () => {
      const forbiddenKeys = new Set([
        "taxon",
        "campaign",
        "plan",
        "copy",
        "asset",
        "order",
        "channel",
        "destination",
        "variant",
        "fields",
        "sourceMap",
        "profile",
      ]);

      for (const moduleDefinition of Object.values(
        landingPageModuleCatalogRegistry.modules,
      )) {
        for (const key of Object.keys(moduleDefinition)) {
          assert.equal(forbiddenKeys.has(key), false, `forbidden key: ${key}`);
        }
      }
    },
  },
  {
    name: "unknown modules and structural values fail closed",
    run: () => {
      const unknownModule = cloneRegistry();
      unknownModule.modules.unknown = cloneModule("hero");
      assert.equal(landingPageModuleCatalogSchema.safeParse(unknownModule).success, false);

      const invalidLifecycle = cloneRegistry();
      invalidLifecycle.modules.hero.lifecycleStatus = "active";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidLifecycle).success,
        false,
      );

      const invalidPurpose = cloneRegistry();
      invalidPurpose.modules.hero.purpose = "production";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidPurpose).success,
        false,
      );

      const invalidStructuralFunction = cloneRegistry();
      invalidStructuralFunction.modules.hero.structuralFunction =
        "Arbitrary structural function.";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidStructuralFunction)
          .success,
        false,
      );

      const invalidInvariant = cloneRegistry();
      invalidInvariant.modules.hero.invariants[0] = "Arbitrary invariant.";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidInvariant).success,
        false,
      );

      const invalidBoundary = cloneRegistry();
      invalidBoundary.modules.hero.boundaries[0] = "Arbitrary boundary.";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidBoundary).success,
        false,
      );

      const invalidFamily = cloneRegistry();
      invalidFamily.family = "commercial_activation";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(invalidFamily).success,
        false,
      );
    },
  },
  {
    name: "missing modules, mismatched identities and extra fields fail closed",
    run: () => {
      const missingModule = cloneRegistry();
      delete missingModule.modules.faq;
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(missingModule).success,
        false,
      );

      const mismatchedIdentity = cloneRegistry();
      mismatchedIdentity.modules.hero.moduleKey = "faq";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(mismatchedIdentity).success,
        false,
      );

      const extraField = cloneRegistry();
      extraField.modules.hero.variant = "standard";
      assert.equal(
        landingPageModuleCatalogSchema.safeParse(extraField).success,
        false,
      );
    },
  },
  {
    name: "all registered field contracts and field kinds are valid",
    run: () => {
      assert.deepEqual(
        Object.keys(
          landingPageModuleCatalogRegistry.variantFieldContracts,
        ).sort(),
        Object.keys(landingPageModuleCatalogRegistry.variants).sort(),
      );

      const kinds = new Set<string>();
      for (const contract of Object.values(
        landingPageModuleCatalogRegistry.variantFieldContracts,
      )) {
        for (const field of contract.fields) collectFieldKinds(field, kinds);
      }
      assert.deepEqual([...kinds].sort(), [...landingPageFieldKinds].sort());
    },
  },
  {
    name: "unknown field, path, shape, cardinality and policy fail closed",
    run: () => {
      const unknownField = cloneRegistry();
      unknownField.variantFieldContracts["hero.standard@v1"].fields.push({
        ...cloneField("hero.standard@v1", 0),
        fieldKey: "unknown",
        path: "hero.standard.unknown",
      });
      assertInvalid(unknownField);

      const unknownPath = cloneRegistry();
      unknownPath.variantFieldContracts["hero.standard@v1"].fields[0].path =
        "hero.standard.unapproved";
      assertInvalid(unknownPath);

      const duplicatePath = cloneRegistry();
      addSyntheticVariant(
        duplicatePath,
        "faq.synthetic@v1",
        "faq.standard@v1",
      );
      const duplicateQuestion = getMutableTextField(
        duplicatePath,
        "faq.synthetic@v1",
        "faq.synthetic.items[].question",
      );
      duplicatePath.variantFieldContracts["faq.synthetic@v1"].fields.push(
        structuredClone(duplicateQuestion),
      );
      assertInvalidCatalogFailsClosedWithoutThrow(duplicatePath, {
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "faq",
        moduleVersion: 1,
        variantName: "synthetic",
        variantVersion: 1,
        funnelProfileKey: "mofu",
      });

      const unknownShape = cloneRegistry();
      unknownShape.variantFieldContracts["hero.standard@v1"].fields[0].fieldKind =
        "video";
      assertInvalid(unknownShape);

      const invertedCardinality = cloneRegistry();
      invertedCardinality.variantFieldContracts[
        "hero.standard@v1"
      ].fields[0].cardinality = { min: 2, max: 1 };
      assertInvalid(invertedCardinality);

      const unknownPolicy = cloneRegistry();
      unknownPolicy.variantFieldContracts["hero.standard@v1"].fields[0].policy =
        "generated";
      assertInvalid(unknownPolicy);
    },
  },
  {
    name: "nested collections and concrete action destinations fail closed",
    run: () => {
      const nestedCollection = cloneRegistry();
      const collection = nestedCollection.variantFieldContracts[
        "trust_bar.standard@v1"
      ].fields[0];
      collection.itemFields = [structuredClone(collection)];
      assertInvalid(nestedCollection);

      const concreteDestination = cloneRegistry();
      const action = concreteDestination.variantFieldContracts[
        "hero.standard@v1"
      ].fields.find((field) => field.fieldKind === "action");
      assert.ok(action);
      action.destination = "https://example.com";
      assertInvalid(concreteDestination);
    },
  },
  {
    name: "field contract identity, semantic role and support fail closed",
    run: () => {
      const mismatchedContract = cloneRegistry();
      mismatchedContract.variantFieldContracts[
        "hero.standard@v1"
      ].fieldContractKey = "faq.standard@v1";
      assertInvalid(mismatchedContract);

      const unknownSemanticRole = cloneRegistry();
      addSyntheticVariant(
        unknownSemanticRole,
        "hero.unknownrole@v1",
        "hero.standard@v1",
      );
      getMutableTextField(
        unknownSemanticRole,
        "hero.unknownrole@v1",
        "hero.unknownrole.title",
      ).semanticRole = "totally_unknown_role";
      assertInvalidCatalogFailsClosedWithoutThrow(unknownSemanticRole, {
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "hero",
        moduleVersion: 1,
        variantName: "unknownrole",
        variantVersion: 1,
        funnelProfileKey: "bofu",
      });

      const unknownSupport = cloneRegistry();
      unknownSupport.variantFieldContracts["hero.standard@v1"].fields[1].support =
        "always";
      assertInvalid(unknownSupport);

      const missingContract = cloneRegistry();
      delete missingContract.variantFieldContracts["faq.accordion@v1"];
      let derivedMissingContract: MutableCatalog | undefined;
      assert.doesNotThrow(() => {
        derivedMissingContract = withDerivedCapabilities(
          missingContract as unknown as LandingPageModuleCatalogDefinition,
        ) as unknown as MutableCatalog;
      });
      assert.ok(derivedMissingContract);
      assertInvalidCatalogFailsClosedWithoutThrow(
        derivedMissingContract,
        {
          moduleCatalogVersion: 1,
          rootVersion: 1,
          moduleKey: "faq",
          moduleVersion: 1,
          variantName: "accordion",
          variantVersion: 1,
          funnelProfileKey: "mofu",
        },
      );
    },
  },
  {
    name: "registered variants and field contracts have the same exact identities",
    run: () => {
      const registeredVariantKeys: string[] = Object.keys(
        landingPageModuleCatalogRegistry.variants,
      ).sort();
      const registeredFieldContractKeys = Object.keys(
        landingPageModuleCatalogRegistry.variantFieldContracts,
      ).sort();

      assert.equal(registeredVariantKeys.includes("benefits.standard@v1"), true);
      assert.equal(registeredVariantKeys.includes("hero.form@v1"), true);
      assert.deepEqual(registeredVariantKeys, registeredFieldContractKeys);

      for (const variantDefinition of Object.values(
        landingPageModuleCatalogRegistry.variants,
      )) {
        assert.equal(variantDefinition.moduleVersion, 1);
        assert.equal(variantDefinition.variantVersion, 1);
        assert.equal(variantDefinition.lifecycleStatus, "hypothesis");
        assert.equal(variantDefinition.purpose, "controlled_test");
        assert.equal(
          variantDefinition.fieldContractKey,
          variantDefinition.variantKey,
        );
        assert.ok(
          landingPageModuleCatalogRegistry.modules[variantDefinition.moduleKey],
        );
        assert.ok(
          landingPageModuleCatalogRegistry.variantFieldContracts[
            variantDefinition.fieldContractKey
          ],
        );
      }
    },
  },
  {
    name: "capabilities are derived from fields and interaction contracts",
    run: () => {
      const assignedCapabilities = new Set(
        Object.values(landingPageModuleCatalogRegistry.variants).flatMap(
          (variantDefinition) => variantDefinition.capabilities,
        ),
      );
      assert.deepEqual(
        [...assignedCapabilities].sort(),
        [...landingPageVariantCapabilities].sort(),
      );
      for (const variant of Object.values(
        landingPageModuleCatalogRegistry.variants,
      )) {
        const fields =
          landingPageModuleCatalogRegistry.variantFieldContracts[
            variant.fieldContractKey
          ].fields;
        assert.deepEqual(
          variant.capabilities,
          deriveLandingPageVariantCapabilities(
            fields,
            variant.interactionContracts,
          ),
        );
      }
      assert.equal(
        landingPageModuleCatalogRegistry.variants[
          "hero.form@v1"
        ].capabilities.includes("embedded_form"),
        true,
      );
      assert.equal(
        landingPageModuleCatalogRegistry.variants[
          "faq.accordion@v1"
        ].capabilities.includes("accordion_interaction"),
        true,
      );
    },
  },
  {
    name: "benefits standard resolves a bounded collection with explicit support sources",
    run: () => {
      const result = resolveLandingPageModuleCatalog({
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "benefits",
        moduleVersion: 1,
        variantName: "standard",
        variantVersion: 1,
        funnelProfileKey: "mofu",
      });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.value.variant.variantKey, "benefits.standard@v1");
      assert.deepEqual(
        result.value.fieldContract.fields.map((field) => field.path),
        ["benefits.standard.title", "benefits.standard.items"],
      );
      const title = result.value.fieldContract.fields[0];
      assert.equal(title?.fieldKind, "text");
      if (title?.fieldKind !== "text") return;
      assert.deepEqual(title.cardinality, { min: 1, max: 1 });
      assert.deepEqual(
        title.copySourceMap,
        expectedResearch(["desire", "positioning_opportunity"], "pain"),
      );
      const items = result.value.fieldContract.fields[1];
      assert.equal(items?.fieldKind, "collection");
      if (items?.fieldKind !== "collection") return;
      assert.deepEqual(items.cardinality, { min: 3, max: 6 });
      assert.deepEqual(
        items.itemFields.map((field) => field.path),
        [
          "benefits.standard.items[].benefitTitle",
          "benefits.standard.items[].description",
        ],
      );
      for (const field of items.itemFields) {
        assert.equal(field.fieldKind, "text");
        if (field.fieldKind !== "text") continue;
        assert.deepEqual(field.cardinality, { min: 1, max: 1 });
        assert.deepEqual(field.copySourceMap, {
          sourceMode: "research_with_operational_support",
          researchPath: "endCustomer.researches[].items[]",
          primaryItemKeys:
            field.fieldKey === "benefitTitle"
              ? ["positioning_opportunity", "desire"]
              : ["belief", "desire"],
          auxiliaryItemKey:
            field.fieldKey === "benefitTitle" ? "belief" : "objection",
          operationalSupport: {
            requirement: "required_when_claimed",
            referenceKeys: ["applicable_capabilities"],
          },
        });
      }
      assertDeeplyFrozen(result.value);
    },
  },
  {
    name: "comparison standard resolves as a neutral non-interactive module",
    run: () => {
      const result = resolveLandingPageModuleCatalog({
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "comparison",
        moduleVersion: 1,
        variantName: "standard",
        variantVersion: 1,
        funnelProfileKey: "mofu",
      });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.value.variant.variantKey, "comparison.standard@v1");
      assert.deepEqual(result.value.module.permittedInteractionKinds, []);
      assert.deepEqual(result.value.variant.interactionContracts, []);
      assert.deepEqual(result.value.variant.capabilities, []);
      assert.deepEqual(
        result.value.fieldContract.fields.map((field) => field.path),
        ["comparison.standard.title", "comparison.standard.items"],
      );
      const items = result.value.fieldContract.fields[1];
      assert.equal(items?.fieldKind, "collection");
      if (items?.fieldKind !== "collection") return;
      assert.deepEqual(items.cardinality, { min: 2, max: 4 });
      assert.deepEqual(
        items.itemFields.map((field) => field.path),
        [
          "comparison.standard.items[].optionTitle",
          "comparison.standard.items[].description",
        ],
      );
      assertDeeplyFrozen(result.value);
    },
  },
  {
    name: "lead capture reuses the complete canonical form interaction",
    run: () => {
      const result = resolveLandingPageModuleCatalog({
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "lead_capture",
        moduleVersion: 1,
        variantName: "form",
        variantVersion: 1,
        funnelProfileKey: "bofu",
      });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.value.variant.variantKey, "lead_capture.form@v1");
      assert.deepEqual(result.value.module.permittedInteractionKinds, ["form"]);
      assert.deepEqual(result.value.variant.capabilities, [
        "primary_action",
        "embedded_form",
      ]);
      assert.deepEqual(
        result.value.fieldContract.fields.map((field) => field.path),
        [
          "lead_capture.form.title",
          "lead_capture.form.body",
          "lead_capture.form.primaryCta",
        ],
      );
      assert.deepEqual(
        result.value.variant.interactionContracts,
        landingPageModuleCatalogRegistry.variants["hero.form@v1"]
          .interactionContracts,
      );
      assertDeeplyFrozen(result.value);
    },
  },
  {
    name: "hero form resolves with a complete abstract accessible form contract",
    run: () => {
      const result = resolveLandingPageModuleCatalog({
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "hero",
        moduleVersion: 1,
        variantName: "form",
        variantVersion: 1,
        funnelProfileKey: "bofu",
      });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.value.variant.variantKey, "hero.form@v1");
      const form = result.value.variant.interactionContracts.find(
        (contract) => contract.kind === "form",
      );
      assert.ok(form);
      assert.deepEqual(
        form.fields.map(({ fieldKey, valueType, obligation }) => ({
          fieldKey,
          valueType,
          obligation,
        })),
        [
          { fieldKey: "name", valueType: "text", obligation: "required" },
          { fieldKey: "email", valueType: "email", obligation: "required" },
          { fieldKey: "phone", valueType: "phone", obligation: "optional" },
        ],
      );
      assert.equal(form.consent.privacyPolicyInputFieldKey, "privacy_policy_url");
      assert.equal(form.accessibility.baseline, "WCAG 2.2");
      assert.equal(form.accessibility.focusMovesToFirstInvalidField, true);
      assert.equal(form.operationalBinding.requiredValue, "form");
      assertDeeplyFrozen(result.value);
    },
  },
  {
    name: "faq variants are independent and accordion declares the WCAG contract",
    run: () => {
      const standardFields =
        landingPageModuleCatalogRegistry.variantFieldContracts[
          "faq.standard@v1"
        ].fields;
      const accordionFields =
        landingPageModuleCatalogRegistry.variantFieldContracts[
          "faq.accordion@v1"
        ].fields;
      assert.notEqual(standardFields, accordionFields);
      assert.deepEqual(
        normalizeFaqFieldPaths(standardFields),
        normalizeFaqFieldPaths(accordionFields),
      );

      assert.equal(
        landingPageModuleCatalogRegistry.variants[
          "faq.standard@v1"
        ].interactionContracts.some((contract) => contract.kind === "accordion"),
        false,
      );
      const accordion = landingPageModuleCatalogRegistry.variants[
        "faq.accordion@v1"
      ].interactionContracts.find((contract) => contract.kind === "accordion");
      assert.ok(accordion);
      assert.equal(accordion.baseline, "WCAG 2.2");
      assert.equal(accordion.keyboardOperable, true);
      assert.equal(accordion.exposesExpandedState, true);
      assert.equal(accordion.associatesControlAndRegion, true);
      assert.equal(accordion.preservesFocus, true);
      assert.equal(accordion.initiallyCollapsed, true);
      assert.equal(accordion.singleExpandedItem, true);
    },
  },
  {
    name: "interaction contracts are canonical and the Hero boundary is coherent",
    run: () => {
      for (const variantKey of [
        "hero.standard@v1",
        "final_cta.standard@v1",
      ] as const) {
        assert.equal(
          landingPageModuleCatalogRegistry.variants[
            variantKey
          ].interactionContracts.some((contract) => contract.kind === "form"),
          false,
        );
      }
      assert.equal(
        landingPageModuleCatalogRegistry.variants[
          "hero.form@v1"
        ].interactionContracts.some((contract) => contract.kind === "form"),
        true,
      );
      assert.equal(
        landingPageModuleCatalogRegistry.modules.hero.boundaries.some(
          (boundary) =>
            boundary.includes("requires a valid form interaction contract"),
        ),
        true,
      );
      assert.deepEqual(
        landingPageModuleCatalogRegistry.modules.hero.permittedInteractionKinds,
        ["form"],
      );
      assert.deepEqual(
        landingPageModuleCatalogRegistry.modules.faq.permittedInteractionKinds,
        ["accordion"],
      );

      const formFallback = cloneRegistry();
      formFallback.variants["hero.standard@v1"].fallbackChannel = "whatsapp";
      assertInvalid(formFallback);

      const staleCapability = cloneRegistry();
      staleCapability.variants["hero.form@v1"].capabilities = [
        "primary_action",
        "image_asset",
      ];
      assertInvalid(staleCapability);

      const interactionWithoutCapability = cloneRegistry();
      interactionWithoutCapability.variants[
        "hero.standard@v1"
      ].interactionContracts.push(
        structuredClone(
          getMutableInteraction(
            interactionWithoutCapability,
            "hero.form@v1",
            "form",
          ),
        ),
      );
      assertInvalid(interactionWithoutCapability);
    },
  },
  {
    name: "embedded form requirement omissions and false values fail closed independently",
    run: () => {
      assertRequiredTrueInteractionPropertiesFailClosed(
        "hero.form@v1",
        "form",
        [
        "labelsProgrammaticallyAssociated",
        "instructionsProgrammaticallyAssociated",
        "errorsProgrammaticallyAssociated",
        "keyboardOperable",
        "focusMovesToFirstInvalidField",
        ],
        "accessibility",
      );

      const missingConsent = cloneRegistry();
      delete getMutableInteraction(
        missingConsent,
        "hero.form@v1",
        "form",
      ).consent;
      assertInvalid(missingConsent);

      const duplicatedField = cloneRegistry();
      const formFields = getMutableInteraction(
        duplicatedField,
        "hero.form@v1",
        "form",
      ).fields as Record<string, unknown>[];
      assert.ok(formFields);
      formFields.push(structuredClone(formFields[0]));
      assertInvalid(duplicatedField);

      const consentCollision = cloneRegistry();
      const collisionFields = getMutableInteraction(
        consentCollision,
        "hero.form@v1",
        "form",
      ).fields as Record<string, unknown>[];
      assert.ok(collisionFields);
      collisionFields.push({
        ...structuredClone(collisionFields[0]),
        fieldKey: "privacyConsent",
      });
      assertInvalidCatalogFailsClosedWithoutThrow(
        consentCollision,
        {
          moduleCatalogVersion: 1,
          rootVersion: 1,
          moduleKey: "hero",
          moduleVersion: 1,
          variantName: "form",
          variantVersion: 1,
          funnelProfileKey: "bofu",
        },
      );
    },
  },
  {
    name: "interaction kinds and capabilities fail closed structurally",
    run: () => {
      const unknownCapability = cloneRegistry();
      unknownCapability.variants["hero.standard@v1"].capabilities.push(
        "carousel",
      );
      assertInvalid(unknownCapability);

      const unknownInteraction = cloneRegistry();
      unknownInteraction.variants[
        "hero.standard@v1"
      ].interactionContracts.push({ kind: "booking" });
      assertInvalid(unknownInteraction);

      for (const [variantKey, kind] of [
        ["hero.form@v1", "form"],
        ["faq.accordion@v1", "accordion"],
      ] as const) {
        const duplicatedInteraction = cloneRegistry();
        duplicatedInteraction.variants[variantKey].interactionContracts.push(
          structuredClone(
            getMutableInteraction(duplicatedInteraction, variantKey, kind),
          ),
        );
        assertInvalid(duplicatedInteraction);
      }

      const incompatibleDiscriminator = cloneRegistry();
      getMutableInteraction(
        incompatibleDiscriminator,
        "faq.accordion@v1",
        "accordion",
      ).kind = "form";
      assertInvalid(incompatibleDiscriminator);

      const incompatibleModuleInteraction = cloneRegistry();
      addSyntheticVariant(
        incompatibleModuleInteraction,
        "faq.syntheticform@v1",
        "faq.standard@v1",
        "hero.form@v1",
        "form",
      );

      const repeatedPrimaryAction = cloneRegistry();
      addSyntheticVariant(
        repeatedPrimaryAction,
        "final_cta.repeated@v1",
        "final_cta.standard@v1",
      );
      const repeatedAction = repeatedPrimaryAction.variantFieldContracts[
        "final_cta.repeated@v1"
      ].fields.find((field) => field.fieldKind === "action");
      assert.ok(repeatedAction);
      repeatedAction.cardinality = { min: 0, max: 2 };
      const repeatedCapabilities = deriveLandingPageVariantCapabilities(
        repeatedPrimaryAction.variantFieldContracts[
          "final_cta.repeated@v1"
        ].fields as unknown as Parameters<
          typeof deriveLandingPageVariantCapabilities
        >[0],
        [],
      );
      assert.equal(
        repeatedCapabilities.includes("primary_action"),
        false,
      );
      repeatedPrimaryAction.variants["final_cta.repeated@v1"].capabilities = [
        ...repeatedCapabilities,
      ];
      assertInvalidCatalogFailsClosedWithoutThrow(repeatedPrimaryAction, {
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "final_cta",
        moduleVersion: 1,
        variantName: "repeated",
        variantVersion: 1,
        funnelProfileKey: "bofu",
      });

      const repeatedActionLabel = cloneRegistry();
      addSyntheticVariant(
        repeatedActionLabel,
        "final_cta.repeatedlabel@v1",
        "final_cta.standard@v1",
      );
      const actionWithRepeatedLabel = repeatedActionLabel.variantFieldContracts[
        "final_cta.repeatedlabel@v1"
      ].fields.find((field) => field.fieldKind === "action");
      assert.ok(actionWithRepeatedLabel?.label);
      actionWithRepeatedLabel.label.cardinality = { min: 0, max: 2 };
      assertInvalidCatalogFailsClosedWithoutThrow(repeatedActionLabel, {
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "final_cta",
        moduleVersion: 1,
        variantName: "repeatedlabel",
        variantVersion: 1,
        funnelProfileKey: "bofu",
      });
      assertInvalidCatalogFailsClosedWithoutThrow(
        incompatibleModuleInteraction,
        {
          moduleCatalogVersion: 1,
          rootVersion: 1,
          moduleKey: "faq",
          moduleVersion: 1,
          variantName: "syntheticform",
          variantVersion: 1,
          funnelProfileKey: "mofu",
        },
      );

      const orphanVariant = cloneRegistry();
      orphanVariant.variants["hero.campaign@v1"] = cloneVariant(
        "hero.standard@v1",
      );
      orphanVariant.variants["hero.campaign@v1"].variantKey =
        "hero.campaign@v1";
      assertInvalid(orphanVariant);

      for (const policy of ["not_copy", "technical_reference"]) {
        const invalidTextPolicy = cloneRegistry();
        addSyntheticVariant(
          invalidTextPolicy,
          "hero.invalidtext@v1",
          "hero.standard@v1",
        );
        getMutableTextField(
          invalidTextPolicy,
          "hero.invalidtext@v1",
          "hero.invalidtext.title",
        ).policy = policy;
        assertInvalidCatalogFailsClosedWithoutThrow(invalidTextPolicy, {
          moduleCatalogVersion: 1,
          rootVersion: 1,
          moduleKey: "hero",
          moduleVersion: 1,
          variantName: "invalidtext",
          variantVersion: 1,
          funnelProfileKey: "bofu",
        });
      }

      for (const motivation of [
        "taxon",
        "copy",
        "plan",
        "campaign",
        "asset",
        "order",
        "quantity",
      ]) {
        const motivatedVariant = cloneRegistry();
        motivatedVariant.variants[
          "hero.standard@v1"
        ].creationMotivation = motivation;
        assertInvalid(motivatedVariant);
      }
    },
  },
  {
    name: "accordion requirements and mismatched links fail closed",
    run: () => {
      assertRequiredTrueInteractionPropertiesFailClosed(
        "faq.accordion@v1",
        "accordion",
        [
          "keyboardOperable",
          "exposesExpandedState",
          "associatesControlAndRegion",
          "preservesFocus",
          "initiallyCollapsed",
          "singleExpandedItem",
        ],
      );

      const mismatchedModule = cloneRegistry();
      mismatchedModule.variants["hero.standard@v1"].moduleKey = "faq";
      assertInvalid(mismatchedModule);

      const mismatchedFields = cloneRegistry();
      mismatchedFields.variants["hero.standard@v1"].fieldContractKey =
        "faq.standard@v1";
      assertInvalid(mismatchedFields);
    },
  },
  {
    name: "existing interaction kinds are reusable by synthetic variants",
    run: () => {
      const synthetic = cloneRegistry();
      addSyntheticVariant(
        synthetic,
        "hero.syntheticform@v1",
        "hero.standard@v1",
        "hero.form@v1",
        "form",
      );
      addSyntheticVariant(
        synthetic,
        "faq.syntheticaccordion@v1",
        "faq.standard@v1",
        "faq.accordion@v1",
        "accordion",
      );

      const parsedSynthetic = landingPageModuleCatalogSchema.safeParse(synthetic);
      assert.equal(
        parsedSynthetic.success,
        true,
        parsedSynthetic.success
          ? undefined
          : JSON.stringify(parsedSynthetic.error.issues),
      );

      for (const [moduleKey, variantName, capability] of [
        ["hero", "syntheticform", "embedded_form"],
        ["faq", "syntheticaccordion", "accordion_interaction"],
      ] as const) {
        const result = resolveLandingPageModuleCatalogFromRegistry(
          {
            moduleCatalogVersion: 1,
            rootVersion: 1,
            moduleKey,
            moduleVersion: 1,
            variantName,
            variantVersion: 1,
            funnelProfileKey: "mofu",
          },
          synthetic as unknown as Parameters<
            typeof resolveLandingPageModuleCatalogFromRegistry
          >[1],
        );
        assert.equal(result.ok, true, JSON.stringify(result));
        if (!result.ok) continue;
        assert.equal(result.value.variant.capabilities.includes(capability), true);
        assertDeeplyFrozen(result.value);
      }
    },
  },
  {
    name: "root compatibility and specialization deltas fail closed",
    run: () => {
      const incompatibleModule = cloneRegistry();
      incompatibleModule.modules.hero.compatibleRootVersion = 2;
      assertInvalid(incompatibleModule);

      const incompatibleVariant = cloneRegistry();
      incompatibleVariant.variants["hero.standard@v1"].compatibleRootVersion = 2;
      assertInvalid(incompatibleVariant);

      for (const variantKey of [
        "benefits.standard@v1",
        "hero.form@v1",
      ] as const) {
        const incompatibleNewVariant = cloneRegistry();
        incompatibleNewVariant.variants[variantKey].compatibleRootVersion = 2;
        assertInvalid(incompatibleNewVariant);
      }

      const widenedModuleLimit = cloneRegistry();
      widenedModuleLimit.modules.hero.rootDelta.textRanges.push({ semanticRole: "h1", absoluteMax: 121 });
      assertInvalid(widenedModuleLimit);

      const widenedVariantLimit = cloneRegistry();
      widenedVariantLimit.modules.hero.rootDelta.textRanges.push({ semanticRole: "h1", recommended: { min: 36, max: 64 }, absoluteMax: 100 });
      widenedVariantLimit.variants["hero.standard@v1"].rootDelta.textRanges.push({ semanticRole: "h1", recommended: { min: 36, max: 70 }, absoluteMax: 110 });
      assertInvalid(widenedVariantLimit);

      const widenedFormLimit = cloneRegistry();
      widenedFormLimit.modules.hero.rootDelta.textRanges.push({ semanticRole: "h1", recommended: { min: 40, max: 60 }, absoluteMax: 100 });
      widenedFormLimit.variants["hero.form@v1"].rootDelta.textRanges.push({ semanticRole: "h1", recommended: { min: 39, max: 61 }, absoluteMax: 101 });
      assertInvalid(widenedFormLimit);

      const invalidInheritedRange = cloneRegistry();
      invalidInheritedRange.modules.hero.rootDelta.textRanges.push({ semanticRole: "h1", recommended: { min: 36, max: 64 }, absoluteMax: 100 });
      invalidInheritedRange.variants["hero.standard@v1"].rootDelta.textRanges.push({ semanticRole: "h1", absoluteMax: 50 });
      assertInvalid(invalidInheritedRange);

      const duplicateRestriction = cloneRegistry();
      duplicateRestriction.variants["hero.standard@v1"].rootDelta.textRanges.push(
        { semanticRole: "h1", absoluteMax: 100 },
        { semanticRole: "h1", absoluteMax: 90 },
      );
      assertInvalid(duplicateRestriction);

      const unknownRootContract = cloneRegistry();
      unknownRootContract.compatibleRootVersions = [2];
      assertInvalid(unknownRootContract);

      const inheritedPropertyRole = cloneRegistry();
      inheritedPropertyRole.modules.hero.rootDelta.textRanges.push({ semanticRole: "toString", absoluteMax: 1 });
      assert.doesNotThrow(() => assertInvalid(inheritedPropertyRole));
    },
  },
  {
    name: "new variants preserve root lineage and restrictive specialization",
    run: () => {
      for (const input of [
        { moduleKey: "benefits", variantName: "standard" },
        { moduleKey: "hero", variantName: "form" },
      ]) {
        const result = resolveLandingPageModuleCatalog({
          moduleCatalogVersion: 1,
          rootVersion: 1,
          moduleKey: input.moduleKey,
          moduleVersion: 1,
          variantName: input.variantName,
          variantVersion: 1,
          funnelProfileKey: "bofu",
        });
        assert.equal(result.ok, true);
        if (!result.ok) continue;
        assert.equal(result.value.root.rootVersion, 1);
        assert.equal(result.value.effectiveRoot.rootVersion, 1);
        assert.deepEqual(result.value.module.rootDelta, { textRanges: [] });
        assert.deepEqual(result.value.variant.rootDelta, { textRanges: [] });
        assert.notEqual(result.value.root, result.value.effectiveRoot);
      }

      const specialized = cloneRegistry();
      specialized.modules.hero.rootDelta = {
        textRanges: [
          { semanticRole: "h1", recommended: { min: 40, max: 60 }, absoluteMax: 100 },
        ],
      };
      specialized.variants["hero.form@v1"].rootDelta = {
        textRanges: [
          { semanticRole: "h1", recommended: { min: 45, max: 55 }, absoluteMax: 90 },
        ],
      };
      const result = resolveLandingPageModuleCatalogFromRegistry(
        {
          moduleCatalogVersion: 1,
          rootVersion: 1,
          moduleKey: "hero",
          moduleVersion: 1,
          variantName: "form",
          variantVersion: 1,
          funnelProfileKey: "bofu",
        },
        specialized as unknown as Parameters<
          typeof resolveLandingPageModuleCatalogFromRegistry
        >[1],
      );
      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.value.root.semanticRoles.h1.textRange.absoluteMax > 90, true);
      assert.deepEqual(
        result.value.effectiveRoot.semanticRoles.h1.textRange.recommended,
        { min: 45, max: 55 },
      );
      assert.equal(
        result.value.effectiveRoot.semanticRoles.h1.textRange.absoluteMax,
        90,
      );
    },
  },
  {
    name: "copy source maps are closed and operational evidence stays separate",
    run: () => {
      const textualFields = Object.values(landingPageModuleCatalogRegistry.variantFieldContracts)
        .flatMap((contract) => flattenFields(contract.fields))
        .filter((field) => field.fieldKind === "text");
      assert.equal(textualFields.every((field) => Boolean(field.copySourceMap)), true);
      assert.equal(
        new Set(textualFields.map((field) => field.path)).size,
        textualFields.length,
      );

      const heroTitle = textualFields.find(
        (field) => field.path === "hero.standard.title",
      );
      assert.ok(heroTitle);
      assert.deepEqual(
        heroTitle.copySourceMap,
        expectedResearch(
          ["positioning_opportunity", "desire"],
          "commercial_keywords",
        ),
      );

      const socialProofQuote = textualFields.find(
        (field) => field.path === "social_proof.standard.items[].quote",
      );
      assert.ok(socialProofQuote);
      assert.deepEqual(
        socialProofQuote.copySourceMap,
        expectedEvidence("social_proof.standard.items[].evidenceRef"),
      );

      const unknownSourceMode = cloneRegistry();
      getMutableTextField(unknownSourceMode, "hero.standard@v1", "hero.standard.title").copySourceMap.sourceMode = "input_catalog";
      assertInvalid(unknownSourceMode);

      const unknownPath = cloneRegistry();
      getMutableTextField(unknownPath, "hero.standard@v1", "hero.standard.title").copySourceMap.researchPath = "businessBuyer.items[]";
      assertInvalid(unknownPath);

      const unknownItemKey = cloneRegistry();
      getMutableTextField(unknownItemKey, "hero.standard@v1", "hero.standard.title").copySourceMap.primaryItemKeys = ["unknown"];
      assertInvalid(unknownItemKey);

      const tooManySources = cloneRegistry();
      getMutableTextField(tooManySources, "hero.standard@v1", "hero.standard.title").copySourceMap.primaryItemKeys = ["trigger", "desire", "belief"];
      assertInvalid(tooManySources);

      const orphanOperationalEvidence = cloneRegistry();
      getMutableTextField(orphanOperationalEvidence, "social_proof.standard@v1", "social_proof.standard.items[].quote").copySourceMap.evidencePath = "social_proof.standard.orphan";
      assertInvalid(orphanOperationalEvidence);

      const missingOperationalEvidence = cloneRegistry();
      addSyntheticVariant(
        missingOperationalEvidence,
        "social_proof.missingevidence@v1",
        "social_proof.standard@v1",
      );
      const proofItems = missingOperationalEvidence.variantFieldContracts[
        "social_proof.missingevidence@v1"
      ].fields.find((field) => field.fieldKind === "collection");
      assert.ok(proofItems?.itemFields);
      proofItems.itemFields = proofItems.itemFields.filter(
        (field) => field.fieldKind !== "technical_reference",
      );
      assertInvalidCatalogFailsClosedWithoutThrow(missingOperationalEvidence, {
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "social_proof",
        moduleVersion: 1,
        variantName: "missingevidence",
        variantVersion: 1,
        funnelProfileKey: "mofu",
      });

      assert.equal("copySourceMaps" in landingPageModuleCatalogRegistry, false);

      const validButUnauthorized = cloneRegistry();
      getMutableTextField(validButUnauthorized, "hero.standard@v1", "hero.standard.title").copySourceMap.auxiliaryItemKey = "faq_questions";
      assertInvalid(validButUnauthorized);
    },
  },
  {
    name: "operational evidence ownership is structural for synthetic fields",
    run: () => {
      const synthetic = cloneRegistry();
      addSyntheticVariant(
        synthetic,
        "social_proof.synthetic@v1",
        "social_proof.standard@v1",
      );
      const syntheticContract = synthetic.variantFieldContracts[
        "social_proof.synthetic@v1"
      ];
      const items = syntheticContract.fields.find(
        (field) => field.fieldKind === "collection" && field.fieldKey === "items",
      );
      assert.ok(items?.itemFields);
      const body = items.itemFields.find((field) => field.fieldKey === "quote");
      assert.ok(body);
      body.fieldKey = "body";
      body.path = "social_proof.synthetic.items[].body";

      const parsedSynthetic = landingPageModuleCatalogSchema.safeParse(synthetic);
      assert.equal(
        parsedSynthetic.success,
        true,
        parsedSynthetic.success
          ? undefined
          : JSON.stringify(parsedSynthetic.error.issues),
      );
      const resolverInput = {
        moduleCatalogVersion: 1,
        rootVersion: 1,
        moduleKey: "social_proof" as const,
        moduleVersion: 1,
        variantName: "synthetic",
        variantVersion: 1,
        funnelProfileKey: "mofu" as const,
      };
      const resolution = resolveLandingPageModuleCatalogFromRegistry(
        resolverInput,
        synthetic as unknown as Parameters<
          typeof resolveLandingPageModuleCatalogFromRegistry
        >[1],
      );
      assert.ok(resolution.ok, JSON.stringify(resolution));

      const foreignItemEvidence = structuredClone(synthetic);
      const foreignContract = foreignItemEvidence.variantFieldContracts[
        "social_proof.synthetic@v1"
      ];
      const evidenceRef = flattenFields(foreignContract.fields).find(
        (field) => field.fieldKind === "technical_reference",
      );
      assert.ok(evidenceRef);
      foreignContract.fields.push({
        ...(structuredClone(evidenceRef) as MutableField),
        path: "social_proof.synthetic.evidenceRef",
      });
      getMutableTextField(
        foreignItemEvidence,
        "social_proof.synthetic@v1",
        "social_proof.synthetic.items[].body",
      ).copySourceMap.evidencePath =
        "social_proof.synthetic.evidenceRef";
      assertInvalidCatalogFailsClosedWithoutThrow(
        foreignItemEvidence,
        resolverInput,
      );
    },
  },
  {
    name: "combined sources require research and declarative operational support",
    run: () => {
      const validSource = {
        sourceMode: "research_with_operational_support",
        researchPath: "endCustomer.researches[].items[]",
        primaryItemKeys: ["positioning_opportunity", "desire"],
        auxiliaryItemKey: "belief",
        operationalSupport: {
          requirement: "required_when_claimed",
          referenceKeys: ["syntactically_valid_but_not_registered"],
        },
      };
      assert.equal(landingPageCopySourceMapSchema.safeParse(validSource).success, true);

      const missingResearch = structuredClone(validSource) as Record<string, unknown>;
      delete missingResearch.researchPath;
      assert.equal(landingPageCopySourceMapSchema.safeParse(missingResearch).success, false);

      const invalidResearch = structuredClone(validSource);
      invalidResearch.primaryItemKeys = ["unknown", "desire"];
      assert.equal(landingPageCopySourceMapSchema.safeParse(invalidResearch).success, false);

      const missingOperationalSupport = structuredClone(validSource) as Record<string, unknown>;
      delete missingOperationalSupport.operationalSupport;
      assert.equal(
        landingPageCopySourceMapSchema.safeParse(missingOperationalSupport).success,
        false,
      );

      for (const referenceKeys of [
        [],
        [""],
        ["Invalid-Key"],
        ["duplicate_key", "duplicate_key"],
      ]) {
        const invalidReference = structuredClone(validSource);
        invalidReference.operationalSupport.referenceKeys = referenceKeys;
        assert.equal(
          landingPageCopySourceMapSchema.safeParse(invalidReference).success,
          false,
        );
      }

      const incompatiblePolicy = cloneRegistry();
      const benefitTitle = getMutableTextField(
        incompatiblePolicy,
        "benefits.standard@v1",
        "benefits.standard.items[].benefitTitle",
      );
      benefitTitle.policy = "research_guided";
      assertInvalid(incompatiblePolicy);

      const missingFactualSupport = cloneRegistry();
      delete getMutableTextField(
        missingFactualSupport,
        "benefits.standard@v1",
        "benefits.standard.items[].description",
      ).support;
      assertInvalid(missingFactualSupport);
    },
  },
  {
    name: "funnel profiles and module deltas fail closed",
    run: () => {
      assert.deepEqual(Object.keys(landingPageModuleCatalogRegistry.funnelCopyProfiles), ["bofu", "mofu", "tofu"]);
      for (const profileKey of ["bofu", "mofu", "tofu"] as const) {
        const profile = landingPageModuleCatalogRegistry.funnelCopyProfiles[profileKey];
        const classified = [
          ...profile.permittedTreatments,
          ...profile.restrictedTreatments,
          ...profile.prohibitedTreatments,
        ];
        assert.deepEqual(
          [...classified].sort(),
          [...landingPageFunnelTreatmentKeysByProfile[profileKey]].sort(),
        );
        assert.equal(new Set(classified).size, classified.length);
        assert.deepEqual(profile.emphasizeTreatments, []);
      }
      for (const moduleDefinition of Object.values(landingPageModuleCatalogRegistry.modules)) {
        for (const profileKey of ["bofu", "mofu", "tofu"] as const) {
          assert.deepEqual(moduleDefinition.funnelProfileDeltas[profileKey].emphasizeTreatments, []);
        }
      }
      const standardFaqModule = landingPageModuleCatalogRegistry.modules[
        landingPageModuleCatalogRegistry.variants["faq.standard@v1"].moduleKey
      ];
      const accordionFaqModule = landingPageModuleCatalogRegistry.modules[
        landingPageModuleCatalogRegistry.variants["faq.accordion@v1"].moduleKey
      ];
      assert.equal(standardFaqModule, accordionFaqModule);
      assert.equal(standardFaqModule.moduleKey, "faq");
      assert.deepEqual(standardFaqModule.funnelProfileDeltas, accordionFaqModule.funnelProfileDeltas);

      const unknownProfile = cloneRegistry();
      unknownProfile.funnelCopyProfiles.bottom = structuredClone(unknownProfile.funnelCopyProfiles.bofu);
      assertInvalid(unknownProfile);

      const mismatchedCtaMode = cloneRegistry();
      mismatchedCtaMode.funnelCopyProfiles.bofu.ctaMode = "low_pressure";
      assertInvalid(mismatchedCtaMode);

      const duplicateTreatment = cloneRegistry();
      duplicateTreatment.funnelCopyProfiles.bofu.prohibitedTreatments.push("direct_next_step");
      assertInvalid(duplicateTreatment);

      const missingTreatment = cloneRegistry();
      missingTreatment.funnelCopyProfiles.mofu.permittedTreatments.pop();
      assertInvalid(missingTreatment);

      const unknownProfileTreatment = cloneRegistry();
      unknownProfileTreatment.funnelCopyProfiles.tofu.permittedTreatments.push("viral_hook");
      assertInvalid(unknownProfileTreatment);

      const crossProfileClassification = cloneRegistry();
      crossProfileClassification.funnelCopyProfiles.bofu.permittedTreatments.push("education");
      assertInvalid(crossProfileClassification);

      const unknownTreatment = cloneRegistry();
      unknownTreatment.modules.hero.funnelProfileDeltas.bofu.emphasizeTreatments = ["viral_hook"];
      assertInvalid(unknownTreatment);

      const crossProfileTreatment = cloneRegistry();
      crossProfileTreatment.modules.hero.funnelProfileDeltas.tofu.emphasizeTreatments = ["direct_next_step"];
      assertInvalid(crossProfileTreatment);

      const conflictingDelta = cloneRegistry();
      conflictingDelta.modules.hero.funnelProfileDeltas.bofu.restrictTreatments = ["direct_next_step"];
      conflictingDelta.modules.hero.funnelProfileDeltas.bofu.prohibitTreatments = ["direct_next_step"];
      assertInvalid(conflictingDelta);

      const emphasizedProhibition = cloneRegistry();
      emphasizedProhibition.modules.hero.funnelProfileDeltas.bofu.emphasizeTreatments = ["coercion"];
      assertInvalid(emphasizedProhibition);
    },
  },
  {
    name: "new variants preserve closed funnel profiles without implicit emphasis",
    run: () => {
      for (const funnelProfileKey of ["bofu", "mofu", "tofu"] as const) {
        const heroStandard = resolveLandingPageModuleCatalog({
          moduleCatalogVersion: 1,
          rootVersion: 1,
          moduleKey: "hero",
          moduleVersion: 1,
          variantName: "standard",
          variantVersion: 1,
          funnelProfileKey,
        });
        const heroForm = resolveLandingPageModuleCatalog({
          moduleCatalogVersion: 1,
          rootVersion: 1,
          moduleKey: "hero",
          moduleVersion: 1,
          variantName: "form",
          variantVersion: 1,
          funnelProfileKey,
        });
        const benefits = resolveLandingPageModuleCatalog({
          moduleCatalogVersion: 1,
          rootVersion: 1,
          moduleKey: "benefits",
          moduleVersion: 1,
          variantName: "standard",
          variantVersion: 1,
          funnelProfileKey,
        });

        assert.equal(heroStandard.ok && heroForm.ok && benefits.ok, true);
        if (!heroStandard.ok || !heroForm.ok || !benefits.ok) continue;
        assert.deepEqual(
          heroForm.value.funnelCopyProfile,
          heroStandard.value.funnelCopyProfile,
        );
        assert.deepEqual(
          benefits.value.funnelCopyProfile,
          landingPageModuleCatalogRegistry.funnelCopyProfiles[funnelProfileKey],
        );
        assert.deepEqual(heroForm.value.funnelCopyProfile.emphasizeTreatments, []);
        assert.deepEqual(benefits.value.funnelCopyProfile.emphasizeTreatments, []);
        assert.deepEqual(
          landingPageModuleCatalogRegistry.modules.benefits.funnelProfileDeltas[
            funnelProfileKey
          ],
          {
            emphasizeTreatments: [],
            restrictTreatments: [],
            prohibitTreatments: [],
          },
        );
      }
    },
  },
  {
    name: "resolver returns every registered complete isolated variant without fallback",
    run: () => {
      for (const variantKey of Object.keys(
        landingPageModuleCatalogRegistry.variants,
      ) as LandingPageVariantKey[]) {
        const [moduleKey, qualifiedVariant] = variantKey.split(".");
        const [variantName, version] = qualifiedVariant.split("@v");
        const result = resolveLandingPageModuleCatalog({
          moduleCatalogVersion: 1, rootVersion: 1, moduleKey, moduleVersion: 1,
          variantName, variantVersion: Number(version), funnelProfileKey: "mofu",
        });
        assert.equal(result.ok, true);
        if (!result.ok) continue;
        assert.equal(result.value.variant.variantKey, variantKey);
        assert.equal(result.value.module.moduleKey, moduleKey);
        assert.equal(result.value.fieldContract.fieldContractKey, variantKey);
        assert.equal(result.value.funnelCopyProfile.profileKey, "mofu");
        const prefix = variantKey.replace("@v1", "");
        assert.equal(
          flattenFields(result.value.fieldContract.fields as readonly Record<string, unknown>[])
            .every((field) => String(field.path).startsWith(`${prefix}.`)),
          true,
        );
        assertDeeplyFrozen(result.value);
      }

      const first = resolveLandingPageModuleCatalog({ moduleCatalogVersion: 1, rootVersion: 1, moduleKey: "hero", moduleVersion: 1, variantName: "standard", variantVersion: 1, funnelProfileKey: "bofu" });
      const second = resolveLandingPageModuleCatalog({ moduleCatalogVersion: 1, rootVersion: 1, moduleKey: "hero", moduleVersion: 1, variantName: "standard", variantVersion: 1, funnelProfileKey: "bofu" });
      assert.equal(first.ok && second.ok, true);
      if (first.ok && second.ok) {
        assert.notEqual(first.value, second.value);
        assert.notEqual(first.value.module, second.value.module);
        assert.notEqual(first.value.root, second.value.root);
        assert.notEqual(first.value.effectiveRoot, second.value.effectiveRoot);
        assert.notEqual(first.value.variant, second.value.variant);
        assert.notEqual(first.value.fieldContract, second.value.fieldContract);
        assert.notEqual(first.value.funnelCopyProfile, second.value.funnelCopyProfile);
        assert.notEqual(first.value.module, landingPageModuleCatalogRegistry.modules.hero);
        assert.notEqual(first.value.variant, landingPageModuleCatalogRegistry.variants["hero.standard@v1"]);
        assert.notEqual(first.value.fieldContract, landingPageModuleCatalogRegistry.variantFieldContracts["hero.standard@v1"]);
        assert.notEqual(first.value.funnelCopyProfile, landingPageModuleCatalogRegistry.funnelCopyProfiles.bofu);
        const canonicalRoot = resolveLandingPageRootParameters({ rootVersion: 1 });
        assert.equal(canonicalRoot.ok, true);
        if (canonicalRoot.ok) assert.notEqual(first.value.root, canonicalRoot.value);
      }

      const hero = resolveLandingPageModuleCatalog({ moduleCatalogVersion: 1, rootVersion: 1, moduleKey: "hero", moduleVersion: 1, variantName: "standard", variantVersion: 1, funnelProfileKey: "bofu" });
      const faq = resolveLandingPageModuleCatalog({ moduleCatalogVersion: 1, rootVersion: 1, moduleKey: "faq", moduleVersion: 1, variantName: "standard", variantVersion: 1, funnelProfileKey: "bofu" });
      assert.equal(hero.ok && faq.ok, true);
      if (hero.ok && faq.ok) {
        const heroMaps = flattenFields(hero.value.fieldContract.fields as readonly Record<string, unknown>[]).map((field) => field.copySourceMap).filter(Boolean);
        const faqMaps = flattenFields(faq.value.fieldContract.fields as readonly Record<string, unknown>[]).map((field) => field.copySourceMap).filter(Boolean);
        assert.equal(JSON.stringify(heroMaps).includes("faq_questions"), false);
        assert.equal(JSON.stringify(heroMaps).includes("commercial_keywords"), true);
        assert.equal(JSON.stringify(faqMaps).includes("faq_questions"), true);
      }
    },
  },
  {
    name: "resolver identities versions and compatibility fail closed",
    run: () => {
      const base = { moduleCatalogVersion: 1, rootVersion: 1, moduleKey: "hero", moduleVersion: 1, variantName: "standard", variantVersion: 1, funnelProfileKey: "bofu" };
      for (const [patch, code] of [
        [{ moduleCatalogVersion: 2 }, "UNKNOWN_MODULE_CATALOG_VERSION"],
        [{ rootVersion: 2 }, "INCOMPATIBLE_ROOT_VERSION"],
        [{ moduleKey: "unknown" }, "UNKNOWN_MODULE"],
        [{ moduleVersion: 2 }, "UNKNOWN_MODULE_VERSION"],
        [{ variantName: "unknown" }, "UNKNOWN_VARIANT"],
        [{ variantVersion: 2 }, "UNKNOWN_VARIANT"],
        [{ funnelProfileKey: "bottom" }, "UNKNOWN_FUNNEL_PROFILE"],
      ] as const) {
        const result = resolveLandingPageModuleCatalog({ ...base, ...patch });
        assert.equal(result.ok, false);
        if (!result.ok) assert.equal(result.error.code, code);
      }
      assert.deepEqual(Object.keys(publicModuleCatalog).sort(), ["resolveLandingPageModuleCatalog"]);
      assert.equal("landingPageModuleCatalogRegistry" in publicModuleCatalog, false);
      assert.equal("landingPageModuleCatalogSchema" in publicModuleCatalog, false);
    },
  },
  {
    name: "resolver input presets and effective deltas are strict and explicit",
    run: () => {
      const base = { moduleCatalogVersion: 1, rootVersion: 1, moduleKey: "hero", moduleVersion: 1, variantName: "standard", variantVersion: 1, funnelProfileKey: "bofu" };
      for (const malformed of [null, [], "hero", 1, {}, { ...base, extra: true }, { ...base, moduleVersion: "1" }, { ...base, moduleKey: null }]) {
        assert.doesNotThrow(() => resolveLandingPageModuleCatalog(malformed));
        const result = resolveLandingPageModuleCatalog(malformed);
        assert.equal(result.ok, false);
        if (!result.ok) assert.equal(result.error.code, "INVALID_INPUT");
      }

      for (const rootPresetKey of ["balanced", "compact"] as const) {
        const result = resolveLandingPageModuleCatalog({ ...base, rootPresetKey });
        assert.equal(result.ok, true);
        if (result.ok) {
          assert.equal(result.value.root.resolvedPresetKey, rootPresetKey);
          assert.equal(result.value.effectiveRoot.resolvedPresetKey, rootPresetKey);
        }
      }
      const unknownPreset = resolveLandingPageModuleCatalog({ ...base, rootPresetKey: "wide" });
      assert.equal(unknownPreset.ok, false);
      if (!unknownPreset.ok) assert.equal(unknownPreset.error.code, "UNKNOWN_ROOT_PRESET");

      const specialized = cloneRegistry();
      specialized.modules.hero.rootDelta = { textRanges: [{ semanticRole: "h1", recommended: { min: 40, max: 60 }, absoluteMax: 100 }] };
      specialized.variants["hero.standard@v1"].rootDelta = { textRanges: [{ semanticRole: "h1", recommended: { min: 45, max: 55 }, absoluteMax: 90 }] };
      specialized.modules.hero.funnelProfileDeltas.bofu.restrictTreatments = ["direct_next_step"];
      specialized.modules.hero.funnelProfileDeltas.bofu.prohibitTreatments = ["supported_urgency"];
      const result = resolveLandingPageModuleCatalogFromRegistry(base, specialized as unknown as Parameters<typeof resolveLandingPageModuleCatalogFromRegistry>[1]);
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.deepEqual(result.value.effectiveRoot.semanticRoles.h1.textRange.recommended, { min: 45, max: 55 });
        assert.equal(result.value.effectiveRoot.semanticRoles.h1.textRange.absoluteMax, 90);
        assert.equal(result.value.root.semanticRoles.h1.textRange.absoluteMax > 90, true);
        assert.equal(result.value.funnelCopyProfile.permittedTreatments.includes("direct_next_step"), false);
        assert.equal(result.value.funnelCopyProfile.restrictedTreatments.includes("direct_next_step"), true);
        assert.equal(result.value.funnelCopyProfile.restrictedTreatments.includes("supported_urgency"), false);
        assert.equal(result.value.funnelCopyProfile.prohibitedTreatments.includes("supported_urgency"), true);
      }
    },
  },
  {
    name: "canonical lifecycle vocabulary is accepted without composition enforcement",
    run: () => {
      for (const lifecycleStatus of ["validated", "deprecated"]) {
        const historical = cloneRegistry();
        historical.modules.hero.lifecycleStatus = lifecycleStatus;
        historical.variants["hero.standard@v1"].lifecycleStatus = lifecycleStatus;
        assert.equal(landingPageModuleCatalogSchema.safeParse(historical).success, true);
      }
      const unknown = cloneRegistry();
      unknown.modules.hero.lifecycleStatus = "retired";
      assertInvalid(unknown);
    },
  },
];

for (const testCase of cases) {
  testCase.run();
  console.log(`PASS ${testCase.name}`);
}

console.log(`PASS ${cases.length} landing-page module catalog validation cases`);

function cloneRegistry(): MutableCatalog {
  return structuredClone(
    landingPageModuleCatalogRegistry,
  ) as unknown as MutableCatalog;
}

function cloneModule(moduleKey: LandingPageModuleKey): MutableModule {
  return structuredClone(
    landingPageModuleCatalogRegistry.modules[moduleKey],
  ) as unknown as MutableModule;
}

function assertDeeplyFrozen(value: unknown): void {
  if (!value || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  for (const nested of Object.values(value)) assertDeeplyFrozen(nested);
}

function collectFieldKinds(field: Record<string, unknown>, kinds: Set<string>) {
  assert.equal(typeof field.fieldKind, "string");
  kinds.add(field.fieldKind as string);
  if (Array.isArray(field.itemFields)) {
    for (const itemField of field.itemFields) collectFieldKinds(itemField, kinds);
  }
  if (field.label && typeof field.label === "object") {
    collectFieldKinds(field.label as Record<string, unknown>, kinds);
  }
}

function flattenFields(fields: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  return fields.flatMap((field) => [
    field,
    ...(Array.isArray(field.itemFields) ? flattenFields(field.itemFields) : []),
    ...(field.label && typeof field.label === "object" ? flattenFields([field.label as Record<string, unknown>]) : []),
  ]);
}

function getMutableTextField(catalog: MutableCatalog, contractKey: string, path: string): MutableField {
  const field = flattenFields(catalog.variantFieldContracts[contractKey].fields).find((candidate) => candidate.path === path);
  assert.ok(field);
  return field as MutableField;
}

function cloneField(
  contractKey: string,
  fieldIndex: number,
): MutableField {
  return structuredClone(
    landingPageModuleCatalogRegistry.variantFieldContracts[
      contractKey as keyof typeof landingPageModuleCatalogRegistry.variantFieldContracts
    ].fields[fieldIndex],
  ) as unknown as MutableField;
}

function getMutableInteraction(
  catalog: MutableCatalog,
  variantKey: string,
  kind: string,
): MutableInteraction {
  const interaction = catalog.variants[variantKey].interactionContracts.find(
    (contract) => contract.kind === kind,
  );
  assert.ok(interaction);
  return interaction;
}

function assertRequiredTrueInteractionPropertiesFailClosed(
  variantKey: string,
  kind: string,
  requirements: readonly string[],
  nestedProperty?: string,
): void {
  for (const requirement of requirements) {
    for (const mutation of ["false", "missing"] as const) {
      const catalog = cloneRegistry();
      const interaction = getMutableInteraction(catalog, variantKey, kind);
      const target = nestedProperty
        ? (interaction[nestedProperty] as Record<string, unknown>)
        : interaction;
      assert.ok(target);
      if (mutation === "false") target[requirement] = false;
      else delete target[requirement];
      assertInvalid(catalog);
    }
  }
}

function addSyntheticVariant(
  catalog: MutableCatalog,
  variantKey: string,
  sourceVariantKey: LandingPageVariantKey,
  interactionSourceVariantKey?: string,
  interactionKind?: string,
): void {
  const sourceContract = structuredClone(
    catalog.variantFieldContracts[sourceVariantKey],
  );
  const sourcePrefix = sourceVariantKey.replace("@v1", "");
  const targetPrefix = variantKey.replace("@v1", "");
  sourceContract.fieldContractKey = variantKey;
  for (const field of flattenFields(sourceContract.fields)) {
    field.path = String(field.path).replace(sourcePrefix, targetPrefix);
    const sourceMap = field.copySourceMap as Record<string, unknown> | undefined;
    if (typeof sourceMap?.evidencePath === "string") {
      sourceMap.evidencePath = sourceMap.evidencePath.replace(
        sourcePrefix,
        targetPrefix,
      );
    }
  }
  catalog.variantFieldContracts[variantKey] = sourceContract;

  const [moduleKey, qualifiedVariant] = variantKey.split(".");
  const variant = cloneVariant(sourceVariantKey);
  variant.variantKey = variantKey;
  variant.variantName = qualifiedVariant.replace("@v1", "");
  variant.moduleKey = moduleKey;
  variant.fieldContractKey = variantKey;
  assert.equal(Boolean(interactionSourceVariantKey), Boolean(interactionKind));
  variant.interactionContracts = interactionSourceVariantKey && interactionKind
    ? [
        structuredClone(
          getMutableInteraction(
            catalog,
            interactionSourceVariantKey,
            interactionKind,
          ),
        ),
      ]
    : [];
  variant.capabilities = [
    ...deriveLandingPageVariantCapabilities(
      sourceContract.fields as unknown as Parameters<
        typeof deriveLandingPageVariantCapabilities
      >[0],
      variant.interactionContracts as unknown as Parameters<
        typeof deriveLandingPageVariantCapabilities
      >[1],
    ),
  ];
  catalog.variants[variantKey] = variant;
}

function cloneVariant(variantKey: LandingPageVariantKey): MutableVariant {
  return structuredClone(
    landingPageModuleCatalogRegistry.variants[variantKey],
  ) as unknown as MutableVariant;
}

function normalizeFaqFieldPaths(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value).replace(/faq\.(?:standard|accordion)/g, "faq.variant"),
  );
}

function assertInvalid(catalog: MutableCatalog): void {
  assert.equal(landingPageModuleCatalogSchema.safeParse(catalog).success, false);
}

function assertInvalidCatalogFailsClosedWithoutThrow(
  catalog: MutableCatalog,
  input: Parameters<typeof resolveLandingPageModuleCatalogFromRegistry>[0],
): void {
  assert.doesNotThrow(() => landingPageModuleCatalogSchema.safeParse(catalog));
  assertInvalid(catalog);

  let resolution: ReturnType<
    typeof resolveLandingPageModuleCatalogFromRegistry
  > | undefined;
  assert.doesNotThrow(() => {
    resolution = resolveLandingPageModuleCatalogFromRegistry(
      input,
      catalog as unknown as Parameters<
        typeof resolveLandingPageModuleCatalogFromRegistry
      >[1],
    );
  });
  assert.ok(resolution);
  assert.equal(resolution.ok, false);
  if (!resolution.ok) {
    assert.equal(resolution.error.code, "INVALID_MODULE_CATALOG_CONTRACT");
  }
}

function expectedResearch(
  primaryItemKeys: readonly [string, string?],
  auxiliaryItemKey?: string,
) {
  return {
    sourceMode: "research",
    researchPath: "endCustomer.researches[].items[]",
    primaryItemKeys,
    ...(auxiliaryItemKey ? { auxiliaryItemKey } : {}),
  };
}

function expectedEvidence(evidencePath: string) {
  return { sourceMode: "operational_evidence", evidencePath };
}

type MutableModule = {
  family: string;
  moduleKey: string;
  moduleVersion: number;
  lifecycleStatus: string;
  purpose: string;
  compatibleRootVersion: number;
  rootDelta: MutableRootDelta;
  funnelProfileDeltas: Record<string, MutableFunnelDelta>;
  structuralFunction: string;
  invariants: string[];
  boundaries: string[];
  permittedInteractionKinds: string[];
  [key: string]: unknown;
};

type MutableCatalog = {
  family: string;
  moduleCatalogVersion: number;
  compatibleRootVersions: number[];
  funnelCopyProfiles: Record<string, MutableFunnelProfile>;
  modules: Record<string, MutableModule>;
  variantFieldContracts: Record<
    string,
    {
      fieldContractKey: string;
      fields: MutableField[];
    }
  >;
  variants: Record<string, MutableVariant>;
};

type MutableField = {
  fieldKind: string;
  fieldKey: string;
  path: string;
  cardinality: { min: number; max: number };
  policy: string;
  semanticRole?: string;
  support?: string;
  copySourceMap: {
    sourceMode: string;
    researchPath?: string;
    primaryItemKeys?: string[];
    auxiliaryItemKey?: string;
    evidencePath?: string;
    operationalSupport?: {
      requirement?: string;
      referenceKeys?: string[];
    };
  };
  itemFields?: MutableField[];
  label?: MutableField;
  operationalBinding?: string;
  destination?: string;
  [key: string]: unknown;
};

type MutableVariant = {
  variantKey: string;
  variantName: string;
  variantVersion: number;
  moduleKey: string;
  moduleVersion: number;
  fieldContractKey: string;
  lifecycleStatus: string;
  purpose: string;
  compatibleRootVersion: number;
  rootDelta: MutableRootDelta;
  capabilities: string[];
  interactionContracts: MutableInteraction[];
  fallbackChannel?: string;
  creationMotivation?: string;
  [key: string]: unknown;
};

type MutableInteraction = {
  kind: string;
  fields?: Record<string, unknown>[];
  consent?: Record<string, unknown>;
  accessibility?: Record<string, string | boolean>;
  operationalBinding?: Record<string, string>;
  [key: string]: unknown;
};

type MutableRootDelta = {
  textRanges: Array<{
    semanticRole: string;
    recommended?: { min: number; max: number };
    absoluteMax?: number;
  }>;
};

type MutableFunnelDelta = {
  emphasizeTreatments: string[];
  restrictTreatments: string[];
  prohibitTreatments: string[];
};

type MutableFunnelProfile = {
  profileKey: string;
  prioritizedSources: string[];
  permittedTreatments: string[];
  restrictedTreatments: string[];
  prohibitedTreatments: string[];
  emphasizeTreatments: string[];
  ctaMode: string;
};
