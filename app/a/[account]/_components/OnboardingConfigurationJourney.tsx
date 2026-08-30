"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormFieldError,
  FormFieldHint,
  FormFieldLabel,
} from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type AccountLandingPageOnboardingConfiguration,
  type AccountLandingPageOnboardingFieldState,
  type AccountLandingPageOnboardingStoredValues,
} from "../../../../lib/lp-builder";
import {
  parseLandingPageOfferingScope,
} from "../../../../lib/conversion-content/landing-page/input-catalog";
import { validateStarterColorPalette } from "../../../../lib/lp-builder/onboardingConfiguration";
import { saveOnboardingConfigurationAction } from "../onboarding-configuration-actions";
import { saveLandingPageConfigurationAction } from "../landing-pages/[landingPageId]/configuration-actions";
import {
  initialOnboardingConfigurationActionState,
  type OnboardingConfigurationActionState,
} from "./onboarding-configuration-action-contract";
import {
  deriveOfferingScopeDraft,
  isUnhandledOnboardingActionSuccess,
  journeyConditionMatches,
  journeyScopeBelongsToStep,
  onboardingFieldErrorFocusTargetId,
  type JourneyFormStep,
  parseKeywordMapDraft,
  parseNumberRangeDraft,
  prepareJourneyStoredValues,
  recoverCorrectableOnboardingSubmission,
} from "./onboarding-journey-policy";

const STEPS: readonly Readonly<{
  id: JourneyFormStep;
  title: string;
  description: string;
}>[] = [
  {
    id: "business",
    title: "Seu negócio e sua oferta",
    description: "Confirme os dados que serão reutilizados na sua primeira página.",
  },
  {
    id: "landing_page",
    title: "Objetivo da primeira página",
    description: "Defina a intenção, a origem das visitas e o próximo passo do visitante.",
  },
  {
    id: "brand_identity",
    title: "Identidade visual",
    description: "Escolha uma combinação legível para representar sua marca.",
  },
];

const PALETTE_ROLES = [
  "primary",
  "secondary",
  "accent",
  "background",
  "text",
] as const;

type StarterPalette = Readonly<Record<(typeof PALETTE_ROLES)[number], string>>;

const PALETTE_ROLE_LABELS: Readonly<Record<(typeof PALETTE_ROLES)[number], string>> = {
  primary: "Cor principal",
  secondary: "Cor de apoio",
  accent: "Cor de destaque",
  background: "Fundo",
  text: "Texto",
};

const PALETTE_PRESETS: readonly Readonly<{
  name: string;
  value: StarterPalette;
}>[] = [
  {
    name: "Azul confiança",
    value: {
      primary: "#155eef",
      secondary: "#344054",
      accent: "#b54708",
      background: "#ffffff",
      text: "#101828",
    },
  },
  {
    name: "Verde profissional",
    value: {
      primary: "#087443",
      secondary: "#344054",
      accent: "#a15c00",
      background: "#ffffff",
      text: "#101828",
    },
  },
  {
    name: "Noturno elegante",
    value: {
      primary: "#84adff",
      secondary: "#d0d5dd",
      accent: "#fec84b",
      background: "#101828",
      text: "#f9fafb",
    },
  },
];

const FIELD_LABELS: Readonly<Record<string, string>> = {
  business_display_name: "Nome público do negócio",
  primary_service_or_offer: "Serviço ou oferta principal",
  primary_service_or_offer_description: "Descrição do serviço ou da oferta",
  landing_page_offering_scope: "O que esta landing page vai divulgar?",
  landing_page_offering_scope_description: "Descrição do escopo comercial",
  service_locations: "Regiões atendidas",
  property_types: "Tipos de imóvel",
  property_price_range: "Faixa de preço",
  property_stage: "Estágio dos imóveis",
  transaction_intent: "Intenção comercial",
  business_offerings_summary: "O que seu negócio oferece",
  primary_conversion_goal: "Objetivo principal da página",
  financing_support_available: "Oferece apoio em financiamento?",
  document_support_available: "Oferece orientação documental?",
  creci_registration: "Registro CRECI",
  attendance_modes: "Formas de atendimento",
  funnel_stage: "Momento da decisão do visitante",
  traffic_source: "Origem principal das visitas",
  primary_conversion_channel: "Próximo passo principal",
  whatsapp_destination: "WhatsApp da página",
  phone_destination: "Telefone da página",
  email_destination: "E-mail da página",
  external_url_destination: "Link externo de destino",
  privacy_policy_url: "Política de privacidade",
  paid_search_keyword_map: "Termos de busca e mensagem",
  brand_color_palette: "Paleta da marca",
  brand_logo_asset: "Logo da marca",
};

