import type { CommercialPageContentResult } from "../../../../lib/conversion-content/commercialPageContent";

type CommercialPageProps = {
  accountName: string;
  page: CommercialPageContentResult;
};

const PRIMARY_CTA_HREF =
  "mailto:suporte@lpfactory.com.br?subject=LP%20Factory%20-%20Primeira%20Entrega";
const SECONDARY_CTA_HREF =
  "mailto:suporte@lpfactory.com.br?subject=LP%20Factory%20-%20Atendimento%20Comercial";

export function CommercialPage({ accountName, page }: CommercialPageProps) {
  const { content } = page;
  const nicheName = page.accountTaxonName ?? page.researchTaxonName;
  const contextLabel = nicheName
    ? `Nicho identificado: ${nicheName}`
    : "Conteúdo comercial geral";

  return (
    <div className="overflow-hidden border-y border-surface-border bg-surface-base">
      <section className="bg-surface-app">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] lg:items-end lg:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-brand-700">{contextLabel}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
              {content.headline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-800">
              {content.primaryPromise}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-graytech-600">
              {content.context}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <CommercialLink href={PRIMARY_CTA_HREF}>
                {content.primaryCta.label}
              </CommercialLink>
              <CommercialLink href={SECONDARY_CTA_HREF} secondary>
                {content.secondaryCta.label}
              </CommercialLink>
            </div>
          </div>

          <aside className="border-l-2 border-brand-500 pl-5">
            <p className="text-xs font-semibold uppercase text-graytech-600">
              Próximo passo
            </p>
            <p className="mt-2 text-base font-semibold text-ink-900">
              {accountName}
            </p>
            <p className="mt-2 text-sm leading-6 text-graytech-600">
              {content.primaryCta.supportingText}
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-700">Como podemos ajudar</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink-900">
            Uma base comercial para sair da ideia e chegar a uma entrega
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {content.commercialCards.map((card, index) => (
            <article
              key={card.key}
              className="min-h-52 border border-surface-border bg-white p-6 shadow-card"
            >
              <span className="text-sm font-semibold text-brand-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 text-lg font-semibold text-ink-900">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-graytech-600">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-surface-border bg-ink-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[0.75fr_1.25fr] md:items-start">
          <div>
            <p className="text-sm font-semibold text-brand-500">O que você ganha</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">
              Decisoes mais claras antes de publicar
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {content.proofOrBenefitBlocks.map((block) => (
              <article key={block.key} className="border-t border-white/20 pt-5">
                <h3 className="text-base font-semibold">{block.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{block.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-ink-900">
            Pronto para organizar sua primeira entrega?
          </h2>
          <p className="mt-2 text-sm leading-6 text-graytech-600">
            {content.secondaryCta.supportingText}
          </p>
        </div>
        <CommercialLink href={PRIMARY_CTA_HREF}>
          {content.primaryCta.label}
        </CommercialLink>
      </section>
    </div>
  );
}

function CommercialLink({
  children,
  href,
  secondary = false,
}: {
  children: React.ReactNode;
  href: string;
  secondary?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        secondary
          ? "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          : "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      }
    >
      {children}
    </a>
  );
}
