import assert from "node:assert/strict";

import type {
  LandingPageInputCatalogLayer,
  LandingPageInputCatalogLayerEntry,
  LandingPageInputCatalogRegistry,
  LandingPageInputFieldDefinition,
  LandingPageInputFieldSpecialization,
  ResolveLandingPageInputCatalogInput,
  ResolvedLandingPageInputField,
} from "./contracts";
import {
  landingPageInputCatalogRegistry,
  mediumStandardRealEstateBrokerTaxon,
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
} from "./registry";
import {
  resolveLandingPageInputCatalog,
  resolveLandingPageInputCatalogFromRegistry,
} from "./resolver";
import { buildLandingPageInputCatalogTaxonChain } from "./taxon-chain";
import {
  landingPageInputFieldDefinitionSchema,
  validateLandingPageInputValue,
} from "./schema";

type Case = Readonly<{ name: string; run: () => void }>;

const baseInput: ResolveLandingPageInputCatalogInput = {
  version: 1,
  plan: "starter",
  taxonChain: {
    segment: realEstateSegmentTaxon,
    niche: realEstateBrokerNicheTaxon,
    ultraNiche: mediumStandardRealEstateBrokerTaxon,
  },
};

const v2Input: ResolveLandingPageInputCatalogInput = {
  ...baseInput,
  version: 2,
};

const v3Input: ResolveLandingPageInputCatalogInput = {
  ...baseInput,
  version: 3,
};

const v4Input: ResolveLandingPageInputCatalogInput = {
  ...baseInput,
  version: 4,
};

const starterV2FieldKeys = [
  "primary_service_or_offer",
  "primary_service_or_offer_description",
  "brand_logo_asset",
  "brand_color_palette",
] as const;

