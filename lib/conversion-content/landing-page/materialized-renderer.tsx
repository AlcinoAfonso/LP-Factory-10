import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  resolveLandingPageMaterializedContentForRendering,
  type LandingPageMaterializedContentV1,
} from "./materialization";

type MaterializedModule = LandingPageMaterializedContentV1["modules"][number];
type MaterializedField = MaterializedModule["fields"][number];
type CollectionField = Extract<MaterializedField, { kind: "collection" }>;
type ActionField = Extract<MaterializedField, { kind: "action" }>;
type FormInteraction = Extract<MaterializedModule["interactionContracts"][number], { kind: "form" }>;
type Typography = LandingPageMaterializedContentV1["root"]["resolvedPreset"]["typography"];
type PaletteStyle = CSSProperties & Readonly<{
  "--lp-primary": string;
  "--lp-secondary": string;
  "--lp-accent": string;
  "--lp-background": string;
  "--lp-text": string;
}>;

type SupportedItemField = Readonly<{
  fieldKey: string;
  kind: "text" | "technical_reference";
  referenceKey?: string;
}>;
type SupportedField = Readonly<{
  fieldKey: string;
  kind: MaterializedField["kind"];
  optional?: boolean;
  itemFields?: readonly SupportedItemField[];
  minItems?: number;
  maxItems?: number;
  actionChannel?: string;
}>;
type SupportedVariant = Readonly<{
  moduleKey: string;
  fields: readonly SupportedField[];
  interaction: "none" | "form" | "accordion";
}>;

const SUPPORTED_VARIANTS = {
  "hero.standard@v1": {
    moduleKey: "hero",
    fields: [
      { fieldKey: "eyebrow", kind: "text", optional: true },
      { fieldKey: "title", kind: "text" },
      { fieldKey: "subtitle", kind: "text" },
      { fieldKey: "primaryCta", kind: "action" },
      { fieldKey: "proofShort", kind: "text", optional: true },
      { fieldKey: "media", kind: "image", optional: true },
    ],
    interaction: "none",
  },
  "hero.form@v1": {
    moduleKey: "hero",
    fields: [
      { fieldKey: "eyebrow", kind: "text", optional: true },
      { fieldKey: "title", kind: "text" },
      { fieldKey: "subtitle", kind: "text" },
      { fieldKey: "primaryCta", kind: "action", actionChannel: "form" },
      { fieldKey: "proofShort", kind: "text", optional: true },
      { fieldKey: "media", kind: "image", optional: true },
    ],
    interaction: "form",
  },
  "trust_bar.standard@v1": {
    moduleKey: "trust_bar",
    fields: [{ fieldKey: "items", kind: "collection", itemFields: [{ fieldKey: "text", kind: "text" }], minItems: 2, maxItems: 4 }],
    interaction: "none",
  },
  "problem_solution.standard@v1": {
    moduleKey: "problem_solution",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "items", kind: "collection", itemFields: [{ fieldKey: "problem", kind: "text" }, { fieldKey: "solution", kind: "text" }], minItems: 2, maxItems: 4 },
    ],
    interaction: "none",
  },
  "offer.standard@v1": {
    moduleKey: "offer",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "items", kind: "collection", itemFields: [{ fieldKey: "itemTitle", kind: "text" }, { fieldKey: "description", kind: "text" }], minItems: 1, maxItems: 4 },
    ],
    interaction: "none",
  },
  "benefits.standard@v1": {
    moduleKey: "benefits",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "items", kind: "collection", itemFields: [{ fieldKey: "benefitTitle", kind: "text" }, { fieldKey: "description", kind: "text" }], minItems: 2, maxItems: 6 },
    ],
    interaction: "none",
  },
  "comparison.standard@v1": {
    moduleKey: "comparison",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "items", kind: "collection", itemFields: [{ fieldKey: "optionTitle", kind: "text" }, { fieldKey: "description", kind: "text" }], minItems: 2, maxItems: 4 },
    ],
    interaction: "none",
  },
  "lead_capture.form@v1": {
    moduleKey: "lead_capture",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "body", kind: "text" },
      { fieldKey: "primaryCta", kind: "action", actionChannel: "form" },
    ],
    interaction: "form",
  },
  "process.standard@v1": {
    moduleKey: "process",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "steps", kind: "collection", itemFields: [{ fieldKey: "stepTitle", kind: "text" }, { fieldKey: "stepBody", kind: "text" }], minItems: 2, maxItems: 6 },
    ],
    interaction: "none",
  },
  "technical_assurance.standard@v1": {
    moduleKey: "technical_assurance",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "items", kind: "collection", itemFields: [{ fieldKey: "assuranceTitle", kind: "text" }, { fieldKey: "assuranceBody", kind: "text" }], minItems: 1, maxItems: 4 },
    ],
    interaction: "none",
  },
  "social_proof.standard@v1": {
    moduleKey: "social_proof",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "items", kind: "collection", itemFields: [
        { fieldKey: "quote", kind: "text" },
        { fieldKey: "attribution", kind: "text" },
        { fieldKey: "evidenceRef", kind: "technical_reference", referenceKey: "social_proof.standard.items[].evidenceRef" },
      ], minItems: 1, maxItems: 3 },
    ],
    interaction: "none",
  },
  "faq.standard@v1": {
    moduleKey: "faq",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "items", kind: "collection", itemFields: [{ fieldKey: "question", kind: "text" }, { fieldKey: "answer", kind: "text" }], minItems: 2, maxItems: 6 },
    ],
    interaction: "none",
  },
  "faq.accordion@v1": {
    moduleKey: "faq",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "items", kind: "collection", itemFields: [{ fieldKey: "question", kind: "text" }, { fieldKey: "answer", kind: "text" }], minItems: 2, maxItems: 6 },
    ],
    interaction: "accordion",
  },
  "final_cta.standard@v1": {
    moduleKey: "final_cta",
    fields: [
      { fieldKey: "title", kind: "text" },
      { fieldKey: "body", kind: "text" },
      { fieldKey: "primaryCta", kind: "action" },
    ],
    interaction: "none",
  },
} as const satisfies Readonly<Record<string, SupportedVariant>>;

