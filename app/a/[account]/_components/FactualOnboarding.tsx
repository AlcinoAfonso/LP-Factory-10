"use client";

import { useActionState } from "react";
import { saveFactualOnboardingAction, type FactualActionState } from "../factual-actions";
import type { FactualValues } from "../../../../lib/onboarding/factual/policy";

type Props = {
  accountSubdomain: string;
  email: string;
  taxonName: string;
  canEdit: boolean;
  creciApplicable: boolean;
  professionalCredentialApplicable: boolean;
  values: FactualValues;
  isReady: boolean;
};

const initialState: FactualActionState = { status: "idle" };
const inputClass = "mt-2 block min-h-11 w-full rounded-lg border border-graytech-300 bg-white px-3 py-2 text-base text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";

export function FactualOnboarding(props: Props) {
  const [state, action, isPending] = useActionState(saveFactualOnboardingAction, initialState);
  const ready = props.isReady || state.status === "saved";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Após a ativação</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Seus dados essenciais</h1>
        <p className="mt-3 text-sm leading-6 text-graytech-600 sm:text-base">
          Confirme o nome público que será usado pela LP Factory. WhatsApp e credenciais aplicáveis são opcionais.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <ReadOnlyValue label="E-mail da conta" value={props.email} />
          <ReadOnlyValue label="Nicho confirmado" value={props.taxonName} />
        </div>

        {props.canEdit ? (
          <form action={action} className="mt-8 space-y-6" noValidate>
            <input type="hidden" name="account_subdomain" value={props.accountSubdomain} />
            <div>
              <label htmlFor="factual-business-name" className="block text-sm font-semibold text-ink-900">
                Nome público do negócio ou profissional <span aria-hidden="true">*</span>
              </label>
              <input
                id="factual-business-name"
                name="business_display_name"
                type="text"
                autoComplete="organization"
                defaultValue={props.values.businessDisplayName ?? ""}
                maxLength={120}
                required
                aria-required="true"
                aria-invalid={Boolean(state.fieldErrors?.businessDisplayName)}
                aria-describedby={state.fieldErrors?.businessDisplayName ? "factual-business-error" : undefined}
                className={inputClass}
              />
              {state.fieldErrors?.businessDisplayName ? <p id="factual-business-error" className="mt-2 text-sm text-red-700">{state.fieldErrors.businessDisplayName}</p> : null}
            </div>
            <div>
              <label htmlFor="factual-whatsapp" className="block text-sm font-semibold text-ink-900">WhatsApp (opcional)</label>
              <input
                id="factual-whatsapp"
                name="whatsapp"
                type="tel"
                autoComplete="tel"
                defaultValue={props.values.whatsapp ?? ""}
                maxLength={32}
                aria-invalid={Boolean(state.fieldErrors?.whatsapp)}
                aria-describedby={state.fieldErrors?.whatsapp ? "factual-whatsapp-error" : undefined}
                className={inputClass}
              />
              {state.fieldErrors?.whatsapp ? <p id="factual-whatsapp-error" className="mt-2 text-sm text-red-700">{state.fieldErrors.whatsapp}</p> : null}
            </div>
            {props.creciApplicable ? (
              <div>
                <label htmlFor="factual-creci" className="block text-sm font-semibold text-ink-900">Registro CRECI (opcional)</label>
                <input
                  id="factual-creci"
                  name="creci_registration"
                  type="text"
                  defaultValue={props.values.creciRegistration ?? ""}
                  maxLength={80}
                  aria-invalid={Boolean(state.fieldErrors?.creciRegistration)}
                  aria-describedby={state.fieldErrors?.creciRegistration ? "factual-creci-error" : undefined}
                  className={inputClass}
                />
                {state.fieldErrors?.creciRegistration ? <p id="factual-creci-error" className="mt-2 text-sm text-red-700">{state.fieldErrors.creciRegistration}</p> : null}
              </div>
            ) : null}
            {props.professionalCredentialApplicable ? (
              <div>
                <label htmlFor="factual-professional-credential" className="block text-sm font-semibold text-ink-900">Credencial regulatória profissional (opcional)</label>
                <input
                  id="factual-professional-credential"
                  name="professional_regulatory_credential"
                  type="text"
                  defaultValue={props.values.professionalRegulatoryCredential ?? ""}
                  maxLength={120}
                  aria-invalid={Boolean(state.fieldErrors?.professionalRegulatoryCredential)}
                  aria-describedby={state.fieldErrors?.professionalRegulatoryCredential ? "factual-professional-credential-error" : undefined}
                  className={inputClass}
                />
                {state.fieldErrors?.professionalRegulatoryCredential ? <p id="factual-professional-credential-error" className="mt-2 text-sm text-red-700">{state.fieldErrors.professionalRegulatoryCredential}</p> : null}
              </div>
            ) : null}
            {state.formError ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{state.formError}</p> : null}
            <button type="submit" disabled={isPending} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:opacity-60">
              {isPending ? "Salvando…" : "Salvar dados"}
            </button>
            {state.status === "saved" ? <p role="status" className="text-sm font-medium text-green-800">Dados salvos.</p> : null}
          </form>
        ) : (
          <div className="mt-8 space-y-4">
            <ReadOnlyValue label="Nome público" value={props.values.businessDisplayName} />
            <ReadOnlyValue label="WhatsApp" value={props.values.whatsapp} />
            {props.creciApplicable ? <ReadOnlyValue label="Registro CRECI" value={props.values.creciRegistration} /> : null}
            {props.professionalCredentialApplicable ? <ReadOnlyValue label="Credencial regulatória profissional" value={props.values.professionalRegulatoryCredential} /> : null}
            <p className="text-sm text-graytech-600">Seu acesso é somente leitura. Um proprietário, administrador ou editor pode corrigir estes dados.</p>
          </div>
        )}

        <div aria-live="polite" className="mt-8 rounded-xl border border-brand-100 bg-brand-50 px-4 py-4 text-sm leading-6 text-ink-900">
          {ready
            ? "Dados essenciais prontos. A Base de Comunicação estará disponível na próxima etapa."
            : "Para preparar a Base de Comunicação, falta informar o nome público do negócio ou profissional."}
        </div>
      </section>
    </main>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-app px-4 py-3">
      <p className="text-sm font-semibold text-ink-900">{label} <span className="font-normal text-graytech-600">· Somente leitura</span></p>
      <p className="mt-1 break-words text-sm text-graytech-700">{value || "Não informado"}</p>
    </div>
  );
}