const cases: Case[] = [
  {
    name: "public taxon chain builder normalizes segment niche and ultra-niche",
    run: () => {
      const result = buildLandingPageInputCatalogTaxonChain(
        mediumStandardRealEstateBrokerTaxon,
        [realEstateSegmentTaxon, realEstateBrokerNicheTaxon, mediumStandardRealEstateBrokerTaxon],
      );
      assert.equal(result.ok, true);
      if (!result.ok) throw new Error("Expected valid taxon chain");
      assert.deepEqual(result.value, baseInput.taxonChain);
      assert.equal(
        buildLandingPageInputCatalogTaxonChain(
          { ...realEstateBrokerNicheTaxon, parentId: "missing" },
          [realEstateSegmentTaxon],
        ).ok,
        false,
      );
    },
  },
  {
    name: "registry v1 resolves all 19 ordered fields without operational context",
    run: () => {
      const result = resolveLandingPageInputCatalog(baseInput);
      assert.equal(result.ok, true);
      assert.equal(result.value.valid, true);
      assert.equal(result.value.fields.length, 19);
      assert.deepEqual(result.value.fields.map((field) => field.fieldKey), [
        "business_display_name", "funnel_stage", "traffic_source", "primary_conversion_channel",
        "whatsapp_destination", "phone_destination", "email_destination", "external_url_destination",
        "privacy_policy_url", "paid_search_keyword_map", "service_locations", "property_types",
        "property_price_range", "property_stage", "transaction_intent", "financing_support_available",
        "document_support_available", "creci_registration", "attendance_modes",
      ]);
    },
  },
  {
    name: "unknown version fails closed",
    run: () => assertError({ ...baseInput, version: 999 }, "UNKNOWN_VERSION"),
  },
  {
    name: "registry v2 resolves 23 fields with four deterministic Starter additions",
    run: () => {
      const result = resolveLandingPageInputCatalog(v2Input);
      assert.equal(result.ok, true);
      assert.equal(result.value.version, 2);
      assert.equal(result.value.fields.length, 23);
      assert.deepEqual(
        result.value.fields.slice(1, 5).map((field) => field.fieldKey),
        starterV2FieldKeys,
      );
      assert.deepEqual(
        result.value.fields
          .filter((field) => field.createdInVersion === 1)
          .map((field) => field.fieldKey),
        resolveRequired(baseInput).fields.map((field) => field.fieldKey),
      );
    },
  },
  {
    name: "v2 Starter fields preserve metadata and explicit substitution policy",
    run: () => {
      const result = resolveRequired(v2Input);
      const expected = {
        primary_service_or_offer: ["offer", "offer_provided", "required", "forbidden"],
        primary_service_or_offer_description: ["offer", "offer_provided", "required", "forbidden"],
        brand_logo_asset: ["business", "business_provided", "optional", "forbidden"],
        brand_color_palette: ["business", "business_provided", "required", "explicit_allowed"],
      } as const;

      for (const [fieldKey, [valueScope, expectedValueOrigin, obligation, substitutionPolicy]] of Object.entries(expected)) {
        const field = result.fields.find((candidate) => candidate.fieldKey === fieldKey);
        assert.ok(field);
        assert.equal(field.valueScope, valueScope);
        assert.equal(field.expectedValueOrigin, expectedValueOrigin);
        assert.equal(field.obligation, obligation);
        assert.deepEqual(field.allowedPlans, ["starter", "lite", "pro", "ultra"]);
        assert.equal(field.createdInVersion, 2);
        assert.equal(field.snapshotPolicy, "include_if_used");
        assert.equal(field.landingPageSubstitutionPolicy, substitutionPolicy);
      }
    },
  },
  {
    name: "v3 preserves v2 structure and adds only the two approved capability bindings",
    run: () => {
      const v2 = resolveRequired(v2Input);
      const v3 = resolveRequired(v3Input);
      assert.equal(v3.version, 3);
      assert.equal(v3.fields.length, 23);
      assert.deepEqual(
        v3.fields.map(withoutCapabilityBindings),
        v2.fields.map(withoutCapabilityBindings),
      );
      assert.equal(
        v2.fields.some((field) => field.capabilityBindings !== undefined),
        false,
      );
      const boundFields = v3.fields.filter(
        (field) => field.capabilityBindings !== undefined,
      );
      assert.deepEqual(
        boundFields.map((field) => field.fieldKey),
        ["financing_support_available", "document_support_available"],
      );
      for (const field of boundFields) {
        assert.deepEqual(field.capabilityBindings, [
          { slotKey: "applicable_capabilities", supportedWhenValue: true },
        ]);
      }
      assert.equal(
        landingPageInputFieldDefinitionSchema.safeParse({
          ...fixtureField("non_boolean_binding"),
          capabilityBindings: [
            { slotKey: "applicable_capabilities", supportedWhenValue: true },
          ],
        }).success,
        false,
      );
      assert.equal(
        landingPageInputFieldDefinitionSchema.safeParse({
          ...boundFields[0],
          capabilityBindings: [
            { slotKey: "applicable_capabilities", supportedWhenValue: false },
          ],
        }).success,
        false,
      );
    },
  },
  {
    name: "v4 preserves v1 through v3 and adds only rent to transaction intent",
    run: () => {
      const priorInputs = [baseInput, v2Input, v3Input];
      for (const input of priorInputs) {
        const prior = resolveRequired(input);
        const transactionIntent = prior.fields.find(
          (field) => field.fieldKey === "transaction_intent",
        );
        assert.ok(transactionIntent);
        assert.deepEqual(transactionIntent.validation, {
          kind: "enum",
          allowedValues: ["buy", "sell", "valuation", "mixed"],
        });
        assert.equal(validateLandingPageInputValue(transactionIntent, "rent").ok, false);
      }

      const v3 = resolveRequired(v3Input);
      const v4 = resolveRequired(v4Input);
      assert.equal(v4.version, 4);
      assert.equal(v4.fields.length, 23);

      for (const v4Field of v4.fields) {
        const v3Field = v3.fields.find(
          (candidate) => candidate.fieldKey === v4Field.fieldKey,
        );
        assert.ok(v3Field);
        if (v4Field.fieldKey !== "transaction_intent") {
          assert.deepEqual(v4Field, v3Field);
          continue;
        }

        const { validation: v3Validation, evidence: v3Evidence, ...v3Rest } = v3Field;
        const { validation: v4Validation, evidence: v4Evidence, ...v4Rest } = v4Field;
        assert.deepEqual(v4Rest, v3Rest);
        assert.deepEqual(v3Validation, {
          kind: "enum",
          allowedValues: ["buy", "sell", "valuation", "mixed"],
        });
        assert.deepEqual(v4Validation, {
          kind: "enum",
          allowedValues: ["buy", "sell", "valuation", "mixed", "rent"],
        });
        assert.notDeepEqual(v4Evidence, v3Evidence);
        assert.equal(v4Evidence.summary.includes("locação exclusiva"), true);
        assert.equal(validateLandingPageInputValue(v4Field, "rent").ok, true);
      }

      const planSnapshots = ["starter", "lite", "pro", "ultra"].map((plan) =>
        resolveRequired({ ...v4Input, plan }).fields,
      );
      for (const snapshot of planSnapshots.slice(1)) {
        assert.deepEqual(snapshot, planSnapshots[0]);
      }
    },
  },
  {
    name: "v2 substitution policy is mandatory known and compatible with field scope",
    run: () => {
      const baseV2Fixture = { ...fixtureField("v2_policy_fixture"), createdInVersion: 2 };
      assert.equal(landingPageInputFieldDefinitionSchema.safeParse(baseV2Fixture).success, false);
      assert.equal(
        landingPageInputFieldDefinitionSchema.safeParse({
          ...baseV2Fixture,
          landingPageSubstitutionPolicy: "unknown",
        }).success,
        false,
      );
      assert.equal(
        landingPageInputFieldDefinitionSchema.safeParse({
          ...baseV2Fixture,
          valueScope: "landing_page",
          expectedValueOrigin: "landing_page_provided",
          landingPageSubstitutionPolicy: "forbidden",
        }).success,
        false,
      );
      assert.equal(
        landingPageInputFieldDefinitionSchema.safeParse({
          ...baseV2Fixture,
          landingPageSubstitutionPolicy: "not_applicable",
        }).success,
        false,
      );
      assert.equal(
        landingPageInputFieldDefinitionSchema.safeParse({
          ...baseV2Fixture,
          valueScope: "landing_page",
          expectedValueOrigin: "landing_page_provided",
          landingPageSubstitutionPolicy: "not_applicable",
        }).success,
        true,
      );
    },
  },
  {
    name: "v2 required text fields reject empty strings without invented length limits",
    run: () => {
      const fields = resolveRequired(v2Input).fields;
      for (const fieldKey of [
        "primary_service_or_offer",
        "primary_service_or_offer_description",
      ]) {
        const field = fields.find((candidate) => candidate.fieldKey === fieldKey);
        assert.ok(field);
        assert.equal(validateLandingPageInputValue(field, "").ok, false);
        assert.equal(validateLandingPageInputValue(field, "   ").ok, false);
        assert.equal(validateLandingPageInputValue(field, "X").ok, true);
      }
    },
  },
  {
    name: "v2 brand asset accepts only a strict opaque asset reference",
    run: () => {
      const field = resolveRequired(v2Input).fields.find(
        (candidate) => candidate.fieldKey === "brand_logo_asset",
      );
      assert.ok(field);
      assert.equal(validateLandingPageInputValue(field, { asset_id: "asset_123" }).ok, true);
      for (const invalidValue of [
        "asset_123",
        "https://example.com/logo.png",
        {},
        { asset_id: "" },
        { asset_id: "https://example.com/logo.png" },
        { asset_id: "https:example.com/logo.png" },
        { asset_id: "//example.com/logo.png" },
        { asset_id: "data:image/png;base64,AAAA" },
        { asset_id: "mailto:logo@example.com" },
        { asset_id: "s3://bucket/logo.png" },
        { asset_id: "\\\\server\\logo.png" },
        { asset_id: "asset_123", url: "https://example.com/logo.png" },
      ]) {
        assert.equal(validateLandingPageInputValue(field, invalidValue).ok, false);
      }
    },
  },
  {
    name: "v2 brand palette requires exactly five hexadecimal roles",
    run: () => {
      const field = resolveRequired(v2Input).fields.find(
        (candidate) => candidate.fieldKey === "brand_color_palette",
      );
      assert.ok(field);
      const validPalette = {
        primary: "#123456",
        secondary: "#ABCDEF",
        accent: "#fedcba",
        background: "#FFFFFF",
        text: "#000000",
      };
      const missingTextPalette = {
        primary: validPalette.primary,
        secondary: validPalette.secondary,
        accent: validPalette.accent,
        background: validPalette.background,
      };
      assert.equal(validateLandingPageInputValue(field, validPalette).ok, true);
      assert.equal(
        validateLandingPageInputValue(field, missingTextPalette).ok,
        false,
      );
      assert.equal(
        validateLandingPageInputValue(field, { ...validPalette, extra: "#111111" }).ok,
        false,
      );
      assert.equal(
        validateLandingPageInputValue(field, { ...validPalette, accent: "123456" }).ok,
        false,
      );
      assert.equal(
        validateLandingPageInputValue(field, { ...validPalette, accent: "#12345G" }).ok,
        false,
      );
    },
  },
  {
    name: "unknown plan fails closed",
    run: () => assertError({ ...baseInput, plan: "enterprise" }, "INVALID_PLAN"),
  },
  {
    name: "inactive or out-of-order taxon chain fails closed",
    run: () => {
      assertError({
        ...baseInput,
        taxonChain: {
          ...baseInput.taxonChain,
          niche: { ...realEstateBrokerNicheTaxon, isActive: false },
        },
      }, "INVALID_TAXON_CHAIN");
      assertError({
        ...baseInput,
        taxonChain: {
          ...baseInput.taxonChain,
          niche: { ...realEstateBrokerNicheTaxon, parentId: mediumStandardRealEstateBrokerTaxon.id },
        },
      }, "INVALID_TAXON_CHAIN");
    },
  },
  {
    name: "taxon name mismatch between chain and registered layer fails closed",
    run: () => {
      assertError({
        ...baseInput,
        taxonChain: {
          ...baseInput.taxonChain,
          niche: { ...realEstateBrokerNicheTaxon, name: "Nome divergente" },
        },
      }, "INVALID_LAYER");
    },
  },
  {
    name: "valid universal catalog resolves without a registered taxon layer",
    run: () => {
      const result = resolveLandingPageInputCatalog({
        version: 1,
        plan: "starter",
        taxonChain: {
          segment: { ...realEstateSegmentTaxon, id: "11111111-1111-4111-8111-111111111111", slug: "outro-segmento", name: "Outro segmento" },
        },
      });
      assert.equal(result.ok, true);
      assert.equal(result.value.fields.length, 10);
    },
  },
  {
    name: "segment and niche layers append fields deterministically",
    run: () => {
      const result = resolveLandingPageInputCatalog({ ...baseInput, taxonChain: { segment: realEstateSegmentTaxon, niche: realEstateBrokerNicheTaxon } });
      assert.equal(result.ok, true);
      assert.equal(result.value.fields[9].fieldKey, "paid_search_keyword_map");
      assert.equal(result.value.fields[10].fieldKey, "service_locations");
      assert.equal(result.value.fields[14].fieldKey, "transaction_intent");
    },
  },
  {
    name: "ultra-niche without its own layer inherits completely",
    run: () => {
      const result = resolveLandingPageInputCatalog(baseInput);
      assert.equal(result.ok, true);
      assert.equal(result.value.servedTaxon.slug, "corretor-de-imoveis-de-medio-padrao");
      assert.deepEqual(result.value.appliedLayers.map((layer) => layer.level), ["universal", "segment", "niche"]);
    },
  },
  {
    name: "authorized ultra-niche layer resolves and unauthorized layer fails",
    run: () => {
      const registry = cloneRegistry();
      mutableTaxonLayers(registry)[mediumStandardRealEstateBrokerTaxon.slug] = ultraLayer();
      assertRegistryError(baseInput, registry, "UNAUTHORIZED_ULTRA_NICHE_LAYER");
      const result = resolveLandingPageInputCatalogFromRegistry({ ...baseInput, ultraNicheLayerAuthorized: true }, registry);
      assert.equal(result.ok, true);
      assert.equal(result.value.fields.at(-1)?.fieldKey, "authorized_ultra_fixture");
    },
  },
  {
    name: "new lower-layer field appends at the end of that layer",
    run: () => {
      const registry = cloneRegistry();
      mutableEntries(segmentLayer(registry)).push(fixtureField("segment_fixture", "segment", realEstateSegmentTaxon));
      const result = resolveLandingPageInputCatalogFromRegistry(baseInput, registry);
      assert.equal(result.ok, true);
      assert.equal(result.value.fields[14].fieldKey, "segment_fixture");
      assert.equal(result.value.fields[15].fieldKey, "transaction_intent");
    },
  },
  {
    name: "field origin layer must match its containing layer",
    run: () => {
      const registry = cloneRegistry();
      mutableLayerField(segmentLayer(registry), "service_locations").originLayer = "niche";
      assertRegistryError(baseInput, registry, "INVALID_LAYER");
    },
  },
  {
    name: "field origin taxon must exactly match its containing layer taxon",
    run: () => {
      const registry = cloneRegistry();
      mutableLayerField(segmentLayer(registry), "service_locations").originTaxon = {
        ...realEstateSegmentTaxon,
        name: "Imobiliário divergente",
      };
      assertRegistryError(baseInput, registry, "INVALID_LAYER");

      const universalRegistry = cloneRegistry();
      mutableUniversalField(universalRegistry, "business_display_name").originTaxon = realEstateSegmentTaxon;
      assertRegistryError(baseInput, universalRegistry, "INVALID_LAYER");
    },
  },
  {
    name: "duplicate field without specialization fails closed",
    run: () => {
      const registry = cloneRegistry();
      mutableEntries(segmentLayer(registry)).push({
        ...fixtureField("business_display_name", "segment", realEstateSegmentTaxon),
      });
      assertRegistryError(baseInput, registry, "DUPLICATE_FIELD");
    },
  },
  {
    name: "valid specialization in a lower layer preserves position and inherited properties",
    run: () => {
      const registry = withNicheSpecialization("traffic_source", { obligation: "required" });
      const result = resolveLandingPageInputCatalogFromRegistry(baseInput, registry);
      assert.equal(result.ok, true);
      const field = result.value.fields[2];
      assert.equal(field.fieldKey, "traffic_source");
      assert.equal(field.valueType, "enum");
      assert.equal(field.obligation, "required");
      assert.deepEqual(field.provenance.map((item) => item.property), ["definition", "obligation"]);
    },
  },
  {
    name: "field followed by specialization in the same layer fails closed",
    run: () => {
      const registry = cloneRegistry();
      mutableEntries(segmentLayer(registry)).push(
        specialization("service_locations", { obligation: "required" }),
      );
      assertRegistryError(baseInput, registry, "INVALID_SPECIALIZATION");
    },
  },
  {
    name: "two specializations of the same field in one layer fail closed",
    run: () => {
      const registry = cloneRegistry();
      mutableEntries(segmentLayer(registry)).push(
        specialization("traffic_source", { obligation: "required" }),
        specialization("traffic_source", {
          validation: { kind: "enum", allowedValues: ["paid_search", "organic"] },
        }),
      );
      assertRegistryError(baseInput, registry, "INVALID_SPECIALIZATION");
    },
  },
  {
    name: "immutable identity type scope origin condition snapshot and evidence changes fail",
    run: () => {
      for (const changes of [
        { purpose: "changed" }, { valueType: "string" }, { valueScope: "account" },
        { expectedValueOrigin: "account_provided" }, { applicableWhen: { fieldKey: "funnel_stage", operator: "equals", value: "bofu" } },
        { snapshotPolicy: "other" }, { evidence: { summary: "changed", references: ["decision:lp-planning"] } },
      ]) {
        assertRegistryError(baseInput, withNicheSpecialization("traffic_source", changes), "IMMUTABLE_PROPERTY_CONFLICT");
      }
    },
  },
  {
    name: "taxon specialization cannot change landing-page substitution policy",
    run: () => {
      const registry = cloneRegistry();
      mutableEntries(registry[2].taxonLayers[realEstateBrokerNicheTaxon.slug]).push(
        specialization("brand_color_palette", {
          landingPageSubstitutionPolicy: "forbidden",
        }),
      );
      assertRegistryError(v2Input, registry, "IMMUTABLE_PROPERTY_CONFLICT");
    },
  },
  {
    name: "more restrictive obligation is accepted and relaxation fails",
    run: () => {
      assert.equal(resolveLandingPageInputCatalogFromRegistry(baseInput, withNicheSpecialization("traffic_source", { obligation: "required" })).ok, true);
      assertRegistryError(baseInput, withNicheSpecialization("business_display_name", { obligation: "optional" }), "INVALID_SPECIALIZATION");
    },
  },
  {
    name: "enum subset is accepted and expansion fails",
    run: () => {
      const reduced = withNicheSpecialization("traffic_source", { validation: { kind: "enum", allowedValues: ["paid_search", "organic"] } });
      assert.equal(resolveLandingPageInputCatalogFromRegistry(baseInput, reduced).ok, true);
      const expanded = withNicheSpecialization("traffic_source", { validation: { kind: "enum", allowedValues: ["paid_search", "paid_social", "organic", "whatsapp", "qr_code", "other", "partner"] } });
      assertRegistryError(baseInput, expanded, "INVALID_SPECIALIZATION");
    },
  },
  {
    name: "plan subset is accepted and expansion fails",
    run: () => {
      const reduced = withNicheSpecialization("business_display_name", { allowedPlans: ["starter", "lite"] });
      assert.equal(resolveLandingPageInputCatalogFromRegistry(baseInput, reduced).ok, true);
      const inheritedSubset = cloneRegistry();
      mutableEntries(segmentLayer(inheritedSubset)).push(
        specialization("business_display_name", { allowedPlans: ["starter", "lite"] }),
      );
      mutableEntries(nicheLayer(inheritedSubset)).push(specialization("business_display_name", { allowedPlans: ["starter", "lite", "pro"] }));
      assertRegistryError(baseInput, inheritedSubset, "INVALID_SPECIALIZATION");
    },
  },
  {
    name: "conditioned field plans cannot exceed referenced field plans",
    run: () => {
      const registry = cloneRegistry();
      mutableEntries(segmentLayer(registry)).push(
        specialization("traffic_source", { allowedPlans: ["starter", "lite"] }),
      );
      assertRegistryError(baseInput, registry, "INVALID_CONDITION");
    },
  },
  {
    name: "joint plan restriction keeps or removes conditioned fields coherently",
    run: () => {
      const registry = cloneRegistry();
      mutableEntries(segmentLayer(registry)).push(
        specialization("traffic_source", { allowedPlans: ["starter", "lite"] }),
        specialization("paid_search_keyword_map", { allowedPlans: ["starter", "lite"] }),
      );

      const starter = resolveLandingPageInputCatalogFromRegistry(baseInput, registry);
      assert.equal(starter.ok, true);
      assert.equal(starter.value.fields.some((field) => field.fieldKey === "traffic_source"), true);
      assert.equal(starter.value.fields.some((field) => field.fieldKey === "paid_search_keyword_map"), true);

      const pro = resolveLandingPageInputCatalogFromRegistry(
        { ...baseInput, plan: "pro" },
        registry,
      );
      assert.equal(pro.ok, true);
      assert.equal(pro.value.fields.some((field) => field.fieldKey === "traffic_source"), false);
      assert.equal(pro.value.fields.some((field) => field.fieldKey === "paid_search_keyword_map"), false);
    },
  },
  {
    name: "string-list limits can only restrict coherently",
    run: () => {
      const restricted = withNicheSpecialization("service_locations", { validation: { kind: "string_list", minItems: 2, maxItems: 5 } });
      assert.equal(resolveLandingPageInputCatalogFromRegistry(baseInput, restricted).ok, true);
      assertRegistryError(baseInput, withNicheSpecialization("service_locations", { validation: { kind: "string_list", minItems: 0 } }), "INVALID_SPECIALIZATION");
      assertRegistryError(baseInput, withNicheSpecialization("service_locations", { validation: { kind: "string_list", minItems: 5, maxItems: 2 } }), "INVALID_SPECIALIZATION");
    },
  },
  {
    name: "number-range limits can only restrict coherently",
    run: () => {
      const restricted = withNicheSpecialization("property_price_range", { validation: { kind: "number_range", currency: "BRL", minimum: 100000, maximum: 900000 } });
      assert.equal(resolveLandingPageInputCatalogFromRegistry(baseInput, restricted).ok, true);
      assertRegistryError(baseInput, withNicheSpecialization("property_price_range", { validation: { kind: "number_range", currency: "BRL", minimum: -1 } }), "INVALID_SPECIALIZATION");
      assertRegistryError(baseInput, withNicheSpecialization("property_price_range", { validation: { kind: "number_range", currency: "BRL", minimum: 10, maximum: 5 } }), "INVALID_SPECIALIZATION");
    },
  },
  {
    name: "text regex and custom format specialization fail",
    run: () => {
      assertRegistryError(baseInput, withNicheSpecialization("business_display_name", { regex: ".+" }), "IMMUTABLE_PROPERTY_CONFLICT");
      assertRegistryError(baseInput, withNicheSpecialization("business_display_name", { format: "custom" }), "IMMUTABLE_PROPERTY_CONFLICT");
    },
  },
  {
    name: "missing incompatible and circular conditions fail",
    run: () => {
      assertRegistryError(baseInput, mutateUniversalField("whatsapp_destination", (field) => {
        field.requiredWhen = { fieldKey: "missing", operator: "equals", value: "whatsapp" };
        field.applicableWhen = field.requiredWhen;
      }), "INVALID_CONDITION");
      assertRegistryError(baseInput, mutateUniversalField("whatsapp_destination", (field) => {
        field.requiredWhen = { fieldKey: "financing_support_available", operator: "equals", value: "yes" };
        field.applicableWhen = field.requiredWhen;
      }), "INVALID_CONDITION");
      const circular = mutateUniversalField("traffic_source", (field) => {
        field.applicableWhen = { fieldKey: "paid_search_keyword_map", operator: "equals", value: "x" };
      });
      mutableUniversalField(circular, "paid_search_keyword_map").applicableWhen = { fieldKey: "traffic_source", operator: "equals", value: "paid_search" };
      assertRegistryError(baseInput, circular, "INVALID_CONDITION");
    },
  },
  {
    name: "conversion destination conditions remain declarative in the complete result",
    run: () => {
      const result = resolveLandingPageInputCatalog(baseInput);
      assert.equal(result.ok, true);
      const conditions: Record<string, string> = {
        whatsapp_destination: "whatsapp",
        phone_destination: "phone",
        email_destination: "email",
        external_url_destination: "external_url",
      };
      for (const [fieldKey, channel] of Object.entries(conditions)) {
        const resolvedField: ResolvedLandingPageInputField | undefined =
          result.value.fields.find((candidate) => candidate.fieldKey === fieldKey);
        assert.ok(resolvedField);
        const expected = { fieldKey: "primary_conversion_channel", operator: "equals", value: channel };
        assert.deepEqual(resolvedField.requiredWhen, expected);
        assert.deepEqual(resolvedField.applicableWhen, expected);
      }
    },
  },
  {
    name: "form and paid-search conditions remain declarative",
    run: () => {
      const result = resolveLandingPageInputCatalog(baseInput);
      assert.equal(result.ok, true);
      const privacy = result.value.fields.find((field) => field.fieldKey === "privacy_policy_url");
      const keywordMap = result.value.fields.find((field) => field.fieldKey === "paid_search_keyword_map");
      assert.ok(privacy);
      assert.ok(keywordMap);
      const formCondition = { fieldKey: "primary_conversion_channel", operator: "equals", value: "form" };
      assert.deepEqual(privacy.requiredWhen, formCondition);
      assert.deepEqual(privacy.applicableWhen, formCondition);
      assert.equal(keywordMap.obligation, "optional");
      assert.deepEqual(keywordMap.applicableWhen, { fieldKey: "traffic_source", operator: "equals", value: "paid_search" });
      assert.equal(validateLandingPageInputValue(keywordMap, []).ok, false);
      assert.equal(validateLandingPageInputValue(keywordMap, [{ keyword_or_cluster: "apartamento centro", message_anchor: "Atendimento na região" }]).ok, true);
      assert.equal(validateLandingPageInputValue(keywordMap, [{ keyword_or_cluster: "apartamento", message_anchor: "A" }, { keyword_or_cluster: "APARTAMENTO", message_anchor: "B" }]).ok, false);
    },
  },
  {
    name: "starter lite pro and ultra all receive the four v2 base fields",
    run: () => {
      const snapshots = ["starter", "lite", "pro", "ultra"].map((plan) => {
        const result = resolveLandingPageInputCatalog({ ...v2Input, plan });
        assert.equal(result.ok, true);
        assert.deepEqual(
          result.value.fields
            .filter((field) => field.createdInVersion === 2)
            .map((field) => field.fieldKey),
          starterV2FieldKeys,
        );
        return result.value.fields;
      });
      for (const snapshot of snapshots.slice(1)) assert.deepEqual(snapshot, snapshots[0]);
    },
  },
  {
    name: "result and registry contain no operational values capabilities tracking analytics or generation snapshot",
    run: () => {
      const result = resolveLandingPageInputCatalog(v2Input);
      assert.equal(result.ok, true);
      const serialized = JSON.stringify({ registry: landingPageInputCatalogRegistry[2], result: result.value });
      assert.equal(/providedValues|operationalValues|entitlement|subscription|stripe|generationSnapshot|tracking|analytics|googleAds|commercialCapabilities/i.test(serialized), false);
      assert.equal(serialized.includes("include_if_used"), true);
    },
  },
  {
    name: "registry and resolved result are deeply immutable",
    run: () => {
      assert.equal(Object.isFrozen(landingPageInputCatalogRegistry), true);
      assert.equal(Object.isFrozen(landingPageInputCatalogRegistry[1].universal.entries), true);
      assert.equal(Object.isFrozen(landingPageInputCatalogRegistry[2].universal.entries), true);
      assert.equal(Object.isFrozen(landingPageInputCatalogRegistry[3].taxonLayers), true);
      assert.equal(Object.isFrozen(landingPageInputCatalogRegistry[4].taxonLayers), true);
      assert.throws(() => {
        (landingPageInputCatalogRegistry[1].universal.entries as LandingPageInputCatalogLayerEntry[]).push(fixtureField("forbidden"));
      }, TypeError);
      const result = resolveLandingPageInputCatalog(v2Input);
      assert.equal(result.ok, true);
      assert.equal(Object.isFrozen(result.value.fields[0].evidence.references), true);
      assert.throws(() => {
        (result.value.fields[0].allowedPlans as string[]).push("other");
      }, TypeError);
    },
  },
  {
    name: "invalid validation and missing evidence fail closed",
    run: () => {
      assert.equal(landingPageInputFieldDefinitionSchema.safeParse({ ...fixtureField("bad_validation"), valueType: "email", validation: { kind: "type_only" } }).success, false);
      assert.equal(landingPageInputFieldDefinitionSchema.safeParse({ ...fixtureField("bad_string_list"), valueType: "string_list", validation: { kind: "type_only" } }).success, false);
      assert.equal(landingPageInputFieldDefinitionSchema.safeParse({ ...fixtureField("undefined_string_list_limits"), valueType: "string_list", validation: { kind: "string_list", allowedValues: undefined } }).success, false);
      const missingEvidence = mutateUniversalField("business_display_name", (field) => {
        field.evidence = { summary: "", references: [] };
      });
      assertRegistryError(baseInput, missingEvidence, "MISSING_EVIDENCE_ORIGIN");
      const invalidKeywordMap = mutateUniversalField("paid_search_keyword_map", (field) => {
        field.validation = { kind: "type_only" };
      });
      assertRegistryError(baseInput, invalidKeywordMap, "INVALID_PAID_SEARCH_KEYWORD_MAP");
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}

function withoutCapabilityBindings(field: ResolvedLandingPageInputField) {
  const { capabilityBindings: _capabilityBindings, ...rest } = field;
  return rest;
}

function assertError(input: ResolveLandingPageInputCatalogInput, code: string) {
  const result = resolveLandingPageInputCatalog(input);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, code);
}

function resolveRequired(input: ResolveLandingPageInputCatalogInput) {
  const result = resolveLandingPageInputCatalog(input);
  assert.equal(result.ok, true);
  return result.value;
}

function assertRegistryError(input: ResolveLandingPageInputCatalogInput, registry: LandingPageInputCatalogRegistry, code: string) {
  const result = resolveLandingPageInputCatalogFromRegistry(input, registry);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, code);
}