const CONTACT_FORM_INTERACTION = {
  kind: "form",
  fields: [
    { fieldKey: "name", valueType: "text", obligation: "required", purposeKey: "contact_identity" },
    { fieldKey: "email", valueType: "email", obligation: "required", purposeKey: "reply_email" },
    { fieldKey: "phone", valueType: "phone", obligation: "optional", purposeKey: "optional_phone" },
  ],
  consent: {
    required: true,
    fieldKey: "privacyConsent",
    purposeKey: "privacy_policy_consent",
    privacyPolicyInputFieldKey: "privacy_policy_url",
  },
  accessibility: {
    baseline: "WCAG 2.2",
    labelsProgrammaticallyAssociated: true,
    instructionsProgrammaticallyAssociated: true,
    errorsProgrammaticallyAssociated: true,
    keyboardOperable: true,
    focusMovesToFirstInvalidField: true,
  },
  operationalBinding: {
    inputCatalogFieldKey: "primary_conversion_channel",
    requiredValue: "form",
  },
} as const;

export type ResolveLandingPageMaterializedRendererResult =
  | Readonly<{ ok: true; value: LandingPageMaterializedContentV1 }>
  | Readonly<{ ok: false; error: "INVALID_CONTENT" | "UNSUPPORTED_IDENTITY" }>;

export function resolveLandingPageMaterializedRendererModel(
  input: unknown,
): ResolveLandingPageMaterializedRendererResult {
  const content = resolveLandingPageMaterializedContentForRendering(input);
  if (!content.ok) return { ok: false, error: "INVALID_CONTENT" };
  if (
    content.value.root.rootVersion !== 1 ||
    content.value.modules.some((module) => !isSupportedModule(module))
  ) {
    return { ok: false, error: "UNSUPPORTED_IDENTITY" };
  }
  return { ok: true, value: content.value };
}

