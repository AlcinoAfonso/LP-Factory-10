import assert from "node:assert/strict";

import {
  commercialActivationFixtureComposition,
  commercialActivationFixtureContent,
} from "./fixture";
import { resolveCommercialActivationRenderModel } from "./resolve";
import type { CommercialActivationContentV1 } from "./schemas";
import type { ContentComposition } from "../contracts";

type Case = {
  name: string;
  run: () => void;
};

const requiredHeroId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const optionalDifferentialsId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5";
const optionalFaqId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7";

const cases: Case[] = [
  {
    name: "valid content resolves all fixture sections",
    run: () => {
      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: clone(commercialActivationFixtureContent),
      });

      assert.equal(result.status, "ready");
      assert.equal(result.model.sections.length, 8);
    },
  },
  {
    name: "duplicate composition item id invalidates artifact",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      content.sections[1].composition_item_id = requiredHeroId;

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "composition_item_duplicate",
      });
    },
  },
  {
    name: "unknown composition item id invalidates artifact",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      content.sections[0].composition_item_id =
        "99999999-9999-4999-8999-999999999999";

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "composition_item_unknown",
      });
    },
  },
  {
    name: "module and variant mismatch invalidates artifact",
    run: () => {
      const composition = clone(commercialActivationFixtureComposition);
      composition.items[0].module.key = "services";

      const result = resolveCommercialActivationRenderModel({
        composition,
        contentJson: clone(commercialActivationFixtureContent),
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "section_registry_invalid",
      });
    },
  },
  {
    name: "missing required section invalidates artifact",
    run: () => {
      const content = withoutSection(requiredHeroId);

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "composition_item_missing",
      });
    },
  },
  {
    name: "invalid required section invalidates artifact",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      const hero = content.sections.find(
        (section) => section.composition_item_id === requiredHeroId,
      );
      assert.ok(hero);
      hero.content = { title: "Missing required hero fields" };

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "section_content_invalid",
      });
    },
  },
  {
    name: "missing optional section is omitted",
    run: () => {
      const content = withoutSection(optionalFaqId);

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.equal(result.status, "ready");
      assert.equal(
        result.model.sections.some(
          (section) => section.compositionItemId === optionalFaqId,
        ),
        false,
      );
    },
  },
  {
    name: "invalid optional section is omitted with safe log",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      const optional = content.sections.find(
        (section) => section.composition_item_id === optionalDifferentialsId,
      );
      assert.ok(optional);
      optional.content = { title: "Missing cards" };

      const warnings: Array<Record<string, unknown>> = [];
      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
        logSafeWarning: (_message, details) => warnings.push(details),
      });

      assert.equal(result.status, "ready");
      assert.equal(
        result.model.sections.some(
          (section) => section.compositionItemId === optionalDifferentialsId,
        ),
        false,
      );
      assert.deepEqual(warnings, [
        {
          compositionItemId: optionalDifferentialsId,
          variantKey: "differentials.cards",
        },
      ]);
    },
  },
  {
    name: "unknown root field fails strict schema",
    run: () => {
      const content = {
        ...clone(commercialActivationFixtureContent),
        unexpected: true,
      };

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "content_schema_invalid",
      });
    },
  },
  {
    name: "invalid URL fails section schema",
    run: () => {
      const content = clone(commercialActivationFixtureContent);
      const hero = content.sections.find(
        (section) => section.composition_item_id === requiredHeroId,
      );
      assert.ok(hero);
      hero.content = {
        ...hero.content,
        primary_cta: { label: "Broken", href: "https://" },
      };

      const result = resolveCommercialActivationRenderModel({
        composition: clone(commercialActivationFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "section_content_invalid",
      });
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}

function withoutSection(compositionItemId: string): CommercialActivationContentV1 {
  const content = clone(commercialActivationFixtureContent);
  content.sections = content.sections.filter(
    (section) => section.composition_item_id !== compositionItemId,
  );
  return content;
}

function clone<T>(value: T): T {
  return globalThis.structuredClone(value);
}