function cloneRegistry(): LandingPageInputCatalogRegistry {
  return JSON.parse(JSON.stringify(landingPageInputCatalogRegistry)) as LandingPageInputCatalogRegistry;
}

function mutableTaxonLayers(registry: LandingPageInputCatalogRegistry): Record<string, LandingPageInputCatalogLayer> {
  return registry[1].taxonLayers as Record<string, LandingPageInputCatalogLayer>;
}

function segmentLayer(registry: LandingPageInputCatalogRegistry) {
  return registry[1].taxonLayers[realEstateSegmentTaxon.slug];
}

function nicheLayer(registry: LandingPageInputCatalogRegistry) {
  return registry[1].taxonLayers[realEstateBrokerNicheTaxon.slug];
}

function mutableEntries(layer: LandingPageInputCatalogLayer): LandingPageInputCatalogLayerEntry[] {
  return layer.entries as LandingPageInputCatalogLayerEntry[];
}

function mutableUniversalField(registry: LandingPageInputCatalogRegistry, fieldKey: string): MutableField {
  return mutableLayerField(registry[1].universal, fieldKey);
}

function mutableLayerField(layer: LandingPageInputCatalogLayer, fieldKey: string): MutableField {
  const field = layer.entries.find((entry) => entry.fieldKey === fieldKey && entry.kind === "field");
  assert.ok(field && field.kind === "field");
  return field as MutableField;
}

