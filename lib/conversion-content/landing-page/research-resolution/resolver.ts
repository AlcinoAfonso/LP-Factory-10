import {
  LANDING_PAGE_RESEARCH_BLOCKS,
  type LandingPageResearchAudienceScope,
  type LandingPageResearchBlock,
  type LandingPageResearchItemDto,
  type LandingPageResearchParentDto,
  type LandingPageResearchResolutionError,
  type LandingPageResearchResolutionErrorCode,
  type LandingPageResearchResolutionResult,
  type LandingPageResearchSourceRelation,
  type LandingPageResearchTaxonDto,
  type ResolveLandingPageResearchInput,
  type ResolvedLandingPageResearchAudience,
  type ResolvedLandingPageResearchItem,
} from "./contracts";

type AudienceResolution =
  | Readonly<{ ok: true; value: ResolvedLandingPageResearchAudience }>
  | Readonly<{ ok: false; error: LandingPageResearchResolutionError }>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLandingPageResearchUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function resolveLandingPageResearch(
  input: ResolveLandingPageResearchInput,
): LandingPageResearchResolutionResult {
  const taxonId = input.taxonId.trim();
  if (!taxonId || !isLandingPageResearchUuid(taxonId)) {
    return failure("INVALID_TAXON_ID", "taxon_id must be a valid UUID");
  }

  if (input.source.status === "read_failed") {
    return failure("READ_FAILED", "Research source read failed");
  }
  if (input.source.status === "not_normalizable") {
    return failure(
      "SOURCE_NOT_NORMALIZABLE",
      "Research source could not be normalized",
    );
  }

  const servedTaxonMatches = input.source.taxons.filter(
    (taxon) => taxon.id === taxonId,
  );
  if (servedTaxonMatches.length === 0) {
    return failure("TAXON_NOT_FOUND", "Served taxon was not found");
  }
  if (servedTaxonMatches.length > 1) {
    return failure(
      "SOURCE_NOT_NORMALIZABLE",
      "Served taxon source is ambiguous",
    );
  }

  const servedTaxon = servedTaxonMatches[0];
  if (!isValidTaxon(servedTaxon)) {
    return failure(
      "SOURCE_NOT_NORMALIZABLE",
      "Served taxon source could not be normalized",
    );
  }
  if (!servedTaxon.isActive) {
    return failure("TAXON_INACTIVE", "Served taxon is inactive");
  }

  const endCustomer = resolveAudience({
    servedTaxonId: taxonId,
    sourceTaxonId: taxonId,
    sourceRelation: "own",
    audienceScope: "end_customer",
    researches: input.source.researches,
    items: input.source.items,
  });
  if (!endCustomer.ok) return endCustomer;

  const ownBusinessBuyer = resolveAudience({
    servedTaxonId: taxonId,
    sourceTaxonId: taxonId,
    sourceRelation: "own",
    audienceScope: "business_buyer",
    researches: input.source.researches,
    items: input.source.items,
  });

  let businessBuyer: AudienceResolution = ownBusinessBuyer;
  if (
    !ownBusinessBuyer.ok &&
    (ownBusinessBuyer.error.code === "RESEARCH_MISSING" ||
      ownBusinessBuyer.error.code === "RESEARCH_INCOMPLETE")
  ) {
    const parentResult = resolveDirectParent(servedTaxon, input.source.taxons);
    if (!parentResult.ok) return parentResult;

    businessBuyer = resolveAudience({
      servedTaxonId: taxonId,
      sourceTaxonId: parentResult.value.id,
      sourceRelation: "direct_parent",
      audienceScope: "business_buyer",
      researches: input.source.researches,
      items: input.source.items,
    });
  }

  if (!businessBuyer.ok) return businessBuyer;

  return {
    ok: true,
    value: deepFreeze({
      servedTaxonId: taxonId,
      endCustomer: endCustomer.value,
      businessBuyer: businessBuyer.value,
      versions: {
        endCustomer: endCustomer.value.version,
        businessBuyer: businessBuyer.value.version,
      },
    }),
  };
}