const OPTION_LABELS: Readonly<Record<string, string>> = {
  bofu: "Pronto para conversar ou comprar",
  mofu: "Comparando alternativas",
  tofu: "Conhecendo o tema",
  paid_search: "Busca paga",
  paid_social: "Redes sociais pagas",
  organic: "Busca ou conteúdo orgânico",
  whatsapp: "WhatsApp",
  qr_code: "QR code",
  other: "Outra origem",
  form: "Formulário",
  phone: "Telefone",
  email: "E-mail",
  external_url: "Link externo",
  contact: "Entrar em contato",
  schedule: "Agendar",
  request_quote: "Solicitar orçamento",
  purchase: "Comprar",
  register_interest: "Demonstrar interesse",
  launch: "Lançamento",
  under_construction: "Em construção",
  ready: "Pronto",
  used: "Usado",
  mixed: "Mais de um estágio",
  buy: "Compra",
  sell: "Venda",
  valuation: "Avaliação",
  rent: "Locação",
  in_person: "Presencial",
  remote: "Remoto",
  single: "Uma oferta",
  multiple: "Algumas ofertas",
  portfolio: "Todo o portfólio",
};

export function OnboardingConfigurationJourney(props: Readonly<{
  accountSubdomain: string;
  configuration: AccountLandingPageOnboardingConfiguration;
  reviewMode?: boolean;
  workspaceMode?: boolean;
  sharedRevision?: number | null;
  landingPageRevision?: number | null;
}>) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [revision, setRevision] = useState<number | null>(
    props.workspaceMode
      ? props.landingPageRevision ?? null
      : props.configuration.revision,
  );
  const [sharedRevision, setSharedRevision] = useState<number | null>(
    props.sharedRevision ?? null,
  );
  const [values, setValues] = useState<AccountLandingPageOnboardingStoredValues>(
    props.configuration.storedValues,
  );
  const [actionState, formAction, pending] = useActionState(
    props.workspaceMode
      ? saveLandingPageConfigurationAction
      : saveOnboardingConfigurationAction,
    initialOnboardingConfigurationActionState,
  );
  const lastHandledSuccess = useRef<OnboardingConfigurationActionState | null>(
    null,
  );
  const previousStepIndex = useRef(stepIndex);
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const formErrorRef = useRef<HTMLDivElement | null>(null);

  const effectiveValues = useMemo(() => {
    const result: Record<string, unknown> = {};
    for (const fieldState of props.configuration.fields) {
      if (fieldState.source === "authoritative") {
        result[fieldState.field.fieldKey] = fieldState.value;
      }
    }
    for (const [fieldKey, stored] of Object.entries(values)) {
      result[fieldKey] = stored.value;
    }
    return result;
  }, [props.configuration.fields, values]);

  const step = STEPS[stepIndex];
  const submittedValues = useMemo(
    () =>
      prepareJourneyStoredValues({
        fields: props.configuration.fields.map((fieldState) => fieldState.field),
        storedValues: values,
        effectiveValues,
      }),
    [effectiveValues, props.configuration.fields, values],
  );
  const visibleFields = props.configuration.fields.filter((fieldState) => {
    if (
      fieldState.field.valueType === "asset_reference" ||
      fieldState.field.valueType === "color_palette"
    ) {
      return false;
    }
    if (!journeyConditionMatches(fieldState.field.applicableWhen, effectiveValues)) {
      return false;
    }
    return journeyScopeBelongsToStep(step.id, fieldState.field.valueScope);
  });
  const logoFieldState = props.configuration.fields.find(
    (fieldState) => fieldState.field.fieldKey === "brand_logo_asset",
  );
  const paletteFieldState = props.configuration.fields.find(
    (fieldState) => fieldState.field.fieldKey === "brand_color_palette",
  );

  useEffect(() => {
    if (
      !isUnhandledOnboardingActionSuccess(
        actionState,
        lastHandledSuccess.current,
      )
    ) {
      return;
    }
    lastHandledSuccess.current = actionState;
    setRevision(actionState.revision);
    if (actionState.sharedRevision !== undefined) {
      setSharedRevision(actionState.sharedRevision);
    }
    if (actionState.intent === "exit") {
      router.push(
        props.workspaceMode ? `/a/${props.accountSubdomain}` : "/a/home",
      );
      return;
    }
    if (actionState.intent === "next") {
      setStepIndex((current) => Math.min(STEPS.length - 1, current + 1));
    }
    if (actionState.intent === "back") {
      setStepIndex((current) => Math.max(0, current - 1));
    }
    router.refresh();
  }, [actionState, props.accountSubdomain, props.workspaceMode, router]);

  useEffect(() => {
    const recovered = recoverCorrectableOnboardingSubmission(actionState);
    if (!recovered) return;
    setValues(recovered.values);
    setRevision(recovered.revision);
    if (props.workspaceMode && recovered.sharedRevision !== undefined) {
      setSharedRevision(recovered.sharedRevision);
    }
  }, [actionState, props.workspaceMode]);

  useEffect(() => {
    const firstFieldKey = Object.keys(actionState.fieldErrors ?? {})[0];
    if (!firstFieldKey) return;
    const frame = requestAnimationFrame(() => {
      document
        .getElementById(onboardingFieldErrorFocusTargetId(firstFieldKey))
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [actionState.fieldErrors]);

  useEffect(() => {
    if (previousStepIndex.current === stepIndex) return;
    previousStepIndex.current = stepIndex;
    stepHeadingRef.current?.focus();
  }, [stepIndex]);

  useEffect(() => {
    if (actionState.formError) formErrorRef.current?.focus();
  }, [actionState.formError]);

  const updateValue = (
    fieldState: AccountLandingPageOnboardingFieldState,
    value: unknown,
  ) => {
    const fieldKey = fieldState.field.fieldKey;
    setValues((current) => {
      if (value === undefined) {
        const next = { ...current };
        delete next[fieldKey];
        return next;
      }
      return {
        ...current,
        [fieldKey]: { scope: fieldState.field.valueScope, value },
      };
    });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
                {props.workspaceMode ? "Configurações da página" : "Primeiros passos"}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                {props.workspaceMode
                  ? "Revise os dados desta landing page"
                  : "Vamos preparar sua primeira landing page"}
              </h1>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800">
              Etapa {stepIndex + 1} de {STEPS.length}
            </span>
          </div>
          {props.reviewMode ? (
            <Link
              href={`/a/${props.accountSubdomain}`}
              className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-ink-900 hover:bg-graytech-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              Voltar à revisão
            </Link>
          ) : null}

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-graytech-100" aria-hidden="true">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width]"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="mt-8">
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-xl font-semibold text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-graytech-600">
              {step.description}
            </p>
          </div>

          <form action={formAction} className="mt-8 space-y-6" noValidate>
            <input type="hidden" name="account_subdomain" value={props.accountSubdomain} />
            <input type="hidden" name="expected_revision" value={revision ?? ""} />
            {props.workspaceMode ? (
              <>
                <input type="hidden" name="landing_page_id" value={props.configuration.landingPageId ?? ""} />
                <input type="hidden" name="expected_shared_revision" value={sharedRevision ?? ""} />
              </>
            ) : null}
            <input type="hidden" name="values_json" value={JSON.stringify(submittedValues)} />
            <input type="hidden" name="intent" value="save" />

            <fieldset disabled={pending} className="min-w-0 space-y-6 border-0 p-0">
              <div className="grid gap-6 sm:grid-cols-2">
                {step.id === "brand_identity" && paletteFieldState ? (
                  <BrandIdentityStep
                    logoFieldState={logoFieldState}
                    paletteFieldState={paletteFieldState}
                    value={effectiveValues.brand_color_palette}
                    error={actionState.fieldErrors?.brand_color_palette}
                    onChange={(value) => updateValue(paletteFieldState, value)}
                  />
                ) : null}
                {visibleFields.map((fieldState) => (
                  <OnboardingField
                    key={fieldState.field.fieldKey}
                    fieldState={fieldState}
                    value={effectiveValues[fieldState.field.fieldKey]}
                    required={isRequired(fieldState, effectiveValues)}
                    error={actionState.fieldErrors?.[fieldState.field.fieldKey]}
                    onChange={(value) => updateValue(fieldState, value)}
                  />
                ))}
              </div>

              {actionState.formError ? (
                <div
                  ref={formErrorRef}
                  tabIndex={-1}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {actionState.formError}
                </div>
              ) : null}
              {props.workspaceMode ? (
                <div className="rounded-lg border border-surface-border bg-graytech-50 p-4 text-sm text-ink-900">
                  <label className="flex items-start gap-3">
                    <input
                      id="onboarding-same_commercial_work_confirmed"
                      type="checkbox"
                      name="same_commercial_work_confirmed"
                      value="1"
                      aria-describedby={
                        actionState.fieldErrors?.same_commercial_work_confirmed
                          ? "onboarding-same_commercial_work_confirmed-error"
                          : undefined
                      }
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      Se eu alterar o modo ou as ofertas deste escopo, confirmo que continua sendo o mesmo trabalho comercial. Caso contrário, criarei uma nova landing page.
                    </span>
                  </label>
                  {actionState.fieldErrors?.same_commercial_work_confirmed ? (
                    <p
                      id="onboarding-same_commercial_work_confirmed-error"
                      className="mt-2 text-sm text-red-700"
                    >
                      {actionState.fieldErrors.same_commercial_work_confirmed}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </fieldset>
            {actionState.status === "success" && actionState.intent === "save" ? (
              <p className="text-sm font-medium text-emerald-700" role="status">
                Progresso salvo. Você pode continuar agora ou voltar depois.
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-surface-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="submit"
                name="intent"
                value="exit"
                disabled={pending}
                className="min-h-11 bg-white text-ink-900 ring-1 ring-surface-border hover:bg-graytech-50"
              >
                Salvar e sair
              </Button>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                {stepIndex > 0 ? (
                  <Button
                    type="submit"
                    name="intent"
                    value="back"
                    disabled={pending}
                    className="min-h-11 bg-white text-ink-900 ring-1 ring-surface-border hover:bg-graytech-50"
                  >
                    Voltar
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  name="intent"
                  value={stepIndex < STEPS.length - 1 ? "next" : "save"}
                  disabled={pending}
                  className="min-h-11"
                >
                  {pending
                    ? "Salvando..."
                    : stepIndex < STEPS.length - 1
                      ? "Avançar e salvar"
                      : "Salvar progresso"}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
            <h2 className="font-semibold text-ink-900">Contexto confirmado</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-graytech-500">Segmento</dt>
                <dd className="font-medium text-ink-900">
                  {formatTaxonChain(props.configuration)}
                </dd>
              </div>
              <div>
                <dt className="text-graytech-500">Plano</dt>
                <dd className="font-medium text-ink-900">Starter</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-graytech-600">
              Esses dados orientam os campos mostrados e não podem ser alterados nesta etapa.
            </p>
          </section>

          <section className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <h2 className="font-semibold text-brand-900">Seu progresso fica salvo</h2>
            <p className="mt-2 text-sm leading-6 text-brand-800">
              {props.workspaceMode
                ? "Salvar configuração não gera conteúdo nem altera revisões históricas. Uma nova revisão exige uma ação explícita."
                : "Você pode sair e continuar depois. Uma página nova só será criada quando toda a revisão estiver concluída."}
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function BrandIdentityStep(props: Readonly<{
  logoFieldState?: AccountLandingPageOnboardingFieldState;
  paletteFieldState: AccountLandingPageOnboardingFieldState;
  value: unknown;
  error?: string;
  onChange: (value: StarterPalette) => void;
}>) {
  const palette = readPalette(props.value);
  const validation = validateStarterColorPalette(props.value);
  const errorId = "onboarding-brand_color_palette-error";
  const hintId = "onboarding-brand_color_palette-hint";

  return (
    <div className="space-y-6 sm:col-span-2">
      <section className="rounded-xl border border-surface-border bg-graytech-50 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-ink-900">Logo da marca</h3>
            <p className="mt-1 text-sm leading-6 text-graytech-600">
              O logo é opcional e não será solicitado nesta primeira versão.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-graytech-700 ring-1 ring-surface-border">
            Opcional
          </span>
        </div>
        <p className="mt-3 text-sm font-medium text-ink-800">
          {props.logoFieldState?.source === "authoritative"
            ? "Uma referência já confirmada será reutilizada automaticamente."
            : "Você pode continuar sem logo."}
        </p>
      </section>

      <fieldset
        className="space-y-5 rounded-xl border border-surface-border p-4 sm:p-5"
        aria-describedby={props.error ? `${hintId} ${errorId}` : hintId}
      >
        <legend className="px-1 text-base font-semibold text-ink-900">
          Paleta da marca <span aria-hidden="true">*</span>
        </legend>
        <p id={hintId} className="text-sm leading-6 text-graytech-600">
          Escolha uma opção e ajuste as cores se quiser. A combinação precisa manter texto e destaques legíveis.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {PALETTE_PRESETS.map((preset) => {
            const selected = palette ? palettesEqual(palette, preset.value) : false;
            return (
              <button
                key={preset.name}
                type="button"
                aria-pressed={selected}
                onClick={() => props.onChange(preset.value)}
                className="min-h-20 rounded-xl border border-surface-border bg-white p-3 text-left shadow-sm transition hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <span className="block text-sm font-semibold text-ink-900">
                  {preset.name}
                </span>
                <span className="mt-3 flex gap-1" aria-hidden="true">
                  {PALETTE_ROLES.map((role) => (
                    <span
                      key={role}
                      className="h-5 flex-1 rounded-sm border border-black/10"
                      style={{ backgroundColor: preset.value[role] }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {palette ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)]">
            <div className="grid gap-4 sm:grid-cols-2">
              {PALETTE_ROLES.map((role) => (
                <FormField key={role}>
                  <FormFieldLabel htmlFor={`onboarding-palette-${role}`}>
                    {PALETTE_ROLE_LABELS[role]}
                  </FormFieldLabel>
                  <div className="flex items-center gap-3">
                    <Input
                      id={`onboarding-palette-${role}`}
                      type="color"
                      value={palette[role]}
                      aria-describedby={hintId}
                      aria-invalid={Boolean(props.error) || !validation.ok}
                      className="h-11 w-16 cursor-pointer p-1"
                      onChange={(event) =>
                        props.onChange({ ...palette, [role]: event.target.value })
                      }
                    />
                    <code className="text-sm font-medium uppercase text-graytech-700">
                      {palette[role]}
                    </code>
                  </div>
                </FormField>
              ))}
            </div>

            <div
              className="overflow-hidden rounded-xl border border-surface-border"
              style={{ backgroundColor: palette.background, color: palette.text }}
            >
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                  Prévia
                </p>
                <h3 className="mt-3 text-xl font-bold">Sua próxima oportunidade começa aqui</h3>
                <p className="mt-2 text-sm opacity-90">
                  Uma amostra simples para conferir leitura, contraste e destaque.
                </p>
                <div className="mt-5 grid gap-3 text-sm font-semibold sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-6 w-10 rounded-md border border-black/10"
                      style={{ backgroundColor: palette.primary }}
                      aria-hidden="true"
                    />
                    Ação principal
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-6 w-10 rounded-md border border-black/10"
                      style={{ backgroundColor: palette.accent }}
                      aria-hidden="true"
                    />
                    Destaque
                  </span>
                </div>
              </div>
              <div className="h-2" style={{ backgroundColor: palette.secondary }} />
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
            Escolha uma combinação para continuar. Depois você poderá editar cada cor.
          </p>
        )}

        {palette && validation.ok ? (
          <p className="text-sm font-medium text-emerald-700" role="status">
            Contraste validado para texto e elementos de destaque.
          </p>
        ) : null}
        {(palette && !validation.ok) || props.error ? (
          <FormFieldError id={errorId}>
            {props.error ??
              "Esta combinação precisa de mais contraste entre fundo, texto e destaques."}
          </FormFieldError>
        ) : null}
      </fieldset>
    </div>
  );
}

function OnboardingField(props: Readonly<{
  fieldState: AccountLandingPageOnboardingFieldState;
  value: unknown;
  required: boolean;
  error?: string;
  onChange: (value: unknown | undefined) => void;
}>) {
  const { field } = props.fieldState;
  const id = `onboarding-${field.fieldKey}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const labelId = `${id}-label`;
  const describedBy = props.error ? `${hintId} ${errorId}` : hintId;
  const isGroupedControl =
    field.valueType === "offering_scope" ||
    (field.valueType === "string_list" &&
      field.validation.kind === "string_list" &&
      Boolean(field.validation.allowedValues));

  if (props.fieldState.source === "authoritative") {
    return (
      <FormField className="sm:col-span-2">
        <FormFieldLabel>{fieldLabel(field.fieldKey)}</FormFieldLabel>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          {formatDisplayValue(props.value)}
        </div>
        <FormFieldHint>Valor já confirmado na conta e reutilizado aqui.</FormFieldHint>
      </FormField>
    );
  }

  return (
    <FormField
      className={
        field.valueType === "string" || field.valueType === "offering_scope"
          ? "sm:col-span-2"
          : undefined
      }
    >
      <FormFieldLabel
        id={labelId}
        {...(isGroupedControl ? {} : { htmlFor: id })}
        required={props.required}
      >
        {fieldLabel(field.fieldKey)}
      </FormFieldLabel>
      <FieldControl
        id={id}
        labelId={labelId}
        describedBy={describedBy}
        fieldState={props.fieldState}
        value={props.value}
        invalid={Boolean(props.error)}
        required={props.required}
        onChange={props.onChange}
      />
      <FormFieldHint id={hintId}>
        {field.purpose} {props.required ? "Obrigatório." : "Opcional."}
      </FormFieldHint>
      {props.error ? (
        <FormFieldError id={errorId}>{props.error}</FormFieldError>
      ) : null}
    </FormField>
  );
}

function FieldControl(props: Readonly<{
  id: string;
  labelId: string;
  describedBy: string;
  fieldState: AccountLandingPageOnboardingFieldState;
  value: unknown;
  invalid: boolean;
  required: boolean;
  onChange: (value: unknown | undefined) => void;
}>) {
  const field = props.fieldState.field;
  const common = {
    id: props.id,
    "aria-describedby": props.describedBy,
    "aria-invalid": props.invalid,
    "aria-required": props.required,
  } as const;

  if (field.valueType === "enum" && field.validation.kind === "enum") {
    return (
      <Select
        {...common}
        className="min-h-11"
        value={typeof props.value === "string" ? props.value : ""}
        onChange={(event) => props.onChange(event.target.value || undefined)}
      >
        <option value="">Selecione</option>
        {field.validation.allowedValues.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </Select>
    );
  }

  if (field.valueType === "boolean") {
    return (
      <Select
        {...common}
        className="min-h-11"
        value={typeof props.value === "boolean" ? String(props.value) : ""}
        onChange={(event) =>
          props.onChange(
            event.target.value === "" ? undefined : event.target.value === "true",
          )
        }
      >
        <option value="">Selecione</option>
        <option value="true">Sim</option>
        <option value="false">Não</option>
      </Select>
    );
  }

  if (field.valueType === "string_list") {
    const listValue = Array.isArray(props.value)
      ? props.value.filter((item): item is string => typeof item === "string").join("\n")
      : "";
    if (field.validation.kind === "string_list" && field.validation.allowedValues) {
      return (
        <fieldset
          className="space-y-2 rounded-lg border border-surface-border p-3"
          id={props.id}
          aria-describedby={props.describedBy}
          data-invalid={props.invalid || undefined}
          tabIndex={-1}
        >
          <legend className="sr-only">{fieldLabel(field.fieldKey)}</legend>
          {field.validation.allowedValues.map((option) => {
            const selected = Array.isArray(props.value) && props.value.includes(option);
            return (
              <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  aria-invalid={props.invalid}
                  aria-required={props.required}
                  checked={selected}
                  onChange={(event) => {
                    const current = Array.isArray(props.value)
                      ? props.value.filter((item): item is string => typeof item === "string")
                      : [];
                    const next = event.target.checked
                      ? [...current, option]
                      : current.filter((item) => item !== option);
                    props.onChange(next.length ? next : undefined);
                  }}
                />
                {optionLabel(option)}
              </label>
            );
          })}
        </fieldset>
      );
    }
    return (
      <Textarea
        {...common}
        className="min-h-28"
        value={listValue}
        placeholder="Um item por linha"
        onChange={(event) => {
          const items = event.target.value
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean);
          props.onChange(items.length ? items : undefined);
        }}
      />
    );
  }

  if (field.valueType === "number_range") {
    return <NumberRangeControl {...props} common={common} />;
  }

  if (field.valueType === "keyword_map") {
    return <KeywordMapControl {...props} common={common} />;
  }

  if (field.valueType === "offering_scope") {
    return <OfferingScopeControl {...props} />;
  }

  const inputType =
    field.valueType === "email"
      ? "email"
      : field.valueType === "url"
        ? "url"
        : field.valueType === "phone"
          ? "tel"
          : "text";
  return (
    <Input
      {...common}
      className="min-h-11"
      type={inputType}
      value={typeof props.value === "string" ? props.value : ""}
      placeholder={field.valueType === "phone" ? "+5511999999999" : undefined}
      onChange={(event) => props.onChange(event.target.value || undefined)}
    />
  );
}

function OfferingScopeControl(props: Readonly<{
  id: string;
  labelId: string;
  describedBy: string;
  value: unknown;
  invalid: boolean;
  required: boolean;
  onChange: (value: unknown | undefined) => void;
}>) {
  const raw = isRecord(props.value) ? props.value : {};
  const representsPortfolio = raw.mode === "portfolio";
  const offeringItems = Array.isArray(raw.offerings)
    ? raw.offerings.filter((item): item is string => typeof item === "string")
    : [];
  const offerings = offeringItems.join("\n");

  return (
    <fieldset
      id={props.id}
      aria-labelledby={props.labelId}
      aria-describedby={props.describedBy}
      aria-invalid={props.invalid}
      className="space-y-4 rounded-lg border border-surface-border p-4 sm:col-span-2"
    >
      <legend className="sr-only">Escopo comercial da página</legend>
      <div>
        <label htmlFor={`${props.id}-offerings`} className="text-sm font-medium text-ink-900">
          Ofertas incluídas
        </label>
        <Textarea
          id={`${props.id}-offerings`}
          className="mt-2 min-h-28"
          value={offerings}
          aria-describedby={props.describedBy}
          aria-invalid={props.invalid}
          aria-required={props.required}
          placeholder="Uma oferta por linha"
          onChange={(event) => props.onChange(
            deriveOfferingScopeDraft(event.target.value, representsPortfolio),
          )}
        />
        <p className="mt-2 text-xs leading-5 text-graytech-600">
          Entrada livre: não usamos catálogo, whitelist nem derivação do resumo do negócio.
        </p>
      </div>
      <div>
        <label
          htmlFor={`${props.id}-portfolio`}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-surface-border px-3 py-2 text-sm font-medium text-ink-900 focus-within:ring-2 focus-within:ring-brand-600"
        >
          <input
            id={`${props.id}-portfolio`}
            type="checkbox"
            checked={representsPortfolio}
            aria-describedby={`${props.id}-portfolio-hint`}
            className="h-4 w-4 shrink-0"
            onChange={(event) => props.onChange(
              deriveOfferingScopeDraft(offerings, event.target.checked),
            )}
          />
          Esta lista representa todo o portfólio que quero divulgar nesta landing page
        </label>
        <p id={`${props.id}-portfolio-hint`} className="mt-2 text-xs leading-5 text-graytech-600">
          Marque somente se a lista acima representar todo o portfólio abrangido por esta página.
        </p>
      </div>
    </fieldset>
  );
}

function isRequired(
  fieldState: AccountLandingPageOnboardingFieldState,
  values: Readonly<Record<string, unknown>>,
) {
  const field = fieldState.field;
  if (!journeyConditionMatches(field.applicableWhen, values)) return false;
  if (field.obligation === "required") return true;
  return (
    field.obligation === "conditional" &&
    journeyConditionMatches(field.requiredWhen, values)
  );
}

export function fieldLabel(fieldKey: string) {
  return FIELD_LABELS[fieldKey] ?? humanizeFieldKey(fieldKey);
}

function humanizeFieldKey(fieldKey: string) {
  const words = fieldKey
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .trim();
  if (!words) return "Informação para a página";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function optionLabel(option: string) {
  return OPTION_LABELS[option] ?? option.replaceAll("_", " ");
}

export function formatDisplayValue(value: unknown) {
  if (typeof value === "string") return OPTION_LABELS[value] ?? value;
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return OPTION_LABELS[item] ?? item;
        if (!isRecord(item)) return null;
        const keyword =
          typeof item.keyword_or_cluster === "string"
            ? item.keyword_or_cluster
            : null;
        const anchor =
          typeof item.message_anchor === "string" ? item.message_anchor : null;
        return [keyword, anchor].filter(Boolean).join(" — ") || null;
      })
      .filter(Boolean)
      .join(", ");
  }
  if (isRecord(value)) {
    const offeringScope = parseLandingPageOfferingScope(value);
    if (offeringScope.ok) {
      return `${optionLabel(offeringScope.value.mode)}: ${offeringScope.value.offerings.join(", ")}`;
    }
    if (
      typeof value.minimum === "number" ||
      typeof value.maximum === "number"
    ) {
      const minimum =
        typeof value.minimum === "number" ? formatCurrency(value.minimum) : "sem mínimo";
      const maximum =
        typeof value.maximum === "number" ? formatCurrency(value.maximum) : "sem máximo";
      return `${minimum} a ${maximum}`;
    }
    const palette = readPalette(value);
    if (palette) {
      return PALETTE_ROLES.map(
        (role) => `${PALETTE_ROLE_LABELS[role]} ${palette[role].toUpperCase()}`,
      ).join(", ");
    }
  }
  return "Valor confirmado";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTaxonChain(configuration: AccountLandingPageOnboardingConfiguration) {
  return [
    configuration.taxonChain.segment.name,
    configuration.taxonChain.niche?.name,
    configuration.taxonChain.ultraNiche?.name,
  ]
    .filter(Boolean)
    .join(" › ");
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPalette(value: unknown): StarterPalette | null {
  if (!isRecord(value)) return null;
  if (
    !PALETTE_ROLES.every(
      (role) => typeof value[role] === "string" && /^#[0-9a-f]{6}$/i.test(value[role]),
    )
  ) {
    return null;
  }
  return Object.fromEntries(
    PALETTE_ROLES.map((role) => [role, String(value[role]).toLowerCase()]),
  ) as StarterPalette;
}

function palettesEqual(first: StarterPalette, second: StarterPalette) {
  return PALETTE_ROLES.every(
    (role) => first[role].toLowerCase() === second[role].toLowerCase(),
  );
}

type SpecializedControlProps = Readonly<{
  id: string;
  describedBy: string;
  fieldState: AccountLandingPageOnboardingFieldState;
  value: unknown;
  invalid: boolean;
  required: boolean;
  onChange: (value: unknown | undefined) => void;
  common: Readonly<{
    id: string;
    "aria-describedby": string;
    "aria-invalid": boolean;
    "aria-required": boolean;
  }>;
}>;

function KeywordMapControl(props: SpecializedControlProps) {
  const [draft, setDraft] = useState(() => formatKeywordMapDraft(props.value));
  return (
    <Textarea
      {...props.common}
      className="min-h-28"
      value={draft}
      placeholder="termo de busca | mensagem principal | contexto opcional"
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);
        props.onChange(parseKeywordMapDraft(nextDraft));
      }}
    />
  );
}

function NumberRangeControl(props: SpecializedControlProps) {
  const initial = isRecord(props.value) ? props.value : {};
  const [minimum, setMinimum] = useState(() =>
    typeof initial.minimum === "number" ? String(initial.minimum) : "",
  );
  const [maximum, setMaximum] = useState(() =>
    typeof initial.maximum === "number" ? String(initial.maximum) : "",
  );
  const update = (nextMinimum: string, nextMaximum: string) => {
    props.onChange(parseNumberRangeDraft(nextMinimum, nextMaximum));
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        {...props.common}
        className="min-h-11"
        inputMode="decimal"
        type="number"
        min={0}
        placeholder="Mínimo"
        value={minimum}
        onChange={(event) => {
          setMinimum(event.target.value);
          update(event.target.value, maximum);
        }}
      />
      <Input
        aria-label={`${fieldLabel(props.fieldState.field.fieldKey)} máxima`}
        aria-describedby={props.describedBy}
        aria-invalid={props.invalid}
        aria-required={props.required}
        className="min-h-11"
        inputMode="decimal"
        type="number"
        min={0}
        placeholder="Máximo"
        value={maximum}
        onChange={(event) => {
          setMaximum(event.target.value);
          update(minimum, event.target.value);
        }}
      />
    </div>
  );
}

function formatKeywordMapDraft(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter(isRecord)
        .map((item) =>
          [item.keyword_or_cluster, item.message_anchor, item.ad_context]
            .map((part) => (typeof part === "string" ? part : ""))
            .join(" | ")
            .replace(/(?: \| )+$/, ""),
        )
        .join("\n")
    : "";
}