function mutateUniversalField(fieldKey: string, mutate: (field: MutableField) => void) {
  const registry = cloneRegistry();
  mutate(mutableUniversalField(registry, fieldKey));
  return registry;
}

function withNicheSpecialization(fieldKey: string, changes: Record<string, unknown>) {
  const registry = cloneRegistry();
  mutableEntries(nicheLayer(registry)).push(specialization(fieldKey, changes));
  return registry;
}

function specialization(fieldKey: string, changes: Record<string, unknown>): LandingPageInputFieldSpecialization {
  return { kind: "specialization", fieldKey, changes } as LandingPageInputFieldSpecialization;
}

function fixtureField(
  fieldKey: string,
  originLayer: LandingPageInputFieldDefinition["originLayer"] = "universal",
  originTaxon?: LandingPageInputFieldDefinition["originTaxon"],
): LandingPageInputFieldDefinition {
  return {
    kind: "field", fieldKey, purpose: "Executable structural fixture.", originLayer, originTaxon,
    valueType: "string", valueScope: "business", expectedValueOrigin: "business_provided",
    obligation: "optional", validation: { kind: "type_only" }, allowedPlans: ["starter", "lite", "pro", "ultra"],
    snapshotPolicy: "include_if_used", evidence: { summary: "Fixture backed by the approved human decision.", references: ["decision:e20-2-human"] }, createdInVersion: 1,
  };
}

function ultraLayer(): LandingPageInputCatalogLayer {
  return {
    level: "ultra_niche",
    taxon: mediumStandardRealEstateBrokerTaxon,
    entries: [fixtureField("authorized_ultra_fixture", "ultra_niche", mediumStandardRealEstateBrokerTaxon)],
  };
}

type MutableField = {
  -readonly [Key in keyof LandingPageInputFieldDefinition]: LandingPageInputFieldDefinition[Key];
};
