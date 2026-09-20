"use client";

import { useActionState, useEffect, useRef, useState, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField, FormFieldLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionableNicheResolution } from "../../../../lib/onboarding/niche-resolution/contracts";
import type {
  PendingSetupBusinessSnapshot,
  PendingSetupConversationTurn,
} from "../../../../lib/onboarding/pending-setup/contracts";
import {
  continuePendingSetupConversationAction,
  type PendingSetupConversationState,
} from "../pending-setup-actions";

export function PendingSetupConversation({
  accountSubdomain,
  business,
  history,
  preferredName,
}: {
  accountSubdomain: string;
  business: PendingSetupBusinessSnapshot | null;
  history: PendingSetupConversationTurn[];
  preferredName: string | null;
}) {
  const initialState: PendingSetupConversationState = preferredName
    ? {
        ok: true,
        preferredName,
        business: business ?? { kind: "awaiting_business" },
        history,
      }
    : { ok: false };
  const [state, action, pending] = useActionState(
    continuePendingSetupConversationAction,
    initialState,
  );
  const nameRef = useRef<HTMLInputElement>(null);
  const businessRef = useRef<HTMLTextAreaElement>(null);
  const resolvedName = state.preferredName ?? preferredName;
  const resolvedBusiness = state.business ?? business ?? { kind: "awaiting_business" as const };
  const resolvedHistory = state.history ?? history;

  useEffect(() => {
    if (!state.error) return;
    if (resolvedName) businessRef.current?.focus();
    else nameRef.current?.focus();
  }, [resolvedName, state.error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-10 sm:px-6">
      <section
        aria-labelledby="pending-setup-title"
        className="w-full rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-10"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          Boas-vindas
        </p>
        <h1
          className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
          id="pending-setup-title"
        >
          {heading(resolvedName, resolvedBusiness)}
        </h1>
        <p className="mt-3 text-sm leading-6 text-graytech-600 sm:text-base">
          {resolvedName
            ? "Vamos entender seu negócio com uma pergunta de cada vez."
            : "Vamos começar por você. O nome fica ligado à sua identidade e pode ser reutilizado nas próximas conversas."}
        </p>

        {resolvedHistory.length > 0 ? (
          <ConversationHistory turns={resolvedHistory} />
        ) : null}

        {state.error ? (
          <FeedbackMessage className="mt-6" tone="error">
            {state.error}
          </FeedbackMessage>
        ) : null}

        {!resolvedName ? (
          <form action={action} className="mt-6 space-y-5">
            <ConversationIntent
              accountSubdomain={accountSubdomain}
              intent="save_name"
            />
            <FormField>
              <FormFieldLabel htmlFor="preferred_name">Seu nome</FormFieldLabel>
              <Input
                aria-invalid={Boolean(state.error)}
                autoComplete="name"
                id="preferred_name"
                maxLength={80}
                name="preferred_name"
                ref={nameRef}
                required
              />
            </FormField>
            <Button disabled={pending} type="submit">
              {pending ? "Salvando..." : "Continuar"}
            </Button>
          </form>
        ) : (
          <BusinessStep
            key={businessSnapshotKey(resolvedBusiness)}
            accountSubdomain={accountSubdomain}
            action={action}
            business={resolvedBusiness}
            businessRef={businessRef}
            pending={pending}
          />
        )}
      </section>
    </main>
  );
}

function BusinessStep({
  accountSubdomain,
  action,
  business,
  businessRef,
  pending,
}: {
  accountSubdomain: string;
  action: (payload: FormData) => void;
  business: PendingSetupBusinessSnapshot;
  businessRef: RefObject<HTMLTextAreaElement | null>;
  pending: boolean;
}) {
  const [showClarification, setShowClarification] = useState(false);

  useEffect(() => {
    if (showClarification) businessRef.current?.focus();
  }, [businessRef, showClarification]);

  if (business.kind === "awaiting_business") {
    return (
      <BusinessDescriptionForm
        accountSubdomain={accountSubdomain}
        action={action}
        businessRef={businessRef}
        disabled={pending}
        label="O que seu negócio vende ou qual serviço presta?"
        turnKind="initial"
      />
    );
  }

  if (business.kind === "ready_official") {
    return (
      <FeedbackMessage className="mt-6" tone="success">
        Entendimento confirmado: {business.taxonName}. A passagem para a experiência comercial será concluída na etapa final.
      </FeedbackMessage>
    );
  }

  if (business.kind === "ready_fallback") {
    return (
      <FeedbackMessage className="mt-6" tone="success">
        Entendimento salvo como “{business.description}”, sem criar uma categoria oficial. A passagem para a experiência comercial será concluída na etapa final.
      </FeedbackMessage>
    );
  }

  const { resolution } = business;
  if (resolution.uxMode === "fallback_review") {
    return (
      <div className="mt-6 space-y-5">
        <p className="text-sm leading-6 text-graytech-700">
          Ainda não encontrei uma categoria oficial segura. Você pode detalhar um pouco mais ou seguir com sua descrição atual.
        </p>
        <BusinessDescriptionForm
          accountSubdomain={accountSubdomain}
          action={action}
          businessRef={businessRef}
          disabled={pending}
          label="Que detalhe ajudaria a entender melhor seu negócio?"
          turnKind="clarification"
        />
        <FallbackConfirmationForm
          accountSubdomain={accountSubdomain}
          action={action}
          disabled={pending}
          rawInput={resolution.rawInput}
        />
      </div>
    );
  }

  if (showClarification) {
    return (
      <BusinessDescriptionForm
        accountSubdomain={accountSubdomain}
        action={action}
        businessRef={businessRef}
        disabled={pending}
        label="O que diferencia melhor seu negócio dessas opções?"
        turnKind="clarification"
      />
    );
  }

  const options = resolution.uxMode === "confirm_single"
    ? resolution.suggestedTaxon ? [resolution.suggestedTaxon] : []
    : resolution.options;

  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm leading-6 text-graytech-700">
        {resolution.uxMode === "confirm_single"
          ? "Esta opção representa seu negócio?"
          : "Qual destas opções representa melhor seu negócio?"}
      </p>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <ResolutionOptionForm
            key={option.taxonId ?? option.name}
            accountSubdomain={accountSubdomain}
            action={action}
            disabled={pending}
            option={option}
          />
        ))}
        <Button
          className="bg-white text-ink-900 ring-1 ring-surface-border hover:bg-graytech-50"
          disabled={pending}
          onClick={() => setShowClarification(true)}
          type="button"
        >
          Nenhuma dessas
        </Button>
      </div>
    </div>
  );
}

