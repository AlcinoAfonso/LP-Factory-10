"use client";

import { useRouter } from "next/navigation";
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
import type {
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingFieldState,
  AccountLandingPageOnboardingStoredValues,
} from "../../../../lib/lp-builder";
import { saveOnboardingConfigurationAction } from "../onboarding-configuration-actions";
import { initialOnboardingConfigurationActionState } from "./onboarding-configuration-action-contract";
import {
  journeyConditionMatches,
  parseKeywordMapDraft,
  parseNumberRangeDraft,
  prepareJourneyStoredValues,
} from "./onboarding-journey-policy";

type JourneyStep = "business" | "landing_page";

const STEPS: readonly Readonly<{
  id: JourneyStep;
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
];

const FIELD_LABELS: Readonly<Record<string, string>> = {
  business_display_name: "Nome público do negócio",
  primary_service_or_offer: "Serviço ou oferta principal",
  primary_service_or_offer_description: "Descrição do serviço ou da oferta",
  service_locations: "Regiões atendidas",
  property_types: "Tipos de imóvel",
  property_price_range: "Faixa de preço",
  property_stage: "Estágio dos imóveis",
  transaction_intent: "Intenção comercial",
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
  launch: "Lançamento",
  under_construction: "Em construção",
  ready: "Pronto",
  used: "Usado",
  mixed: "Mais de um estágio",
  buy: "Compra",
  sell: "Venda",
  valuation: "Avaliação",
  in_person: "Presencial",
  remote: "Remoto",
};

export function OnboardingConfigurationJourney(props: Readonly<{
  accountSubdomain: string;
  configuration: AccountLandingPageOnboardingConfiguration;
}>) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [revision, setRevision] = useState(props.configuration.revision);
  const [values, setValues] = useState<AccountLandingPageOnboardingStoredValues>(
    props.configuration.storedValues,
  );
  const [actionState, formAction, pending] = useActionState(
    saveOnboardingConfigurationAction,
    initialOnboardingConfigurationActionState,
  );
  const lastHandledRevision = useRef<number | null>(null);
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
    return step.id === "business"
      ? ["account", "business", "offer"].includes(fieldState.field.valueScope)
      : ["campaign", "landing_page"].includes(fieldState.field.valueScope);
  });

  useEffect(() => {
    if (
      actionState.status !== "success" ||
      actionState.revision === undefined ||
      lastHandledRevision.current === actionState.revision
    ) {
      return;
    }
    lastHandledRevision.current = actionState.revision;
    setRevision(actionState.revision);
    if (actionState.intent === "exit") {
      router.push("/a/home");
      return;
    }
    if (actionState.intent === "next") {
      setStepIndex((current) => Math.min(STEPS.length - 1, current + 1));
    }
    if (actionState.intent === "back") {
      setStepIndex((current) => Math.max(0, current - 1));
    }
    router.refresh();
  }, [actionState, router]);

  useEffect(() => {
    const firstFieldKey = Object.keys(actionState.fieldErrors ?? {})[0];
    if (!firstFieldKey) return;
    document.getElementById(`onboarding-${firstFieldKey}`)?.focus();
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
                Primeiros passos
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                Vamos preparar sua primeira landing page
              </h1>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800">
              Etapa {stepIndex + 1} de {STEPS.length}
            </span>
          </div>

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
            <input type="hidden" name="catalog_version" value={props.configuration.catalogVersion} />
            <input type="hidden" name="expected_revision" value={revision} />
            <input type="hidden" name="values_json" value={JSON.stringify(submittedValues)} />
            <input type="hidden" name="intent" value="save" />

            <div className="grid gap-6 sm:grid-cols-2">
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
              Você pode sair e continuar depois. Uma página nova só será criada quando toda a revisão estiver concluída.
            </p>
          </section>
        </aside>
      </div>
    </main>
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
  const isCheckboxGroup =
    field.valueType === "string_list" &&
    field.validation.kind === "string_list" &&
    Boolean(field.validation.allowedValues);

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
    <FormField className={field.valueType === "string" ? "sm:col-span-2" : undefined}>
      <FormFieldLabel
        id={labelId}
        {...(isCheckboxGroup ? {} : { htmlFor: id })}
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

function fieldLabel(fieldKey: string) {
  return FIELD_LABELS[fieldKey] ?? "Informação para a página";
}

function optionLabel(option: string) {
  return OPTION_LABELS[option] ?? option.replaceAll("_", " ");
}

function formatDisplayValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.join(", ");
  return "Valor confirmado";
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
