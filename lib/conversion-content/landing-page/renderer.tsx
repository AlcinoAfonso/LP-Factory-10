import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import type { LandingPageComposition } from "./contracts";
import { landingPageSectionRegistry } from "./registry";
import {
  buildLandingPageRenderModel,
  type LandingPageRenderModel,
  type LandingPageRenderSection,
} from "./render-model";
import type {
  BenefitsCardsContent,
  FaqAccordionContent,
  FinalCtaSimpleContent,
  HeroLeadCaptureContent,
  HowItWorksStepsContent,
  LandingPageSectionContentByVariant,
  LandingPageSectionVariant,
  OfferSummaryContent,
  SocialProofSimpleContent,
} from "./schemas";

type RendererProps = {
  composition: LandingPageComposition;
  contentJson: unknown;
};

type SectionComponentProps<Variant extends LandingPageSectionVariant> = {
  section: LandingPageRenderSection & {
    variantKey: Variant;
    content: LandingPageSectionContentByVariant[Variant];
  };
};

type RendererRegistry = {
  [Variant in LandingPageSectionVariant]: (typeof landingPageSectionRegistry)[Variant] & {
    component: ComponentType<SectionComponentProps<Variant>>;
  };
};

const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-graytech-300 bg-white px-5 py-3 text-sm font-semibold text-ink-900 shadow-sm transition-colors hover:bg-surface-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const landingPageRendererRegistry = {
  "hero.lead_capture": {
    ...landingPageSectionRegistry["hero.lead_capture"],
    component: HeroLeadCapture,
  },
  "benefits.cards": {
    ...landingPageSectionRegistry["benefits.cards"],
    component: BenefitsCards,
  },
  "offer.summary": {
    ...landingPageSectionRegistry["offer.summary"],
    component: OfferSummary,
  },
  "social_proof.simple": {
    ...landingPageSectionRegistry["social_proof.simple"],
    component: SocialProofSimple,
  },
  "how_it_works.steps": {
    ...landingPageSectionRegistry["how_it_works.steps"],
    component: HowItWorksSteps,
  },
  "faq.accordion": {
    ...landingPageSectionRegistry["faq.accordion"],
    component: FaqAccordion,
  },
  "final_cta.simple": {
    ...landingPageSectionRegistry["final_cta.simple"],
    component: FinalCtaSimple,
  },
} satisfies RendererRegistry;

export function LandingPageRenderer({ composition, contentJson }: RendererProps) {
  const resolved = buildLandingPageRenderModel({
    composition,
    contentJson,
    logSafeWarning: (message, details) => {
      console.warn(message, details);
    },
  });

  if (resolved.status !== "ready") {
    console.error("LandingPageRenderer invalid artifact", {
      reason: resolved.reason,
      compositionId: composition.id,
    });
    return null;
  }

  return <LandingPageSections model={resolved.model} />;
}

export function LandingPageSections({ model }: { model: LandingPageRenderModel }) {
  return (
    <article
      className="overflow-hidden bg-white text-ink-900"
      data-content-channel={model.channel}
      data-content-schema-version={model.schemaVersion}
    >
      {model.sections.map((section) => (
        <SectionRenderer key={section.compositionItemId} section={section} />
      ))}
    </article>
  );
}

function SectionRenderer({ section }: { section: LandingPageRenderSection }) {
  const Component = landingPageRendererRegistry[section.variantKey]
    .component as ComponentType<{ section: LandingPageRenderSection }>;

  return <Component section={section} />;
}

