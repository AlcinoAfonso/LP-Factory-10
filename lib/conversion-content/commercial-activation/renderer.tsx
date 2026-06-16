import { cn } from "@/lib/utils";
import type { ContentComposition } from "../contracts";
import {
  resolveCommercialActivationRenderModel,
  type CommercialActivationRenderModel,
} from "./resolve";
import type { CommercialActivationSectionContent } from "./schemas";

type RendererProps = {
  composition: ContentComposition;
  contentJson: unknown;
};

const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-graytech-300 bg-white px-5 py-3 text-sm font-semibold text-ink-900 shadow-sm transition-colors hover:bg-surface-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function CommercialActivationRenderer({
  composition,
  contentJson,
}: RendererProps) {
  const resolved = resolveCommercialActivationRenderModel({
    composition,
    contentJson,
    logSafeWarning: (message, details) => {
      console.warn(message, details);
    },
  });

  if (resolved.status !== "ready") {
    console.error("CommercialActivationRenderer invalid artifact", {
      reason: resolved.reason,
      compositionId: composition.id,
    });
    return null;
  }

  return <CommercialActivationSections model={resolved.model} />;
}

export function CommercialActivationSections({
  model,
}: {
  model: CommercialActivationRenderModel;
}) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card"
      data-content-schema-version={model.schemaVersion}
    >
      {model.sections.map((section) => (
        <SectionRenderer
          key={section.compositionItemId}
          content={section.content}
        />
      ))}
    </article>
  );
}

function SectionRenderer({
  content,
}: {
  content: CommercialActivationSectionContent;
}) {
  switch (content.variant_key) {
    case "hero.default":
      return <HeroDefault content={content} />;
    case "benefits.cards":
      return <CardsSection content={content} muted={false} />;
    case "services.list":
      return <ServicesList content={content} />;
    case "plans.cards":
      return <PlansCards content={content} />;
    case "differentials.cards":
      return <CardsSection content={content} muted />;
    case "how_it_works.steps":
      return <HowItWorksSteps content={content} />;
    case "faq.accordion":
      return <FaqAccordion content={content} />;
    case "final_cta.simple":
      return <FinalCtaSimple content={content} />;
  }
}

function HeroDefault({
  content,
}: {
  content: Extract<CommercialActivationSectionContent, { variant_key: "hero.default" }>;
}) {
  return (
    <section className="bg-gradient-to-br from-brand-dark-900 via-brand-dark-800 to-brand-700 px-6 py-14 text-white sm:px-10 sm:py-16 lg:px-14 lg:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-50">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {content.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
          {content.description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={content.primary_cta.href}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-brand-dark-900 shadow-sm hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-900"
          >
            {content.primary_cta.label}
          </a>
          {content.secondary_cta ? (
            <a
              href={content.secondary_cta.href}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-900"
            >
              {content.secondary_cta.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CardsSection({
  content,
  muted,
}: {
  content: Extract<
    CommercialActivationSectionContent,
    { variant_key: "benefits.cards" | "differentials.cards" }
  >;
  muted: boolean;
}) {
  return (
    <PageSection eyebrow={content.eyebrow} title={content.title} muted={muted}>
      <div className="grid gap-4 md:grid-cols-3">
        {content.items.map((item) => (
          <InfoCard
            key={item.title}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </PageSection>
  );
}

function ServicesList({
  content,
}: {
  content: Extract<CommercialActivationSectionContent, { variant_key: "services.list" }>;
}) {
  return (
    <PageSection eyebrow={content.eyebrow} title={content.title} muted>
      <ul className="grid gap-3 sm:grid-cols-2">
        {content.items.map((service) => (
          <li
            key={service}
            className="flex items-start gap-3 rounded-xl border border-surface-border bg-white p-4 text-sm font-medium leading-6 text-ink-800 shadow-card"
          >
            <span aria-hidden="true" className="font-bold text-state-success">
              {"OK"}
            </span>
            {service}
          </li>
        ))}
      </ul>
    </PageSection>
  );
}

function PlansCards({
  content,
}: {
  content: Extract<CommercialActivationSectionContent, { variant_key: "plans.cards" }>;
}) {
  return (
    <PageSection eyebrow={content.eyebrow} title={content.title} centered>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {content.plans.map((plan) => (
          <div
            key={plan.key}
            className={cn(
              "relative flex flex-col rounded-xl border border-surface-border bg-white p-5 shadow-card",
              plan.highlighted && "border-brand-500 ring-2 ring-brand-500/20",
            )}
          >
            {plan.highlighted ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                Highlight
              </span>
            ) : null}
            <h3 className="text-xl font-semibold text-ink-900">{plan.name}</h3>
            <p className="mt-2 min-h-10 text-sm leading-5 text-graytech-600">
              {plan.description}
            </p>
            <p className="mt-4 text-3xl font-bold tracking-tight text-ink-900">
              {plan.price}
              <span className="text-sm font-medium text-graytech-600">
                {plan.period}
              </span>
            </p>
            <ul className="mt-5 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-graytech-600"
                >
                  <span aria-hidden="true" className="font-bold text-state-success">
                    {"OK"}
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href={plan.cta.href}
              className={cn(
                "mt-6 w-full",
                plan.highlighted ? primaryButton : secondaryButton,
              )}
            >
              {plan.cta.label}
            </a>
          </div>
        ))}
      </div>
      {content.disclaimer ? (
        <p className="rounded-lg border border-state-warning/30 bg-amber-50 px-4 py-3 text-center text-sm font-medium leading-6 text-amber-900">
          {content.disclaimer}
        </p>
      ) : null}
    </PageSection>
  );
}

function HowItWorksSteps({
  content,
}: {
  content: Extract<
    CommercialActivationSectionContent,
    { variant_key: "how_it_works.steps" }
  >;
}) {
  return (
    <PageSection eyebrow={content.eyebrow} title={content.title} centered>
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {content.steps.map((step) => (
          <li
            key={step.label}
            className="rounded-xl border border-surface-border p-5 shadow-card"
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

function FaqAccordion({
  content,
}: {
  content: Extract<CommercialActivationSectionContent, { variant_key: "faq.accordion" }>;
}) {
  return (
    <PageSection eyebrow={content.eyebrow} title={content.title} muted>
      <div className="space-y-3">
        {content.questions.map((item) => (
          <details
            key={item.question}
            className="group rounded-xl border border-surface-border bg-white shadow-card"
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
  content,
}: {
  content: Extract<CommercialActivationSectionContent, { variant_key: "final_cta.simple" }>;
}) {
  return (
    <section className="bg-brand-50 px-6 py-12 text-center sm:px-10 lg:px-14">
      <h2 className="text-2xl font-bold tracking-tight text-brand-dark-900 sm:text-3xl">
        {content.title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-graytech-600 sm:text-base">
        {content.description}
      </p>
      <a href={content.cta.href} className={cn(primaryButton, "mt-7")}>
        {content.cta.label}
      </a>
    </section>
  );
}

type PageSectionProps = {
  eyebrow: string;
  title: string;
  centered?: boolean;
  muted?: boolean;
  children: React.ReactNode;
};

function PageSection({
  eyebrow,
  title,
  centered,
  muted,
  children,
}: PageSectionProps) {
  return (
    <section
      className={cn(
        "px-6 py-12 sm:px-10 lg:px-14",
        muted && "border-y border-surface-border bg-surface-app",
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto text-center")}>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          {title}
        </h2>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-graytech-600">
        {description}
      </p>
    </div>
  );
}