export function LandingPageMaterializedRenderer({ content }: { content: unknown }) {
  const resolved = resolveLandingPageMaterializedRendererModel(content);
  if (!resolved.ok) {
    return (
      <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h2 className="break-words text-lg font-semibold">Não foi possível reproduzir esta landing page.</h2>
        <p className="mt-2 break-words text-sm leading-6">
          A identidade, a versão ou o conteúdo materializado não é suportado por este preview.
        </p>
      </section>
    );
  }

  const root = resolved.value.root;
  const rendererStyle = {
    maxWidth: root.resolvedPreset.maxPageWidth,
    fontSize: root.resolvedPreset.typography.body.base,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    backgroundColor: root.brandColorPalette.background,
    color: root.brandColorPalette.text,
    "--lp-primary": root.brandColorPalette.primary,
    "--lp-secondary": root.brandColorPalette.secondary,
    "--lp-accent": root.brandColorPalette.accent,
    "--lp-background": root.brandColorPalette.background,
    "--lp-text": root.brandColorPalette.text,
  } satisfies PaletteStyle;

  return (
    <article
      className="mx-auto w-full rounded-2xl border border-[var(--lp-secondary)] bg-[var(--lp-background)] text-[var(--lp-text)] shadow-card"
      data-landing-page-schema-version={resolved.value.schemaVersion}
      data-landing-page-root-version={root.rootVersion}
      style={rendererStyle}
    >
      {resolved.value.modules.map((module, index) => (
        <MaterializedModuleRenderer
          key={`${module.moduleKey}:${module.variantKey}`}
          module={module}
          moduleIndex={index}
          density={root.resolvedPreset.density}
          typography={root.resolvedPreset.typography}
        />
      ))}
    </article>
  );
}

function isSupportedModule(module: MaterializedModule) {
  const supported = SUPPORTED_VARIANTS[module.variantKey as keyof typeof SUPPORTED_VARIANTS];
  if (
    !supported ||
    supported.moduleKey !== module.moduleKey ||
    module.moduleVersion !== 1 ||
    module.variantVersion !== 1 ||
    !matchesMaterializedFields(module.fields, supported.fields)
  ) {
    return false;
  }
  if (supported.interaction === "form") {
    return module.interactionContracts.length === 1 &&
      module.interactionContracts[0].kind === "form" &&
      isSupportedFormInteraction(module.interactionContracts[0]);
  }
  if (supported.interaction === "accordion") {
    return module.interactionContracts.length === 1 && module.interactionContracts[0].kind === "accordion";
  }
  return module.interactionContracts.length === 0;
}

function isSupportedFormInteraction(interaction: FormInteraction) {
  const { privacyPolicyUrl, ...consent } = interaction.consent;
  return isHttpsUrl(privacyPolicyUrl) && JSON.stringify({
    ...interaction,
    consent,
  }) === JSON.stringify(CONTACT_FORM_INTERACTION);
}

