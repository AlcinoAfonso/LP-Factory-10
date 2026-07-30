import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { commercialActivationFixtureComposition, commercialActivationFixtureContent } from '../../../../../lib/conversion-content/commercial-activation/fixture';
import { CommercialActivationSections } from '../../../../../lib/conversion-content/commercial-activation/renderer';
import { resolveCommercialActivationRenderModel } from '../../../../../lib/conversion-content/commercial-activation/resolve';
import {
  decideCheckoutAccess,
  decideCheckoutCommercialEligibility,
} from './checkout-policy';
import {
  decideCommercialCtaInteraction,
  decideCommercialExperience,
  type CommercialPageVariant,
} from './commercial-experience-policy';

const variants: readonly CommercialPageVariant[] = [
  'generic-v1',
  'commercial_activation_published',
];
const roles = ['owner', 'admin', 'editor', 'viewer'] as const;

const cases: readonly Readonly<{ name: string; run: () => void }>[] = [
  {
    name: 'covers the complete 2 variants x 4 roles x 2 entitlement states matrix',
    run: () => {
      const matrix: string[] = [];

      for (const variant of variants) {
        for (const actorRole of roles) {
          for (const isCommerciallyEligible of [false, true]) {
            const experience = decideCommercialExperience({
              actorRole,
              isCommerciallyEligible,
            });
            const checkoutAccess = decideCheckoutAccess({
              accountStatus: 'active',
              membershipStatus: 'active',
              actorRole,
            });
            const checkoutAllowed =
              checkoutAccess.allowed &&
              decideCheckoutCommercialEligibility(isCommerciallyEligible).allowed;
            const expectedMode =
              actorRole !== 'owner' && !isCommerciallyEligible
                ? 'waiting'
                : 'commercial';

            assert.equal(experience.mode, expectedMode);
            assert.equal(
              experience.showFinancialActions,
              actorRole === 'owner' && !isCommerciallyEligible,
            );
            assert.equal(experience.showFinancialActions, checkoutAllowed);
            matrix.push(
              `${variant}:${actorRole}:${isCommerciallyEligible}:${experience.mode}:${experience.showFinancialActions}`,
            );
          }
        }
      }

      assert.equal(matrix.length, 16);
      assert.equal(new Set(matrix).size, 16);
    },
  },
  {
    name: 'allows plan checkout only in the authorized financial-action mode',
    run: () => {
      for (const showFinancialActions of [false, true]) {
        assert.equal(
          decideCommercialCtaInteraction({
            showFinancialActions,
            ctaLocation: 'plan_card',
          }),
          showFinancialActions ? 'checkout' : 'disabled',
        );
        for (const ctaLocation of ['hero', 'final'] as const) {
          assert.equal(
            decideCommercialCtaInteraction({
              showFinancialActions,
              ctaLocation,
            }),
            showFinancialActions ? 'navigate' : 'disabled',
          );
        }
      }
    },
  },
  {
    name: 'filters published financial controls only at runtime',
    run: () => {
      const resolved = resolveCommercialActivationRenderModel({
        composition: structuredClone(commercialActivationFixtureComposition),
        contentJson: structuredClone(commercialActivationFixtureContent),
      });
      assert.equal(resolved.status, 'ready');

      const withFinancialActions = renderToStaticMarkup(
        createElement(CommercialActivationSections, {
          model: resolved.model,
          showFinancialActions: true,
        }),
      );
      const withoutFinancialActions = renderToStaticMarkup(
        createElement(CommercialActivationSections, {
          model: resolved.model,
          showFinancialActions: false,
        }),
      );

      assert.match(withFinancialActions, /data-commercial-cta/);
      assert.doesNotMatch(withoutFinancialActions, /data-commercial-cta/);
      assert.ok(withoutFinancialActions.length > 0);
    },
  },
  {
    name: 'does not mutate the published bundle content or composition while applying policy',
    run: () => {
      const compositionBefore = structuredClone(commercialActivationFixtureComposition);
      const contentBefore = structuredClone(commercialActivationFixtureContent);

      for (const actorRole of roles) {
        for (const isCommerciallyEligible of [false, true]) {
          decideCommercialExperience({ actorRole, isCommerciallyEligible });
        }
      }

      assert.deepEqual(commercialActivationFixtureComposition, compositionBefore);
      assert.deepEqual(commercialActivationFixtureContent, contentBefore);
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}