function resolveDirectParent(
  servedTaxon: LandingPageResearchTaxonDto,
  taxons: readonly LandingPageResearchTaxonDto[],
):
  | Readonly<{ ok: true; value: LandingPageResearchTaxonDto }>
  | Readonly<{ ok: false; error: LandingPageResearchResolutionError }> {
  if (!servedTaxon.parentId) {
    return failure(
      "DIRECT_PARENT_NOT_FOUND",
      "Direct parent is required for business_buyer fallback",
    );
  }

  const parentMatches = taxons.filter(
    (taxon) => taxon.id === servedTaxon.parentId,
  );
  if (parentMatches.length === 0) {
    return failure("DIRECT_PARENT_NOT_FOUND", "Direct parent was not found");
  }
  if (parentMatches.length > 1 || !isValidTaxon(parentMatches[0])) {
    return failure(
      "SOURCE_NOT_NORMALIZABLE",
      "Direct parent source could not be normalized",
    );
  }
  if (!parentMatches[0].isActive) {
    return failure("DIRECT_PARENT_INACTIVE", "Direct parent is inactive");
  }

  return { ok: true, value: parentMatches[0] };
}

function resolveAudience(input: {
  servedTaxonId: string;
  sourceTaxonId: string;
  sourceRelation: LandingPageResearchSourceRelation;
  audienceScope: LandingPageResearchAudienceScope;
  researches: readonly LandingPageResearchParentDto[];
  items: readonly LandingPageResearchItemDto[];
}): AudienceResolution {
  const researches = input.researches.filter(
    (research) =>
      research.taxonId === input.sourceTaxonId &&
      research.audienceScope === input.audienceScope &&
      research.status === "active" &&
      isRequiredBlock(research.researchBlock),
  );

  if (researches.length === 0) {
    return audienceFailure(
      "RESEARCH_MISSING",
      "No active research set was found",
      input,
    );
  }

  if (
    researches.some(
      (research) =>
        !isLandingPageResearchUuid(research.id) ||
        !Number.isInteger(research.version),
    )
  ) {
    return audienceFailure(
      "RESEARCH_INVALID",
      "Research parent metadata is invalid",
      input,
    );
  }

  const versions = new Set(researches.map((research) => research.version));
  if (versions.size > 1) {
    return audienceFailure(
      "RESEARCH_AMBIGUOUS",
      "Active research blocks are split across versions",
      input,
    );
  }

  const version = researches[0].version;
  const byBlock = new Map<LandingPageResearchBlock, (typeof researches)[number]>();
  for (const research of researches) {
    const block = research.researchBlock as LandingPageResearchBlock;
    if (byBlock.has(block)) {
      return audienceFailure(
        "RESEARCH_AMBIGUOUS",
        "More than one active research parent exists for a required block",
        input,
      );
    }
    byBlock.set(block, research);
  }

  const seenItemIds = new Set<string>();
  const activeItemsByResearchId = new Map<
    string,
    readonly LandingPageResearchItemDto[]
  >();
  for (const research of byBlock.values()) {
    const activeItems = input.items.filter(
      (item) => item.researchId === research.id && item.isActive,
    );
    const activeItemIds = new Set(activeItems.map((item) => item.id));
    if (
      activeItems.some((item) => !isValidActiveItem(item, research.id)) ||
      activeItemIds.size !== activeItems.length ||
      activeItems.some((item) => seenItemIds.has(item.id))
    ) {
      return audienceFailure(
        "RESEARCH_INVALID",
        "A required research block has an invalid active item",
        input,
      );
    }
    for (const item of activeItems) seenItemIds.add(item.id);
    activeItemsByResearchId.set(research.id, activeItems);
  }

  if (LANDING_PAGE_RESEARCH_BLOCKS.some((block) => !byBlock.has(block))) {
    return audienceFailure(
      "RESEARCH_INCOMPLETE",
      "The active research set does not contain every required block",
      input,
    );
  }

  const resolvedResearches = [];
  for (const block of LANDING_PAGE_RESEARCH_BLOCKS) {
    const research = byBlock.get(block)!;
    const activeItems = activeItemsByResearchId.get(research.id) ?? [];
    if (activeItems.length === 0) {
      return audienceFailure(
        "RESEARCH_INCOMPLETE",
        "A required research block has no active items",
        input,
      );
    }

    const items = activeItems
      .map((item) => {
        return {
          itemId: item.id,
          researchId: research.id,
          itemKey: item.itemKey!,
          itemText: item.itemText!,
          priority: item.priority!,
          sortOrder: item.sortOrder!,
          servedTaxonId: input.servedTaxonId,
          sourceTaxonId: input.sourceTaxonId,
          sourceRelation: input.sourceRelation,
          audienceScope: input.audienceScope,
          researchVersion: version,
        } satisfies ResolvedLandingPageResearchItem;
      })
      .sort(compareItems);

    resolvedResearches.push({
      researchId: research.id,
      researchBlock: block,
      audienceScope: input.audienceScope,
      version,
      sourceTaxonId: input.sourceTaxonId,
      items,
    });
  }

  return {
    ok: true,
    value: {
      audienceScope: input.audienceScope,
      sourceTaxonId: input.sourceTaxonId,
      sourceRelation: input.sourceRelation,
      version,
      researches: resolvedResearches,
    },
  };
}

