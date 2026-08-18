import Image from "next/image";

import type {
  LandingPageRenderModel,
  LandingPageRenderSection,
} from "../../lib/lp-builder/landingPagePreview";

export function LandingPageRenderer({
  model,
}: Readonly<{ model: LandingPageRenderModel }>) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#fbfaf7] text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
      {model.sections.map((section, index) => (
        <LandingPageSection
          key={`${section.kind}-${index}`}
          section={section}
          model={model}
          imagePriority={section.kind === "hero"}
        />
      ))}
    </article>
  );
}

function LandingPageSection({
  section,
  model,
  imagePriority,
}: Readonly<{
  section: LandingPageRenderSection;
  model: LandingPageRenderModel;
  imagePriority: boolean;
}>) {
  switch (section.kind) {
    case "header":
      return (
        <header data-section-kind="header" className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-5 py-4 sm:px-8 lg:px-12">
          {model.brandName ? (
            <p className="min-w-0 text-sm font-bold tracking-tight text-slate-950 sm:text-base">
              {model.brandName}
            </p>
          ) : <span aria-hidden="true" />}
          {section.ctaLabel ? (
            <ConversionLink href={model.conversion.href} channel={model.conversion.channel} compact>
              {section.ctaLabel}
            </ConversionLink>
          ) : null}
        </header>
      );
    case "hero": {
      const mediaFirst = section.layout === "media_left";
      return (
        <section data-section-kind="hero" className="grid min-h-[34rem] items-stretch bg-[#f6f1e8] lg:grid-cols-2">
          <div className={`flex items-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20 ${mediaFirst ? "lg:order-2" : ""}`}>
            <div className="mx-auto w-full max-w-xl">
              {section.eyebrow ? (
                <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-amber-800 sm:text-sm">
                  {section.eyebrow}
                </p>
              ) : null}
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                {section.heading}
              </h1>
              <p className="mt-6 max-w-[62ch] text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                {section.body}
              </p>
              <div className="mt-8">
                <ConversionLink href={model.conversion.href} channel={model.conversion.channel}>
                  {section.ctaLabel}
                </ConversionLink>
              </div>
            </div>
          </div>
          <div className={`relative min-h-72 overflow-hidden bg-slate-200 sm:min-h-96 lg:min-h-full ${mediaFirst ? "lg:order-1" : ""}`}>
            <Image
              src={model.media.mainImage.url}
              alt={model.media.mainImage.alt}
              fill
              priority={imagePriority}
              unoptimized
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" aria-hidden="true" />
          </div>
        </section>
      );
    }
    case "text_media": {
      const alignRight = section.layout === "media_right";
      return (
        <section data-section-kind="text_media" className="border-t border-slate-200 bg-white px-6 py-14 sm:px-10 sm:py-20 lg:px-14">
          <div className={`mx-auto grid max-w-6xl gap-8 lg:grid-cols-12 lg:items-start ${alignRight ? "" : "lg:[&>*:first-child]:col-start-2"}`}>
            <h2 className={`text-balance text-3xl font-bold tracking-[-0.025em] text-slate-950 sm:text-4xl lg:col-span-5 ${alignRight ? "lg:col-start-2" : "lg:col-span-4"}`}>
              {section.heading}
            </h2>
            <p className={`text-base leading-7 text-slate-700 sm:text-lg sm:leading-8 lg:col-span-5 ${alignRight ? "lg:col-start-7" : "lg:col-start-7"}`}>
              {section.body}
            </p>
          </div>
        </section>
      );
    }
    case "cards_grid":
      return (
        <section data-section-kind="cards_grid" className="border-t border-slate-200 bg-slate-950 px-6 py-14 text-white sm:px-10 sm:py-20 lg:px-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-3xl text-balance text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
              {section.heading}
            </h2>
            {section.intro ? (
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                {section.intro}
              </p>
            ) : null}
            <div className={`mt-10 grid gap-4 ${section.layout === "grid_3" ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"}`}>
              {section.cards.map((card, index) => (
                <article key={`${card.title}-${index}`} className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 sm:p-7">
                  <h3 className="text-xl font-semibold tracking-tight">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    case "steps":
      return (
        <section data-section-kind="steps" className="border-t border-slate-200 bg-[#f6f1e8] px-6 py-14 sm:px-10 sm:py-20 lg:px-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-3xl text-balance text-3xl font-bold tracking-[-0.025em] text-slate-950 sm:text-4xl">
              {section.heading}
            </h2>
            {section.intro ? <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">{section.intro}</p> : null}
            <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item, index) => (
                <li key={`${item.title}-${index}`} className="rounded-2xl border border-amber-900/15 bg-white p-6 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-full bg-amber-700 text-sm font-bold text-white" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );
    case "faq":
      return (
        <section data-section-kind="faq" className="border-t border-slate-200 bg-white px-6 py-14 sm:px-10 sm:py-20 lg:px-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-slate-950 sm:text-4xl">
              {section.heading}
            </h2>
            <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">
              {section.items.map((item, index) => (
                <details key={`${item.question}-${index}`} className="group py-1">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-4 text-base font-semibold text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-4 sm:text-lg">
                    {item.question}
                    <span aria-hidden="true" className="text-2xl font-light text-amber-800 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-3xl pb-5 pr-8 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );
    case "cta":
      return (
        <section data-section-kind="cta" className="border-t border-amber-500/20 bg-amber-700 px-6 py-14 text-center text-white sm:px-10 sm:py-20 lg:px-14">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] sm:text-4xl lg:text-5xl">
              {section.heading}
            </h2>
            {section.body ? <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-amber-50 sm:text-lg">{section.body}</p> : null}
            <div className="mt-8">
              <ConversionLink href={model.conversion.href} channel={model.conversion.channel} inverted>
                {section.ctaLabel}
              </ConversionLink>
            </div>
          </div>
        </section>
      );
    case "footer":
      return (
        <footer data-section-kind="footer" className="border-t border-slate-800 bg-slate-950 px-6 py-9 text-slate-300 sm:px-10 lg:px-14">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {model.brandName ? <p className="text-sm font-semibold text-white">{model.brandName}</p> : <span aria-hidden="true" />}
            {section.tagline ? <p className="max-w-xl text-sm leading-6">{section.tagline}</p> : null}
          </div>
        </footer>
      );
    default:
      return observeUnknownSection(section);
  }
}

function ConversionLink({
  href,
  channel,
  children,
  compact = false,
  inverted = false,
}: Readonly<{
  href: string;
  channel: LandingPageRenderModel["conversion"]["channel"];
  children: React.ReactNode;
  compact?: boolean;
  inverted?: boolean;
}>) {
  const opensNewContext = channel === "whatsapp" || channel === "external_url";
  return (
    <a
      href={href}
      {...(opensNewContext ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`inline-flex min-h-11 items-center justify-center rounded-full font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-4 ${compact ? "px-4 py-2 text-sm" : "px-6 py-3 text-sm sm:text-base"} ${inverted ? "bg-white text-amber-900 hover:bg-amber-50" : "bg-amber-700 text-white hover:bg-amber-800"}`}
    >
      {children}
    </a>
  );
}

function observeUnknownSection(section: never) {
  const kind = typeof (section as { kind?: unknown })?.kind === "string"
    ? (section as { kind: string }).kind
    : "invalid";
  console.error(JSON.stringify({
    event: "landing_page_renderer_invalid_section",
    reason: "unknown_kind",
    kind,
  }));
  return null;
}
