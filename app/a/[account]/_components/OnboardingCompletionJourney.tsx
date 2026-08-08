"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormFieldHint,
  FormFieldLabel,
} from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type {
  AccountLandingPage,
  AccountLandingPageOnboardingConfiguration,
} from "../../../../lib/lp-builder";
import { completeOnboardingConfigurationAction } from "../onboarding-configuration-actions";
import { initialOnboardingCompletionActionState } from "./onboarding-configuration-action-contract";
import {
  fieldLabel,
  formatDisplayValue,
} from "./OnboardingConfigurationJourney";

export function OnboardingCompletionJourney(props: Readonly<{
  accountSubdomain: string;
  configuration: AccountLandingPageOnboardingConfiguration;
  drafts: readonly AccountLandingPage[];
}>) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    completeOnboardingConfigurationAction,
    initialOnboardingCompletionActionState,
  );
  const errorRef = useRef<HTMLDivElement | null>(null);
  const confirmedFields = props.configuration.fields.filter(
    (fieldState) =>
      fieldState.applicable &&
      fieldState.source !== "missing" &&
      fieldState.field.fieldKey !== "brand_logo_asset",
  );
  const optionalPending = props.configuration.fields.filter(
    (fieldState) =>
      fieldState.applicable &&
      !fieldState.required &&
      fieldState.source === "missing",
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  useEffect(() => {
    if (state.formError) errorRef.current?.focus();
  }, [state.formError]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            Revisão final
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Confirme a configuração e escolha sua primeira página
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-graytech-600 sm:text-base">
            Seus dados obrigatórios estão completos. Agora escolha um rascunho existente ou crie o primeiro, sem gerar ou publicar conteúdo nesta etapa.
          </p>
          <Link
            href={`/a/${props.accountSubdomain}?edit_onboarding=1`}
            className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-ink-900 hover:bg-graytech-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            Editar dados confirmados ou opcionais
          </Link>

          <section className="mt-8" aria-labelledby="confirmed-values-heading">
            <h2 id="confirmed-values-heading" className="text-lg font-semibold text-ink-900">
              Dados confirmados
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {confirmedFields.map((fieldState) => (
                <div
                  key={fieldState.field.fieldKey}
                  className="rounded-xl border border-surface-border bg-graytech-50 p-4"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-graytech-500">
                    {fieldLabel(fieldState.field.fieldKey)}
                  </dt>
                  <dd className="mt-2 break-words text-sm font-medium text-ink-900">
                    {formatDisplayValue(fieldState.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <form action={formAction} className="mt-8 space-y-6">
            <input type="hidden" name="account_subdomain" value={props.accountSubdomain} />
            <input type="hidden" name="expected_revision" value={props.configuration.revision} />

            {props.drafts.length === 0 ? (
              <fieldset className="space-y-5 rounded-xl border border-surface-border p-4 sm:p-5">
                <legend className="px-1 text-lg font-semibold text-ink-900">
                  Criar o primeiro rascunho
                </legend>
                <p className="text-sm leading-6 text-graytech-600">
                  Nenhum rascunho foi encontrado. A nova página será criada vazia e permanecerá como rascunho.
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField>
                    <FormFieldLabel htmlFor="landing-page-name" required>
                      Nome da página
                    </FormFieldLabel>
                    <Input
                      id="landing-page-name"
                      name="landing_page_name"
                      required
                      maxLength={120}
                      className="min-h-11"
                    />
                    <FormFieldHint>Um nome interno para reconhecer este rascunho.</FormFieldHint>
                  </FormField>
                  <FormField>
                    <FormFieldLabel htmlFor="landing-page-slug" required>
                      Endereço curto
                    </FormFieldLabel>
                    <Input
                      id="landing-page-slug"
                      name="landing_page_slug"
                      required
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      placeholder="minha-primeira-pagina"
                      className="min-h-11"
                    />
                    <FormFieldHint>Use letras minúsculas, números e hífens.</FormFieldHint>
                  </FormField>
                </div>
                <Button
                  type="submit"
                  name="completion_intent"
                  value="create"
                  disabled={pending}
                  className="min-h-11"
                >
                  {pending ? "Criando rascunho..." : "Criar e continuar"}
                </Button>
              </fieldset>
            ) : (
              <fieldset className="space-y-4 rounded-xl border border-surface-border p-4 sm:p-5">
                <legend className="px-1 text-lg font-semibold text-ink-900">
                  Escolher um rascunho existente
                </legend>
                <p className="text-sm leading-6 text-graytech-600">
                  Selecione explicitamente a página que receberá este vínculo. Nenhum novo rascunho será criado.
                </p>
                <div className="space-y-3">
                  {props.drafts.map((draft) => (
                    <label
                      key={draft.id}
                      className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-surface-border p-4 hover:border-brand-300"
                    >
                      <input
                        type="radio"
                        name="landing_page_id"
                        value={draft.id}
                        required
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold text-ink-900">{draft.name}</span>
                        <span className="mt-1 block text-sm text-graytech-600">/{draft.slug}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <Button
                  type="submit"
                  name="completion_intent"
                  value="select"
                  disabled={pending}
                  className="min-h-11"
                >
                  {pending ? "Vinculando rascunho..." : "Continuar com o rascunho escolhido"}
                </Button>
              </fieldset>
            )}

            {state.formError ? (
              <div
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {state.formError}
              </div>
            ) : null}
          </form>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="font-semibold text-emerald-950">Configuração completa</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              A conclusão é derivada dos dados obrigatórios; nenhum status paralelo de onboarding foi criado.
            </p>
          </section>
          <section className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
            <h2 className="font-semibold text-ink-900">Itens opcionais</h2>
            {optionalPending.length > 0 ? (
              <>
                <p className="mt-2 text-sm leading-6 text-graytech-600">
                  Estes itens podem permanecer em branco ou ser preenchidos agora pela ação de editar dados:
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-graytech-700">
                  {optionalPending.map((fieldState) => (
                    <li key={fieldState.field.fieldKey}>
                      {fieldLabel(fieldState.field.fieldKey)}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm leading-6 text-graytech-600">
                Nenhuma pendência opcional foi identificada nesta configuração.
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
