import {
  validateLandingPagePresentationCandidate,
  type LandingPagePresentationSection,
} from "../conversion-content/landing-page/presentation";
import { z } from "zod";
import type { AccountLandingPage } from "./contracts";
import type { CurrentLandingPageRevision } from "./adapters/landingPageRevisionAdapter";
import {
  landingPageRevisionContentSchema,
  validateLandingPageRevisionSnapshot,
  type LandingPageRevisionAssetReference,
} from "./landingPageRevision";

export const LANDING_PAGE_PREVIEW_SIGNED_URL_TTL_SECONDS = 300 as const;

export type LandingPageRenderSection =
  | Readonly<{ kind: "header"; ctaLabel: string | null }>
  | Readonly<{
      kind: "hero";
      layout: "media_left" | "media_right";
      eyebrow: string | null;
      heading: string;
      body: string;
      ctaLabel: string;
    }>
  | Readonly<{
      kind: "text_media";
      layout: "media_left" | "media_right";
      heading: string;
      body: string;
    }>
  | Readonly<{
      kind: "cards_grid";
      layout: "grid_2" | "grid_3";
      heading: string;
      intro: string | null;
      cards: readonly Readonly<{ title: string; body: string }>[];
    }>
  | Readonly<{
      kind: "steps";
      heading: string;
      intro: string | null;
      items: readonly Readonly<{ title: string; body: string }>[];
    }>
  | Readonly<{
      kind: "faq";
      heading: string;
      items: readonly Readonly<{ question: string; answer: string }>[];
    }>
  | Readonly<{
      kind: "cta";
      heading: string;
      body: string | null;
      ctaLabel: string;
    }>
  | Readonly<{ kind: "footer"; tagline: string | null }>;

export type LandingPageRenderModel = Readonly<{
  contractVersion: 1;
  brandName?: string;
  sections: readonly LandingPageRenderSection[];
  conversion: Readonly<{
    channel: "whatsapp" | "phone" | "email" | "external_url";
    href: string;
  }>;
  media: Readonly<{
    mainImage: Readonly<{
      url: string;
      alt: string;
      width: 1536;
      height: 1024;
    }>;
  }>;
  revision: Readonly<{
    id: string;
    number: number;
    attemptId: string;
    requestId: string;
    generatedAt: string;
    promptVersion: string;
    presentationContractVersion: 1;
    textWorkload: Readonly<{
      workload: "landing_page_draft_generation";
      revision: string;
      model: string;
      reasoningEffort: "max";
    }>;
    imageWorkload: Readonly<{
      workload: "landing_page_draft_image_generation";
      revision: string;
      model: string;
      size: "1536x1024";
      quality: "medium";
      format: "webp";
      compression: 80;
      moderation: "auto";
    }>;
  }>;
}>;

export type LandingPagePreviewLoadResult =
  | Readonly<{ status: "ready"; model: LandingPageRenderModel }>
  | Readonly<{ status: "empty" }>
  | Readonly<{
      status: "denied" | "not_found" | "unavailable" | "invalid_cta";
    }>;

export type LandingPagePreviewDependencies = Readonly<{
  authorizeViewer: (input: Readonly<{ accountSlug: string }>) => Promise<
    | Readonly<{ ok: true; accountId: string }>
    | Readonly<{ ok: false }>
  >;
  loadEntitlement: (input: Readonly<{ accountId: string }>) => Promise<boolean>;
  loadLandingPage: (input: Readonly<{
    accountId: string;
    landingPageId: string;
  }>) => Promise<
    | Readonly<{ ok: true; landingPage: AccountLandingPage }>
    | Readonly<{ ok: false; error: "not_found" | "read_failed" }>
  >;
  readCurrentRevision: (input: Readonly<{
    accountId: string;
    landingPageId: string;
  }>) => Promise<
    | Readonly<{ ok: true; value: CurrentLandingPageRevision | null }>
    | Readonly<{ ok: false; error: "READ_FAILED" }>
  >;
  signAsset: (asset: LandingPageRevisionAssetReference) => Promise<
    | Readonly<{ ok: true; signedUrl: string }>
    | Readonly<{ ok: false }>
  >;
  log?: (event: Readonly<Record<string, unknown>>) => void;
}>;