function matchesMaterializedFields(
  fields: readonly MaterializedField[],
  supportedFields: readonly SupportedField[],
) {
  const supportedByKey = new Map(supportedFields.map((field) => [field.fieldKey, field]));
  const actualByKey = new Map(fields.map((field) => [field.fieldKey, field]));
  if (actualByKey.size !== fields.length) return false;
  if (fields.some((field) => !supportedByKey.has(field.fieldKey))) return false;
  if (supportedFields.some((field) => !field.optional && !actualByKey.has(field.fieldKey))) return false;

  for (const field of fields) {
    const supported = supportedByKey.get(field.fieldKey);
    if (!supported || supported.kind !== field.kind) return false;
    if (field.kind === "action" && supported.actionChannel && field.binding.channel !== supported.actionChannel) {
      return false;
    }
    if (field.kind !== "collection") continue;
    if (
      !supported.itemFields ||
      supported.minItems === undefined ||
      supported.maxItems === undefined ||
      field.items.length < supported.minItems ||
      field.items.length > supported.maxItems
    ) {
      return false;
    }
    const supportedItemByKey = new Map(supported.itemFields.map((itemField) => [itemField.fieldKey, itemField]));
    for (const item of field.items) {
      if (item.fields.length !== supported.itemFields.length) return false;
      for (const itemField of item.fields) {
        const supportedItem = supportedItemByKey.get(itemField.fieldKey);
        if (!supportedItem || supportedItem.kind !== itemField.kind) return false;
        if (
          itemField.kind === "technical_reference" &&
          supportedItem.referenceKey !== itemField.referenceKey
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function MaterializedModuleRenderer({
  module,
  moduleIndex,
  density,
  typography,
}: {
  module: MaterializedModule;
  moduleIndex: number;
  density: "compact" | "default" | "spacious";
  typography: Typography;
}) {
  if (module.moduleKey === "hero") {
    return <HeroModule module={module} typography={typography} />;
  }
  if (module.moduleKey === "trust_bar") {
    return <TrustBarModule module={module} />;
  }
  if (module.moduleKey === "faq") {
    return <FaqModule module={module} moduleIndex={moduleIndex} typography={typography} />;
  }
  if (module.moduleKey === "final_cta") {
    return <FinalCtaModule module={module} typography={typography} />;
  }
  if (module.moduleKey === "lead_capture") {
    return <LeadCaptureModule module={module} typography={typography} />;
  }
  return <CollectionModule module={module} density={density} typography={typography} />;
}

function HeroModule({ module, typography }: { module: MaterializedModule; typography: Typography }) {
  const action = actionField(module, "primaryCta");
  const formInteraction = module.interactionContracts.find((candidate) => candidate.kind === "form");
  return (
    <section className="border-t-8 border-[var(--lp-primary)] bg-[var(--lp-background)] px-5 py-12 text-[var(--lp-text)] first:rounded-t-2xl sm:px-10 sm:py-16 lg:px-14 lg:py-20">
      <div className="min-w-0 max-w-3xl">
        {textValue(module, "eyebrow") ? (
          <p className="break-words text-sm font-semibold uppercase tracking-[0.18em] text-[var(--lp-primary)]">
            {textValue(module, "eyebrow")}
          </p>
        ) : null}
        <h1
          className="mt-4 break-words font-bold leading-tight tracking-tight"
          style={{ fontSize: `clamp(${typography.h1.min}, 6vw, ${typography.h1.max})` }}
        >
          {textValue(module, "title")}
        </h1>
        <p className="mt-5 max-w-2xl break-words text-base leading-7 opacity-85 sm:text-lg">
          {textValue(module, "subtitle")}
        </p>
        {textValue(module, "proofShort") ? (
          <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-[var(--lp-secondary)]">
            {textValue(module, "proofShort")}
          </p>
        ) : null}
        {formInteraction?.kind === "form" ? (
          <MaterializedReadOnlyForm
            action={action}
            interaction={formInteraction}
            scope="hero"
          />
        ) : action ? (
          <MaterializedAction action={action} className="mt-8" />
        ) : null}
        {field(module, "media")?.kind === "image" ? (
          <p className="mt-6 break-words text-xs font-medium opacity-70">Imagem de apoio configurada.</p>
        ) : null}
      </div>
    </section>
  );
}

function TrustBarModule({ module }: { module: MaterializedModule }) {
  const items = collectionField(module, "items")?.items ?? [];
  return (
    <section aria-label="Sinais de confiança" className="border-b border-[var(--lp-secondary)] bg-[var(--lp-background)] px-5 py-5 sm:px-10 lg:px-14">
      <ul className="flex flex-wrap justify-center gap-3">
        {items.map((item, index) => (
          <li key={index} className="min-w-0 max-w-full break-words rounded-full border border-[var(--lp-primary)] bg-[var(--lp-background)] px-4 py-2 text-sm font-semibold text-[var(--lp-text)]">
            {itemTextValues(item.fields)[0]}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CollectionModule({ module, density, typography }: {
  module: MaterializedModule;
  density: "compact" | "default" | "spacious";
  typography: Typography;
}) {
  const collection = module.fields.find((candidate) => candidate.kind === "collection") as CollectionField | undefined;
  const sectionPadding = density === "compact" ? "py-9" : density === "spacious" ? "py-16" : "py-12";
  const muted = ["problem_solution", "technical_assurance", "comparison"].includes(module.moduleKey);
  return (
    <section className={cn("px-5 sm:px-10 lg:px-14", sectionPadding, muted && "border-y border-[var(--lp-secondary)] bg-[var(--lp-background)]")}>
      <SectionHeading module={module} typography={typography} />
      {collection ? (
        <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collection.items.map((item, index) => {
            const values = itemTextValues(item.fields);
            return (
              <li key={index} className="min-w-0 rounded-xl border border-[var(--lp-secondary)] bg-[var(--lp-background)] p-5 shadow-card">
                {module.moduleKey === "process" ? (
                  <span className="text-sm font-bold text-[var(--lp-primary)]">Etapa {index + 1}</span>
                ) : null}
                <h3 className="mt-2 break-words text-lg font-semibold">{values[0]}</h3>
                {values.slice(1).map((value, valueIndex) => (
                  <p key={valueIndex} className="mt-2 break-words text-sm leading-6 opacity-75">{value}</p>
                ))}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}

function FaqModule({ module, moduleIndex, typography }: {
  module: MaterializedModule;
  moduleIndex: number;
  typography: Typography;
}) {
  const items = collectionField(module, "items")?.items ?? [];
  const accordion = module.variantKey === "faq.accordion@v1";
  return (
    <section className="border-y border-[var(--lp-secondary)] bg-[var(--lp-background)] px-5 py-12 sm:px-10 lg:px-14">
      <SectionHeading module={module} typography={typography} />
      <div className="mt-8 space-y-3">
        {items.map((item, index) => {
          const values = itemTextValues(item.fields);
          return accordion ? (
            <details key={index} name={`landing-page-faq-${moduleIndex}`} className="group rounded-xl border border-[var(--lp-secondary)] bg-[var(--lp-background)] shadow-card">
              <summary className="min-h-11 cursor-pointer list-none px-5 py-4 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--lp-accent)] [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 items-center justify-between gap-4">
                  <span className="min-w-0 break-words">{values[0]}</span>
                  <span aria-hidden="true" className="shrink-0 text-xl text-[var(--lp-primary)] transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="break-words border-t border-[var(--lp-secondary)] px-5 py-4 text-sm leading-6 opacity-75">{values[1]}</p>
            </details>
          ) : (
            <article key={index} className="rounded-xl border border-[var(--lp-secondary)] bg-[var(--lp-background)] px-5 py-4 shadow-card">
              <h3 className="break-words font-semibold">{values[0]}</h3>
              <p className="mt-2 break-words text-sm leading-6 opacity-75">{values[1]}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FinalCtaModule({ module, typography }: { module: MaterializedModule; typography: Typography }) {
  const action = actionField(module, "primaryCta");
  return (
    <section className="rounded-b-2xl border-t-4 border-[var(--lp-primary)] bg-[var(--lp-background)] px-5 py-12 text-center sm:px-10 lg:px-14">
      <SectionHeading module={module} typography={typography} centered />
      {textValue(module, "body") ? (
        <p className="mx-auto mt-4 max-w-2xl break-words text-sm leading-6 opacity-75 sm:text-base">{textValue(module, "body")}</p>
      ) : null}
      {action ? <MaterializedAction action={action} className="mt-7" /> : null}
    </section>
  );
}

function LeadCaptureModule({ module, typography }: { module: MaterializedModule; typography: Typography }) {
  const interaction = module.interactionContracts.find((candidate) => candidate.kind === "form");
  const action = actionField(module, "primaryCta");
  return (
    <section id="lead-capture" className="px-5 py-12 sm:px-10 lg:px-14">
      <SectionHeading module={module} typography={typography} />
      <p className="mt-4 max-w-2xl break-words text-sm leading-6 opacity-75">{textValue(module, "body")}</p>
      {interaction?.kind === "form" ? (
        <MaterializedReadOnlyForm action={action} interaction={interaction} scope="lead-capture" />
      ) : null}
    </section>
  );
}

function MaterializedReadOnlyForm({
  action,
  interaction,
  scope,
}: {
  action: ActionField | null;
  interaction: FormInteraction;
  scope: "hero" | "lead-capture";
}) {
  const instructionsId = `${scope}-draft-form-instructions`;
  return (
    <form
      action={`#${scope}-draft-form`}
      className="mt-8 grid max-w-2xl gap-4 rounded-xl border border-[var(--lp-secondary)] bg-[var(--lp-background)] p-5"
      id={`${scope}-draft-form`}
    >
      <p id={instructionsId} className="break-words text-xs leading-5 opacity-75">
        Preencha os campos obrigatórios para validar o formulário neste preview. Nenhum dado será enviado.
      </p>
      {interaction.fields.map((formField) => {
        const inputId = `${scope}-draft-form-${formField.fieldKey}`;
        return (
          <label key={formField.fieldKey} htmlFor={inputId} className="grid gap-2 break-words text-sm font-semibold">
            {formFieldLabel(formField.fieldKey)}
            <input
              id={inputId}
              aria-describedby={instructionsId}
              type={formField.valueType === "phone" ? "tel" : formField.valueType}
              required={formField.obligation === "required"}
              className="min-h-11 min-w-0 rounded-lg border border-[var(--lp-secondary)] bg-[var(--lp-background)] px-3 font-normal text-[var(--lp-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
            />
          </label>
        );
      })}
      <label htmlFor={`${scope}-draft-form-consent`} className="flex items-start gap-3 break-words text-sm leading-6">
        <input id={`${scope}-draft-form-consent`} aria-describedby={instructionsId} type="checkbox" required className="mt-1 size-4 shrink-0" />
        <span>
          Concordo com o uso dos dados para este contato e com a{" "}
          <a
            href={interaction.consent.privacyPolicyUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline decoration-[var(--lp-accent)] underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
          >
            política de privacidade
          </a>.
        </span>
      </label>
      <button
        type="submit"
        className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-lg border-2 border-[var(--lp-primary)] bg-[var(--lp-text)] px-5 py-3 text-sm font-semibold text-[var(--lp-background)] shadow-sm outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2"
      >
        <span className="break-words">{action?.label ?? "Validar formulário"}</span>
      </button>
    </form>
  );
}

function SectionHeading({ module, typography, centered = false }: {
  module: MaterializedModule;
  typography: Typography;
  centered?: boolean;
}) {
  const title = textValue(module, "title");
  if (!title) return null;
  return (
    <h2
      className={cn("break-words font-bold leading-tight tracking-tight", centered && "mx-auto max-w-3xl text-center")}
      style={{ fontSize: `clamp(${typography.h2.min}, 4vw, ${typography.h2.max})` }}
    >
      {title}
    </h2>
  );
}

function MaterializedAction({ action, className }: {
  action: ActionField;
  className?: string;
}) {
  const href = actionHref(action);
  const classes = cn(
    "inline-flex min-h-11 min-w-0 items-center justify-center rounded-lg border-2 border-[var(--lp-primary)] bg-[var(--lp-text)] px-5 py-3 text-sm font-semibold text-[var(--lp-background)] shadow-sm outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2",
    className,
  );
  const label = <span className="break-words">{action.label}</span>;
  return href ? <a href={href} className={classes}>{label}</a> : (
    <span aria-disabled="true" className={cn(classes, "cursor-not-allowed opacity-70")}>{label}</span>
  );
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function actionHref(action: ActionField): string | null {
  const destination = action.binding.destination?.trim();
  if (action.binding.channel === "form") return "#lead-capture";
  if (!destination) return null;
  if (action.binding.channel === "whatsapp") {
    const digits = destination.replace(/\D/g, "");
    return digits.length >= 8 ? `https://wa.me/${digits}` : null;
  }
  if (action.binding.channel === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination) ? `mailto:${destination}` : null;
  }
  if (action.binding.channel === "phone") {
    return /^[+\d()\s-]+$/.test(destination) ? `tel:${destination.replace(/[()\s-]/g, "")}` : null;
  }
  try {
    const url = new URL(destination);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function field(module: MaterializedModule, fieldKey: string) {
  return module.fields.find((candidate) => candidate.fieldKey === fieldKey);
}

function textValue(module: MaterializedModule, fieldKey: string) {
  const value = field(module, fieldKey);
  return value?.kind === "text" ? value.value : "";
}

function collectionField(module: MaterializedModule, fieldKey: string) {
  const value = field(module, fieldKey);
  return value?.kind === "collection" ? value : null;
}

function actionField(module: MaterializedModule, fieldKey: string) {
  const value = field(module, fieldKey);
  return value?.kind === "action" ? value : null;
}

function itemTextValues(fields: readonly CollectionField["items"][number]["fields"][number][]) {
  return fields.flatMap((candidate) => candidate.kind === "text" ? [candidate.value] : []);
}

function formFieldLabel(fieldKey: string) {
  const labels: Record<string, string> = {
    name: "Nome",
    email: "E-mail",
    phone: "Telefone",
    message: "Mensagem",
  };
  return labels[fieldKey] ?? fieldKey.replaceAll("_", " ");
}

export function LandingPagePreviewFrame({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}
