'use client';

import { useEffect } from 'react';

import { cn } from '@/lib/utils';
import {
  genericCommercialPageContent,
  type CommercialPlanKey,
} from '../../_content/commercial-page/generic-v1';
import { trackCommercialEvent } from './actions';

type Props = {
  accountSubdomain: string;
};

const primaryButton =
  'inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center rounded-md border border-graytech-300 bg-white px-5 py-3 text-sm font-semibold text-ink-900 shadow-sm transition-colors hover:bg-surface-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function GenericCommercialPage({ accountSubdomain }: Props) {
  const content = genericCommercialPageContent;

  useEffect(() => {
    void trackCommercialEvent({
      accountSubdomain,
      event: 'commercial_page_view',
    });
  }, [accountSubdomain]);

  const trackPrimary = (ctaLocation: 'hero' | 'final') => {
    void trackCommercialEvent({
      accountSubdomain,
      event: 'commercial_primary_cta_click',
      ctaLocation,
    });
  };

  const trackPlan = (planKey: CommercialPlanKey) => {
    void trackCommercialEvent({
      accountSubdomain,
      event: 'commercial_plan_cta_click',
      planKey,
      ctaLocation: 'plan_card',
    });
  };

  return (
    <article
      className="overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card"
      data-page-variant={content.variant}
    >
      <section className="bg-gradient-to-br from-brand-dark-900 via-brand-dark-800 to-brand-700 px-6 py-14 text-white sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-50">
            {content.hero.eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {content.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
            {content.hero.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#planos"
              onClick={() => trackPrimary('hero')}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-brand-dark-900 shadow-sm hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-900"
            >
              {content.hero.primaryCta}
            </a>
            <a
              href="#como-funciona"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark-900"
            >
              {content.hero.secondaryCta}
            </a>
          </div>
          <p className="mt-5 text-sm text-white/65">
            Próximo passo: compare os planos e fale com a equipe sobre a primeira página.
          </p>
        </div>
      </section>

      <PageSection eyebrow="Benefícios" title="O essencial para uma página comercial clara">
        <div className="grid gap-4 md:grid-cols-3">
          {content.benefits.map((item) => (
            <InfoCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Serviços"
        title="Uma entrega organizada do conteúdo à publicação"
        muted
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {content.services.map((service) => (
            <li
              key={service}
              className="flex items-start gap-3 rounded-xl border border-surface-border bg-white p-4 text-sm font-medium leading-6 text-ink-800 shadow-card"
            >
              <span aria-hidden="true" className="font-bold text-state-success">✓</span>
              {service}
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection
        id="planos"
        eyebrow="Planos ilustrativos"
        title="Compare a capacidade de cada opção"
        description="Os cards validam hierarquia, leitura e decisão antes da definição comercial definitiva."
        centered
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {content.plans.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                'relative flex flex-col rounded-xl border border-surface-border bg-white p-5 shadow-card',
                plan.highlighted && 'border-brand-500 ring-2 ring-brand-500/20',
              )}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  Destaque visual
                </span>
              ) : null}
              <h3 className="text-xl font-semibold text-ink-900">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-sm leading-5 text-graytech-600">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold tracking-tight text-ink-900">
                {plan.price}<span className="text-sm font-medium text-graytech-600">{plan.period}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-graytech-600">
                    <span aria-hidden="true" className="font-bold text-state-success">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:suporte@lpfactory.com.br?subject=${encodeURIComponent(`LP Factory - Interesse no plano ilustrativo ${plan.name}`)}`}
                onClick={() => trackPlan(plan.key)}
                className={cn('mt-6 w-full', plan.highlighted ? primaryButton : secondaryButton)}
              >
                Tenho interesse
              </a>
            </div>
          ))}
        </div>
        <p className="rounded-lg border border-state-warning/30 bg-amber-50 px-4 py-3 text-center text-sm font-medium leading-6 text-amber-900">
          {content.plansDisclaimer}
        </p>
      </PageSection>

      <PageSection eyebrow="Diferenciais" title="Uma base simples para validar antes de ampliar" muted>
        <div className="grid gap-4 md:grid-cols-3">
          {content.differentiators.map((item) => (
            <InfoCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
      </PageSection>

      <PageSection
        id="como-funciona"
        eyebrow="Como funciona"
        title="Quatro passos até a publicação"
        centered
      >
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.process.map((item) => (
            <li key={item.step} className="rounded-xl border border-surface-border p-5 shadow-card">
              <span className="text-sm font-bold text-brand-700">{item.step}</span>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-graytech-600">{item.description}</p>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection eyebrow="FAQ" title="Perguntas frequentes" muted>
        <div className="space-y-3">
          {content.faq.map((item) => (
            <details key={item.question} className="group rounded-xl border border-surface-border bg-white shadow-card">
              <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span aria-hidden="true" className="text-xl text-brand-700 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="border-t border-surface-border px-5 py-4 text-sm leading-6 text-graytech-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </PageSection>

      <section className="bg-brand-50 px-6 py-12 text-center sm:px-10 lg:px-14">
        <h2 className="text-2xl font-bold tracking-tight text-brand-dark-900 sm:text-3xl">
          {content.finalCta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-graytech-600 sm:text-base">
          {content.finalCta.description}
        </p>
        <a
          href={content.finalCta.href}
          onClick={() => trackPrimary('final')}
          className={cn(primaryButton, 'mt-7')}
        >
          {content.finalCta.label}
        </a>
      </section>
    </article>
  );
}

type PageSectionProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
  muted?: boolean;
  children: React.ReactNode;
};

function PageSection({ id, eyebrow, title, description, centered, muted, children }: PageSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-24 px-6 py-12 sm:px-10 lg:px-14', muted && 'border-y border-surface-border bg-surface-app')}>
      <div className={cn('max-w-2xl', centered && 'mx-auto text-center')}>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-graytech-600 sm:text-base">{description}</p> : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-graytech-600">{description}</p>
    </div>
  );
}