type PreparedLandingPageRenderModel = Omit<LandingPageRenderModel, "media"> &
  Readonly<{
    asset: LandingPageRevisionAssetReference;
    image: Readonly<{ alt: string; width: 1536; height: 1024 }>;
  }>;

export async function loadLandingPagePreviewWithDependencies(
  input: Readonly<{ accountSlug: string; landingPageId: string }>,
  dependencies: LandingPagePreviewDependencies,
): Promise<LandingPagePreviewLoadResult> {
  try {
    return await loadLandingPagePreviewUnchecked(input, dependencies);
  } catch {
    return observedFailure(
      dependencies,
      "unavailable",
      "preview_dependency_failed",
      input.landingPageId.trim(),
    );
  }
}

async function loadLandingPagePreviewUnchecked(
  input: Readonly<{ accountSlug: string; landingPageId: string }>,
  dependencies: LandingPagePreviewDependencies,
): Promise<LandingPagePreviewLoadResult> {
  const accountSlug = input.accountSlug.trim().toLowerCase();
  const landingPageId = input.landingPageId.trim();
  if (!accountSlug || accountSlug === "home" || !isUuid(landingPageId)) {
    return observedFailure(dependencies, "not_found", "invalid_input", landingPageId);
  }

  const access = await dependencies.authorizeViewer({ accountSlug });
  if (!access.ok || !isUuid(access.accountId)) {
    return observedFailure(dependencies, "denied", "access_denied", landingPageId);
  }
  const accountId = access.accountId;

  if (!(await dependencies.loadEntitlement({ accountId }))) {
    return observedFailure(
      dependencies,
      "unavailable",
      "entitlement_required",
      landingPageId,
    );
  }

  const landingPage = await dependencies.loadLandingPage({ accountId, landingPageId });
  if (!landingPage.ok) {
    return observedFailure(
      dependencies,
      landingPage.error === "not_found" ? "not_found" : "unavailable",
      landingPage.error === "not_found" ? "landing_page_not_found" : "landing_page_read_failed",
      landingPageId,
    );
  }
  if (
    landingPage.landingPage.account_id !== accountId ||
    landingPage.landingPage.id !== landingPageId ||
    landingPage.landingPage.status !== "draft"
  ) {
    return observedFailure(
      dependencies,
      "not_found",
      "landing_page_mismatch",
      landingPageId,
    );
  }

  const current = await dependencies.readCurrentRevision({ accountId, landingPageId });
  if (!current.ok) {
    return observedFailure(
      dependencies,
      "unavailable",
      "revision_read_failed",
      landingPageId,
    );
  }
  if (!current.value) return { status: "empty" };

  const prepared = prepareLandingPageRenderModel({
    accountId,
    landingPageId,
    revision: current.value,
  });
  if (!prepared.ok) {
    return observedFailure(
      dependencies,
      prepared.error === "INVALID_CTA" ? "invalid_cta" : "unavailable",
      prepared.error.toLowerCase(),
      landingPageId,
      current.value.id,
    );
  }

  const signed = await dependencies.signAsset(prepared.value.asset);
  if (!signed.ok || !isSafeSignedUrl(signed.signedUrl)) {
    return observedFailure(
      dependencies,
      "unavailable",
      "asset_signing_failed",
      landingPageId,
      current.value.id,
    );
  }

  const { asset: _asset, image, ...model } = prepared.value;
  return {
    status: "ready",
    model: deepFreeze({
      ...model,
      media: {
        mainImage: {
          url: signed.signedUrl,
          alt: image.alt,
          width: image.width,
          height: image.height,
        },
      },
    }),
  };
}

