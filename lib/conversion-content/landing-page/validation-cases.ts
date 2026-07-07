import assert from "node:assert/strict";

import {
  landingPageFixtureComposition,
  landingPageFixtureContent,
} from "./fixture";
import { buildLandingPageRenderModel } from "./render-model";
import type { LandingPageContentV1 } from "./schemas";

type Case = {
  name: string;
  run: () => void;
};

const requiredHeroId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab101";
const optionalFaqId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaab106";

const cases: Case[] = [
  {
    name: "valid content resolves landing_page sections",
    run: () => {
      const result = buildLandingPageRenderModel({
        composition: clone(landingPageFixtureComposition),
        contentJson: clone(landingPageFixtureContent),
      });

      assert.equal(result.status, "ready");
      assert.equal(result.model.channel, "landing_page");
      assert.equal(result.model.sections.length, 7);
    },
  },
  {
    name: "duplicate composition item id invalidates content",
    run: () => {
      const content = clone(landingPageFixtureContent);
      content.sections[1].composition_item_id = requiredHeroId;

      const result = buildLandingPageRenderModel({
        composition: clone(landingPageFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "composition_item_duplicate",
      });
    },
  },
  {
    name: "unknown composition item id invalidates content",
    run: () => {
      const content = clone(landingPageFixtureContent);
      content.sections[0].composition_item_id =
        "99999999-9999-4999-8999-999999999998";

      const result = buildLandingPageRenderModel({
        composition: clone(landingPageFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "composition_item_unknown",
      });
    },
  },
  {
    name: "module and variant mismatch invalidates content",
    run: () => {
      const composition = clone(landingPageFixtureComposition);
      composition.items[0].moduleKey = "benefits";

      const result = buildLandingPageRenderModel({
        composition,
        contentJson: clone(landingPageFixtureContent),
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "section_registry_invalid",
      });
    },
  },
  {
    name: "missing required section invalidates content",
    run: () => {
      const content = withoutSection(requiredHeroId);

      const result = buildLandingPageRenderModel({
        composition: clone(landingPageFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "composition_item_missing",
      });
    },
  },
  {
    name: "missing optional section is omitted",
    run: () => {
      const content = withoutSection(optionalFaqId);

      const result = buildLandingPageRenderModel({
        composition: clone(landingPageFixtureComposition),
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
    name: "invalid required section schema invalidates content",
    run: () => {
      const content = clone(landingPageFixtureContent);
      const hero = content.sections.find(
        (section) => section.composition_item_id === requiredHeroId,
      );
      assert.ok(hero);
      hero.content = { title: "Missing required landing page fields" };

      const result = buildLandingPageRenderModel({
        composition: clone(landingPageFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "section_content_invalid",
      });
    },
  },
  {
    name: "commercial_activation channel is rejected",
    run: () => {
      const content = {
        ...clone(landingPageFixtureContent),
        channel: "commercial_activation",
      };

      const result = buildLandingPageRenderModel({
        composition: clone(landingPageFixtureComposition),
        contentJson: content,
      });

      assert.deepEqual(result, {
        status: "invalid",
        reason: "content_schema_invalid",
      });
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}

function withoutSection(compositionItemId: string): LandingPageContentV1 {
  const content = clone(landingPageFixtureContent);
  content.sections = content.sections.filter(
    (section) => section.composition_item_id !== compositionItemId,
  );
  return content;
}

function clone<T>(value: T): T {
  return globalThis.structuredClone(value);
}