function isValidTaxon(taxon: LandingPageResearchTaxonDto): boolean {
  return (
    isLandingPageResearchUuid(taxon.id) &&
    (taxon.parentId === null || isLandingPageResearchUuid(taxon.parentId)) &&
    typeof taxon.isActive === "boolean"
  );
}

function isRequiredBlock(value: string): value is LandingPageResearchBlock {
  return (LANDING_PAGE_RESEARCH_BLOCKS as readonly string[]).includes(value);
}

function isValidActiveItem(
  item: LandingPageResearchItemDto,
  researchId: string,
): boolean {
  return (
    isLandingPageResearchUuid(item.id) &&
    item.researchId === researchId &&
    typeof item.itemKey === "string" &&
    item.itemKey.trim().length > 0 &&
    typeof item.itemText === "string" &&
    item.itemText.trim().length > 0 &&
    Number.isInteger(item.priority) &&
    Number.isInteger(item.sortOrder)
  );
}

function compareItems(
  left: ResolvedLandingPageResearchItem,
  right: ResolvedLandingPageResearchItem,
): number {
  return (
    left.sortOrder - right.sortOrder ||
    compareText(left.itemKey, right.itemKey) ||
    compareText(left.itemId, right.itemId)
  );
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function audienceFailure(
  code: Extract<
    LandingPageResearchResolutionErrorCode,
    | "RESEARCH_MISSING"
    | "RESEARCH_INCOMPLETE"
    | "RESEARCH_INVALID"
    | "RESEARCH_AMBIGUOUS"
  >,
  message: string,
  input: {
    audienceScope: LandingPageResearchAudienceScope;
    sourceTaxonId: string;
    sourceRelation: LandingPageResearchSourceRelation;
  },
): AudienceResolution {
  return failure(code, message, {
    audienceScope: input.audienceScope,
    sourceTaxonId: input.sourceTaxonId,
    sourceRelation: input.sourceRelation,
  });
}

function failure(
  code: LandingPageResearchResolutionErrorCode,
  message: string,
  details: Omit<LandingPageResearchResolutionError, "code" | "message"> = {},
): Readonly<{ ok: false; error: LandingPageResearchResolutionError }> {
  return { ok: false, error: { code, message, ...details } };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const property of Object.getOwnPropertyNames(value)) {
      const nested = value[property as keyof T];
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
    Object.freeze(value);
  }
  return value;
}
