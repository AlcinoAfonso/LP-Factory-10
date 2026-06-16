import type { ContentComposition, ContentTemplate } from "../contracts";
import type { CommercialActivationContentV1 } from "./schemas";

const pageTemplate: ContentTemplate = {
  id: "11111111-1111-4111-8111-111111111111",
  key: "commercial_activation_page",
  slug: "commercial-activation-page",
  name: "Commercial activation page",
  family: "commercial_activation",
  scope: "page",
  status: "active",
  version: 1,
  isActive: true,
  payload: {},
};

function sectionTemplate(key: string, name: string): ContentTemplate {
  return {
    id: sectionTemplateIds[key] ?? "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb0",
    key,
    slug: key.replaceAll("_", "-"),
    name,
    family: "commercial_activation",
    scope: "section",
    status: "active",
    version: 1,
    isActive: true,
    payload: {},
  };
}

const sectionTemplateIds: Record<string, string> = {
  hero: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  benefits: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
  services: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
  plans: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
  differentials: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5",
  how_it_works: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6",
  faq: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7",
  final_cta: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8",
};

export const commercialActivationFixtureComposition: ContentComposition = {
  id: "22222222-2222-4222-8222-222222222222",
  template: pageTemplate,
  taxonId: "33333333-3333-4333-8333-333333333333",
  version: 1,
  status: "active",
  items: [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      module: sectionTemplate("hero", "Hero"),
      variantKey: "hero.default",
      sortOrder: 10,
      isRequired: true,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      module: sectionTemplate("benefits", "Benefits"),
      variantKey: "benefits.cards",
      sortOrder: 20,
      isRequired: true,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
      module: sectionTemplate("services", "Services"),
      variantKey: "services.list",
      sortOrder: 30,
      isRequired: true,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
      module: sectionTemplate("plans", "Plans"),
      variantKey: "plans.cards",
      sortOrder: 40,
      isRequired: true,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
      module: sectionTemplate("differentials", "Differentials"),
      variantKey: "differentials.cards",
      sortOrder: 50,
      isRequired: false,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
      module: sectionTemplate("how_it_works", "How it works"),
      variantKey: "how_it_works.steps",
      sortOrder: 60,
      isRequired: true,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7",
      module: sectionTemplate("faq", "FAQ"),
      variantKey: "faq.accordion",
      sortOrder: 70,
      isRequired: false,
      config: {},
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8",
      module: sectionTemplate("final_cta", "Final CTA"),
      variantKey: "final_cta.simple",
      sortOrder: 80,
      isRequired: true,
      config: {},
    },
  ],
};

export const commercialActivationFixtureContent: CommercialActivationContentV1 = {
  schema_version: 1,
  sections: [
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      content: {
        eyebrow: "Synthetic commercial page",
        title: "A focused page for a specific business audience.",
        description:
          "This fixture validates the renderer contract without reading from Supabase or publishing real niche content.",
        primary_cta: { label: "View plans", href: "/commercial/plans" },
        secondary_cta: { label: "How it works", href: "/commercial/process" },
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      content: {
        eyebrow: "Benefits",
        title: "Clear reasons to continue the conversation",
        items: [
          {
            title: "Audience-specific copy",
            description:
              "The content can explain the offer with language matched to the selected taxon.",
          },
          {
            title: "Reusable structure",
            description:
              "The same renderer can consume different compositions when the registry allows each variant.",
          },
          {
            title: "Server validation",
            description:
              "Invalid required sections stop the artifact before it reaches the UI.",
          },
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
      content: {
        eyebrow: "Services",
        title: "A concise package for the first page",
        items: [
          "Offer positioning",
          "Landing page sections",
          "Plan comparison",
          "Final contact path",
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
      content: {
        eyebrow: "Plans",
        title: "Synthetic plans for layout validation",
        disclaimer:
          "Fixture-only values. They do not represent a public commercial offer.",
        plans: [
          {
            key: "starter",
            name: "Starter",
            price: "R$ 50",
            period: "/mo",
            description: "One essential landing page.",
            features: ["Responsive page", "Primary CTA", "Basic sections"],
            highlighted: false,
            cta: { label: "Choose starter", href: "/commercial/contact" },
          },
          {
            key: "pro",
            name: "Pro",
            price: "R$ 200",
            period: "/mo",
            description: "More sections for a complete commercial story.",
            features: ["Responsive page", "Plan cards", "FAQ", "Final CTA"],
            highlighted: true,
            cta: { label: "Choose pro", href: "/commercial/contact" },
          },
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
      content: {
        eyebrow: "Differentials",
        title: "Controlled flexibility without free-form components",
        items: [
          {
            title: "Closed registry",
            description:
              "Only approved module and variant pairs can be rendered.",
          },
          {
            title: "No raw HTML",
            description:
              "The artifact carries structured content only, not scripts, CSS, or component names.",
          },
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
      content: {
        eyebrow: "How it works",
        title: "From composition to rendered sections",
        steps: [
          {
            label: "01",
            title: "Load composition",
            description: "The server receives ordered items and approved variants.",
          },
          {
            label: "02",
            title: "Validate content",
            description: "Each content block must reference a valid composition item.",
          },
          {
            label: "03",
            title: "Render safely",
            description: "Only registry-approved sections reach the React renderer.",
          },
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7",
      content: {
        eyebrow: "FAQ",
        title: "Renderer contract questions",
        questions: [
          {
            question: "Does this fixture read Supabase data?",
            answer:
              "No. It uses synthetic local data to validate Fase 1 without records or migrations.",
          },
          {
            question: "Can the database choose an arbitrary component?",
            answer:
              "No. The registry only accepts known section and variant pairs.",
          },
        ],
      },
    },
    {
      composition_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8",
      content: {
        title: "Ready for the next validation step",
        description:
          "After this repository-only contract is approved, real base records can be handled in a separate phase.",
        cta: { label: "Continue", href: "/commercial/plans" },
      },
    },
  ],
};