export function resolveLandingPageRenderHref(input: Readonly<{
  channel: unknown;
  destinationFieldKey: unknown;
  destination: unknown;
}>): string | null {
  if (typeof input.destination !== "string") return null;
  const destination = input.destination.trim();
  if (input.channel === "whatsapp") {
    if (
      input.destinationFieldKey !== "whatsapp_destination" ||
      !isE164(destination)
    ) return null;
    return `https://wa.me/${destination.slice(1)}`;
  }
  if (input.channel === "phone") {
    if (
      input.destinationFieldKey !== "phone_destination" ||
      !isE164(destination)
    ) return null;
    return `tel:${destination}`;
  }
  if (input.channel === "email") {
    if (
      input.destinationFieldKey !== "email_destination" ||
      !isEmail(destination)
    ) return null;
    return `mailto:${encodeURIComponent(destination)}`;
  }
  if (input.channel === "external_url") {
    if (input.destinationFieldKey !== "external_url_destination") return null;
    try {
      const url = new URL(destination);
      if (url.protocol !== "https:" || url.username || url.password || !url.hostname) {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  }
  return null;
}

function prepareLandingPageRenderModel(input: Readonly<{
  accountId: string;
  landingPageId: string;
  revision: CurrentLandingPageRevision;
}>):
  | Readonly<{ ok: true; value: PreparedLandingPageRenderModel }>
  | Readonly<{ ok: false; error: "REVISION_MISMATCH" | "INVALID_REVISION" | "INVALID_CTA" }> {
  const { revision } = input;
  if (
    revision.accountId !== input.accountId ||
    revision.landingPageId !== input.landingPageId
  ) {
    return { ok: false, error: "REVISION_MISMATCH" };
  }
  if (
    !landingPageRevisionContentSchema.safeParse(revision.content).success ||
    !validateLandingPageRevisionSnapshot(revision.snapshot) ||
    !revision.attemptId ||
    revision.attemptId !== revision.snapshot.attemptId ||
    revision.snapshot.generationContext.identities.accountId !== input.accountId ||
    revision.snapshot.generationContext.identities.landingPage.id !== input.landingPageId ||
    revision.snapshot.generationContext.identities.landingPage.status !== "draft" ||
    revision.content.contractVersion !== 1 ||
    revision.snapshot.presentationContractVersion !== 1 ||
    !sameAsset(revision.content.media.mainImage, revision.snapshot.media.mainImage) ||
    revision.content.media.mainImage.path !==
      `${input.accountId}/${input.landingPageId}/${revision.attemptId}/main.webp`
  ) {
    return { ok: false, error: "INVALID_REVISION" };
  }

  const href = resolveLandingPageRenderHref(revision.content.binding);
  if (!href) return { ok: false, error: "INVALID_CTA" };

  const presentation = validateLandingPagePresentationCandidate(
    revision.content.presentation,
    revision.snapshot.generationContext.modelContext.facts.map((fact) => ({
      value: fact.value,
    })),
  );
  if (!presentation.ok) return { ok: false, error: "INVALID_REVISION" };
  const sections = projectSections(presentation.value.sections);
  if (!sections) return { ok: false, error: "INVALID_REVISION" };
  const brandName = readAllowedBrandName(revision.snapshot.generationContext.modelContext.facts);
  if (brandName === null) return { ok: false, error: "INVALID_REVISION" };

  const textConfiguration = revision.snapshot.workloads.text.configuration;
  const imageConfiguration = revision.snapshot.workloads.image.configuration;
  return {
    ok: true,
    value: deepFreeze({
      contractVersion: 1,
      ...(brandName ? { brandName } : {}),
      sections,
      conversion: {
        channel: revision.content.binding.channel,
        href,
      },
      revision: {
        id: revision.id,
        number: revision.revisionNumber,
        attemptId: revision.attemptId,
        requestId: revision.snapshot.requestId,
        generatedAt: revision.snapshot.generatedAt,
        promptVersion: revision.snapshot.promptVersion,
        presentationContractVersion: 1,
        textWorkload: {
          workload: "landing_page_draft_generation",
          revision: textConfiguration.revision,
          model: textConfiguration.model,
          reasoningEffort: "max",
        },
        imageWorkload: {
          workload: "landing_page_draft_image_generation",
          revision: imageConfiguration.revision,
          model: imageConfiguration.model,
          size: "1536x1024",
          quality: "medium",
          format: "webp",
          compression: 80,
          moderation: "auto",
        },
      },
      asset: { ...revision.content.media.mainImage },
      image: {
        alt: revision.content.media.mainImage.alt,
        width: 1536,
        height: 1024,
      },
    }),
  };
}

function projectSections(
  sections: readonly LandingPagePresentationSection[],
): readonly LandingPageRenderSection[] | null {
  const projected: LandingPageRenderSection[] = [];
  for (const section of sections) {
    switch (section.kind) {
      case "header":
        projected.push({ kind: "header", ctaLabel: section.ctaLabel });
        break;
      case "hero":
        projected.push({
          kind: "hero",
          layout: section.layout,
          eyebrow: section.eyebrow,
          heading: section.heading,
          body: section.body,
          ctaLabel: section.ctaLabel,
        });
        break;
      case "text_media":
        projected.push({
          kind: "text_media",
          layout: section.layout,
          heading: section.heading,
          body: section.body,
        });
        break;
      case "cards_grid":
        projected.push({
          kind: "cards_grid",
          layout: section.layout,
          heading: section.heading,
          intro: section.intro,
          cards: section.cards.map((card) => ({ title: card.title, body: card.body })),
        });
        break;
      case "steps":
        projected.push({
          kind: "steps",
          heading: section.heading,
          intro: section.intro,
          items: section.items.map((item) => ({ title: item.title, body: item.body })),
        });
        break;
      case "faq":
        projected.push({
          kind: "faq",
          heading: section.heading,
          items: section.items.map((item) => ({
            question: item.question,
            answer: item.answer,
          })),
        });
        break;
      case "cta":
        projected.push({
          kind: "cta",
          heading: section.heading,
          body: section.body,
          ctaLabel: section.ctaLabel,
        });
        break;
      case "footer":
        projected.push({ kind: "footer", tagline: section.tagline });
        break;
      default:
        return null;
    }
  }
  return deepFreeze(projected);
}

function readAllowedBrandName(facts: readonly Readonly<{
  fieldKey: string;
  value: unknown;
}>[]): string | undefined | null {
  const matching = facts.filter((fact) => fact.fieldKey === "business_display_name");
  if (matching.length === 0) return undefined;
  if (matching.length !== 1 || typeof matching[0]?.value !== "string") return null;
  const value = matching[0].value.trim();
  return value && value.length <= 160 ? value : null;
}

function sameAsset(
  left: LandingPageRevisionAssetReference,
  right: LandingPageRevisionAssetReference,
): boolean {
  return (
    left.bucket === right.bucket &&
    left.path === right.path &&
    left.origin === right.origin &&
    left.mimeType === right.mimeType &&
    left.width === right.width &&
    left.height === right.height &&
    left.bytes === right.bytes &&
    left.alt === right.alt &&
    left.imageWorkload === right.imageWorkload &&
    left.imageConfigVersion === right.imageConfigVersion &&
    left.visualBriefVersion === right.visualBriefVersion
  );
}

function observedFailure(
  dependencies: LandingPagePreviewDependencies,
  status: Extract<LandingPagePreviewLoadResult, { status: string }>["status"],
  reason: string,
  landingPageId: string,
  revisionId?: string,
): LandingPagePreviewLoadResult {
  try {
    dependencies.log?.({
      event: "landing_page_preview_load",
      result: "failure",
      reason,
      landing_page_id: landingPageId,
      ...(revisionId ? { revision_id: revisionId } : {}),
    });
  } catch {
    // Diagnostic logging must not alter the fail-closed result.
  }
  return { status } as LandingPagePreviewLoadResult;
}

function isE164(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function isEmail(value: string) {
  return z.string().trim().email().safeParse(value).success;
}

function isSafeSignedUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