function BusinessDescriptionForm({
  accountSubdomain,
  action,
  businessRef,
  disabled,
  label,
  turnKind,
}: {
  accountSubdomain: string;
  action: (payload: FormData) => void;
  businessRef: RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
  label: string;
  turnKind: "initial" | "clarification";
}) {
  const [turnId] = useState(() => crypto.randomUUID());

  return (
    <form action={action} className="mt-6 space-y-4">
      <ConversationIntent
        accountSubdomain={accountSubdomain}
        intent="describe_business"
      />
      <input name="turn_id" type="hidden" value={turnId} />
      <input name="business_turn_kind" type="hidden" value={turnKind} />
      <FormField>
        <FormFieldLabel htmlFor="business_description">{label}</FormFieldLabel>
        <Textarea
          disabled={disabled}
          id="business_description"
          maxLength={500}
          name="business_description"
          ref={businessRef}
          required
          rows={4}
        />
      </FormField>
      <Button disabled={disabled} type="submit">
        {disabled ? "Analisando..." : "Continuar"}
      </Button>
    </form>
  );
}

function ResolutionOptionForm({
  accountSubdomain,
  action,
  disabled,
  option,
}: {
  accountSubdomain: string;
  action: (payload: FormData) => void;
  disabled: boolean;
  option: ActionableNicheResolution["options"][number];
}) {
  const [turnId] = useState(() => crypto.randomUUID());

  return (
    <form action={action}>
      <ConversationIntent
        accountSubdomain={accountSubdomain}
        intent="confirm_option"
      />
      <input name="turn_id" type="hidden" value={turnId} />
      {option.isOfficial && option.taxonId ? (
        <input name="taxon_id" type="hidden" value={option.taxonId} />
      ) : (
        <input name="option_name" type="hidden" value={option.name} />
      )}
      <Button disabled={disabled} type="submit">
        {option.name}
      </Button>
    </form>
  );
}

function FallbackConfirmationForm({
  accountSubdomain,
  action,
  disabled,
  rawInput,
}: {
  accountSubdomain: string;
  action: (payload: FormData) => void;
  disabled: boolean;
  rawInput: string;
}) {
  const [turnId] = useState(() => crypto.randomUUID());

  return (
    <form action={action}>
      <ConversationIntent
        accountSubdomain={accountSubdomain}
        intent="confirm_fallback"
      />
      <input name="turn_id" type="hidden" value={turnId} />
      <Button
        className="bg-white text-ink-900 ring-1 ring-surface-border hover:bg-graytech-50"
        disabled={disabled}
        type="submit"
      >
        Seguir com “{rawInput}”
      </Button>
    </form>
  );
}

function ConversationHistory({ turns }: { turns: PendingSetupConversationTurn[] }) {
  return (
    <ol aria-label="Histórico da conversa" className="mt-6 space-y-4">
      {turns.map((turn) => (
        <li className="space-y-2" key={turn.id}>
          <div className="ml-auto max-w-[88%] rounded-xl bg-brand-50 px-4 py-3 text-sm leading-6 text-ink-900">
            <span className="sr-only">Você: </span>
            {turn.userMessage}
          </div>
          <div className="max-w-[88%] rounded-xl bg-graytech-50 px-4 py-3 text-sm leading-6 text-graytech-700">
            <span className="sr-only">LP Factory: </span>
            {turn.productMessage ?? "Turno salvo. Continue para concluir."}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ConversationIntent({
  accountSubdomain,
  intent,
}: {
  accountSubdomain: string;
  intent: "save_name" | "describe_business" | "confirm_option" | "confirm_fallback";
}) {
  return (
    <>
      <input name="account_subdomain" type="hidden" value={accountSubdomain} />
      <input name="intent" type="hidden" value={intent} />
    </>
  );
}

function heading(
  preferredName: string | null | undefined,
  business: PendingSetupBusinessSnapshot,
): string {
  if (!preferredName) return "Como você prefere ser chamado?";
  if (business.kind === "ready_official" || business.kind === "ready_fallback") {
    return `Entendi, ${preferredName}.`;
  }
  return `Olá, ${preferredName}.`;
}

function businessSnapshotKey(business: PendingSetupBusinessSnapshot): string {
  if (business.kind === "awaiting_confirmation") {
    return `${business.kind}:${business.resolution.rawInput}`;
  }
  if (business.kind === "ready_official") {
    return `${business.kind}:${business.rawInput}:${business.taxonName}`;
  }
  if (business.kind === "ready_fallback") return `${business.kind}:${business.description}`;
  return business.kind;
}