function HeroLeadCapture({
  section,
}: SectionComponentProps<"hero.lead_capture">) {
  const content: HeroLeadCaptureContent = section.content;
  const titleId = `${section.compositionItemId}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="bg-surface-app px-6 py-16 sm:px-10 lg:px-14"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          {content.eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
              {content.eyebrow}
            </p>
          ) : null}
          <h1
            id={titleId}
            className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl"
          >
            {content.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-graytech-600 sm:text-lg">
            {content.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={content.primary_cta.href} className={primaryButton}>
              {content.primary_cta.label}
            </a>
            {content.secondary_cta ? (
              <a href={content.secondary_cta.href} className={secondaryButton}>
                {content.secondary_cta.label}
              </a>
            ) : null}
          </div>
        </div>
        <div className="rounded-lg border border-surface-border bg-white p-6 shadow-card">
          <p className="text-sm font-semibold text-ink-900">
            {content.lead_prompt ?? "Solicite uma proposta"}
          </p>
          <div className="mt-5 space-y-3" aria-hidden="true">
            <div className="h-11 rounded-md bg-graytech-100" />
            <div className="h-11 rounded-md bg-graytech-100" />
            <div className="h-24 rounded-md bg-graytech-100" />
            <div className="h-11 rounded-md bg-primary/20" />
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitsCards({ section }: SectionComponentProps<"benefits.cards">) {
  const content: BenefitsCardsContent = section.content;
  return (
    <PageSection
      compositionItemId={section.compositionItemId}
      eyebrow={content.eyebrow}
      title={content.title}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {content.items.map((item) => (
          <InfoBlock
            key={item.title}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </PageSection>
  );
}

function OfferSummary({ section }: SectionComponentProps<"offer.summary">) {
  const content: OfferSummaryContent = section.content;
  return (
    <PageSection
      compositionItemId={section.compositionItemId}
      eyebrow={content.eyebrow}
      title={content.title}
      muted
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <p className="text-base leading-7 text-graytech-600">
          {content.description}
        </p>
        <div>
          <ul className="space-y-3">
            {content.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3 text-sm text-ink-800">
                <span
                  aria-hidden="true"
                  className="mt-2 size-2 rounded-full bg-state-success"
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          {content.cta ? (
            <a href={content.cta.href} className={cn(primaryButton, "mt-6")}>
              {content.cta.label}
            </a>
          ) : null}
        </div>
      </div>
    </PageSection>
  );
}

function SocialProofSimple({
  section,
}: SectionComponentProps<"social_proof.simple">) {
  const content: SocialProofSimpleContent = section.content;
  return (
    <PageSection
      compositionItemId={section.compositionItemId}
      eyebrow={content.eyebrow}
      title={content.title}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {content.proof_items.map((item) => (
          <InfoBlock
            key={item.title}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </PageSection>
  );
}

function HowItWorksSteps({
  section,
}: SectionComponentProps<"how_it_works.steps">) {
  const content: HowItWorksStepsContent = section.content;
  return (
    <PageSection
      compositionItemId={section.compositionItemId}
      eyebrow={content.eyebrow}
      title={content.title}
      muted
    >
      <ol className="grid gap-4 md:grid-cols-3">
        {content.steps.map((step) => (
          <li
            key={step.label}
            className="rounded-lg border border-surface-border bg-white p-5 shadow-card"
          >
            <span className="text-sm font-bold text-brand-700">
              {step.label}
            </span>
            <h3 className="mt-3 text-lg font-semibold text-ink-900">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-graytech-600">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </PageSection>
  );
}

function FaqAccordion({ section }: SectionComponentProps<"faq.accordion">) {
  const content: FaqAccordionContent = section.content;
  return (
    <PageSection
      compositionItemId={section.compositionItemId}
      eyebrow={content.eyebrow}
      title={content.title}
    >
      <div className="space-y-3">
        {content.questions.map((item) => (
          <details
            key={item.question}
            className="group rounded-lg border border-surface-border bg-white shadow-card"
          >
            <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-xl text-brand-700 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="border-t border-surface-border px-5 py-4 text-sm leading-6 text-graytech-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </PageSection>
  );
}

function FinalCtaSimple({
  section,
}: SectionComponentProps<"final_cta.simple">) {
  const content: FinalCtaSimpleContent = section.content;
  const titleId = `${section.compositionItemId}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="bg-brand-50 px-6 py-14 text-center sm:px-10 lg:px-14"
    >
      <h2
        id={titleId}
        className="text-3xl font-bold tracking-tight text-brand-dark-900"
      >
        {content.title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-graytech-600">
        {content.description}
      </p>
      <a href={content.cta.href} className={cn(primaryButton, "mt-7")}>
        {content.cta.label}
      </a>
    </section>
  );
}

function PageSection({
  compositionItemId,
  eyebrow,
  title,
  muted,
  children,
}: {
  compositionItemId: string;
  eyebrow?: string;
  title: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  const titleId = `${compositionItemId}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "px-6 py-12 sm:px-10 lg:px-14",
        muted && "border-y border-surface-border bg-surface-app",
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={titleId}
          className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
        >
          {title}
        </h2>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function InfoBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-white p-5 shadow-card">
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-graytech-600">
        {description}
      </p>
    </div>
  );
}
