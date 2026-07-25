import { createHash } from "node:crypto";

import { resolveLandingPageRootParameters } from "../index";
import { resolveLandingPageModuleCatalog } from "../module-catalog";
import type {
  LandingPageCompositionDraft,
  LandingPageCompositionValidationErrorCode,
  ValidateLandingPageCompositionInput,
  ValidateLandingPageCompositionResult,
  ValidatedLandingPageComposition,
} from "./contracts";
import { landingPageCompositionDraftSchema } from "./schema";

export function validateLandingPageComposition(
  input: ValidateLandingPageCompositionInput,
): ValidateLandingPageCompositionResult {
  const parsed = landingPageCompositionDraftSchema.safeParse(input.composition);
  if (!parsed.success) {
    return invalid("INVALID_INPUT", "Invalid landing_page composition shape");
  }

  const composition = parsed.data as LandingPageCompositionDraft;
  if (!composition.ownerTaxon.isActive) {
    return invalid("INACTIVE_OWNER_TAXON", "Owner taxon must be active");
  }
  if (
    composition.ownerTaxon.level === "ultra_niche" &&
    input.ownerPolicy?.ownCompositionAllowed !== true
  ) {
    return invalid(
      "UNAUTHORIZED_ULTRA_NICHE_OWNER",
      "Ultra-niche composition ownership requires explicit policy",
    );
  }
  if (
    composition.sourceSnapshots.research.servedTaxonId !==
    composition.ownerTaxon.id
  ) {
    return invalid(
      "INVALID_SOURCE_SNAPSHOT",
      "Research snapshot must belong to the composition owner taxon",
    );
  }
  if (composition.items.length === 0) {
    return invalid("EMPTY_COMPOSITION", "Composition must contain an item");
  }

  const rootResult = resolveLandingPageRootParameters({
    rootVersion: composition.sourceSnapshots.root.rootVersion,
    presetKey: composition.sourceSnapshots.root.presetKey,
  });
  if (!rootResult.ok || rootResult.value.lifecycleStatus === "deprecated") {
    return invalid(
      "INVALID_SOURCE_SNAPSHOT",
      "Root snapshot is unknown or lifecycle-incompatible",
    );
  }

  const moduleKeys = composition.items.map((item) => item.moduleKey);
  if (new Set(moduleKeys).size !== moduleKeys.length) {
    return invalid("DUPLICATE_MODULE", "A module can occur only once");
  }

  const orders = composition.items.map((item) => item.order).sort((a, b) => a - b);
  if (orders.some((order, index) => order !== index + 1)) {
    return invalid(
      "INVALID_ORDER",
      "Composition order must be unique and continuous from one",
    );
  }

  let formInteractionCount = 0;
  for (const item of composition.items) {
    const catalogResult = resolveLandingPageModuleCatalog({
      moduleCatalogVersion:
        composition.sourceSnapshots.moduleCatalog.moduleCatalogVersion,
      rootVersion: composition.sourceSnapshots.root.rootVersion,
      rootPresetKey: composition.sourceSnapshots.root.presetKey,
      moduleKey: item.moduleKey,
      moduleVersion: item.moduleVersion,
      variantName: item.variantName,
      variantVersion: item.variantVersion,
      funnelProfileKey: input.funnelProfileKey,
    });

    if (!catalogResult.ok) {
      return invalid(
        "UNKNOWN_CATALOG_REFERENCE",
        `Unknown or incompatible module/variant at order ${item.order}`,
      );
    }
    if (
      catalogResult.value.module.lifecycleStatus === "deprecated" ||
      catalogResult.value.variant.lifecycleStatus === "deprecated"
    ) {
      return invalid(
        "INCOMPATIBLE_LIFECYCLE",
        `Deprecated module/variant at order ${item.order}`,
      );
    }

    if (
      item.options?.spacing &&
      !catalogResult.value.effectiveRoot.commonOptions.spacing.includes(
        item.options.spacing,
      )
    ) {
      return invalid(
        "INVALID_OPTION",
        `Spacing is not allowed at order ${item.order}`,
      );
    }

    formInteractionCount += catalogResult.value.variant.interactionContracts.filter(
      (interaction) => interaction.kind === "form",
    ).length;
  }

  if (formInteractionCount > 1) {
    return invalid(
      "MULTIPLE_FORM_INTERACTIONS",
      "Composition v1 accepts at most one form interaction",
    );
  }

  const hasBlockingGap = composition.gaps.some(
    (gap) => gap.blocking || gap.humanDecision === "blocking",
  );
  if (input.mode === "activation" && hasBlockingGap) {
    return invalid("BLOCKING_GAP", "Blocking gaps prevent activation");
  }

  const normalized = cloneJson(composition);
  const value: ValidatedLandingPageComposition = {
    composition: normalized,
    validationFingerprint: createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex"),
    activationReady: !hasBlockingGap,
    formInteractionCount,
  };

  return { ok: true, value: deepFreeze(value) };
}

function invalid(
  code: LandingPageCompositionValidationErrorCode,
  message: string,
): ValidateLandingPageCompositionResult {
  return { ok: false, error: { code, message } };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
