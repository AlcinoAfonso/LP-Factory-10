"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import type { ActionableNicheResolution } from "../../../../lib/onboarding/niche-resolution/contracts";
import {
  confirmOptionNicheResolutionAction,
  confirmSuggestedNicheResolutionAction,
  dismissNicheResolutionAction,
  rewriteNicheResolutionAction,
  type NicheResolutionActionState,
} from "../niche-resolution-actions";

type NicheResolutionCardProps = {
  accountSubdomain: string;
  resolution: ActionableNicheResolution;
};

const INITIAL_STATE: NicheResolutionActionState = { ok: true };

export function NicheResolutionCard({
  accountSubdomain,
  resolution,
}: NicheResolutionCardProps) {
  const [showRewrite, setShowRewrite] = useState(false);
  const [confirmSuggestedState, confirmSuggestedAction, isConfirmingSuggested] = useActionState(
    confirmSuggestedNicheResolutionAction,
    INITIAL_STATE,
  );
  const [confirmOptionState, confirmOptionAction, isConfirmingOption] = useActionState(
    confirmOptionNicheResolutionAction,
    INITIAL_STATE,
  );
  const [rewriteState, rewriteAction, isRewriting] = useActionState(
    rewriteNicheResolutionAction,
    INITIAL_STATE,
  );
  const [dismissState, dismissAction, isDismissing] = useActionState(
    dismissNicheResolutionAction,
    INITIAL_STATE,
  );

  const formError =
    confirmSuggestedState.formError ??
    confirmOptionState.formError ??
    rewriteState.formError ??
    dismissState.formError ??
    null;
  const isPending = isConfirmingSuggested || isConfirmingOption || isRewriting || isDismissing;

  if (resolution.uxMode === "fallback_review") {
    return (
      <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
        <CardHeader>
          <CardTitle>Ainda estamos analisando seu nicho</CardTitle>
          <CardDescription>
            Não encontramos uma categoria oficial segura para classificar automaticamente. Você pode
            continuar usando a conta normalmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
          <form action={dismissAction}>
            <input type="hidden" name="account_subdomain" value={accountSubdomain} />
            <Button type="submit" disabled={isPending}>
              Entendi
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (resolution.uxMode === "choose_from_options") {
    return (
      <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
        <CardHeader>
          <CardTitle>Escolha o nicho mais próximo</CardTitle>
          <CardDescription>Encontramos algumas opções possíveis para personalizar melhor seu dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
          <div className="flex flex-wrap gap-2">
            {resolution.options.map((option) => (
              <form key={option.taxonId} action={confirmOptionAction}>
                <input type="hidden" name="account_subdomain" value={accountSubdomain} />
                <input type="hidden" name="taxon_id" value={option.taxonId} />
                <Button type="submit" disabled={isPending}>
                  {option.name}
                </Button>
              </form>
            ))}
            <Button
              type="button"
              className="bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50"
              disabled={isPending}
              onClick={() => setShowRewrite(true)}
            >
              Outro
            </Button>
          </div>
          {showRewrite ? (
            <RewriteForm
              accountSubdomain={accountSubdomain}
              action={rewriteAction}
              disabled={isPending}
            />
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const suggestedName = resolution.suggestedTaxon?.name ?? "seu nicho";

  return (
    <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
      <CardHeader>
        <CardTitle>Confirme seu nicho</CardTitle>
        <CardDescription>Isso ajuda a personalizar melhor seu dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
        <div className="rounded-lg border border-blue-100 bg-white px-4 py-3">
          <p className="text-sm text-gray-600">Identificamos que seu nicho provavelmente é:</p>
          <p className="mt-1 text-base font-semibold text-gray-950">{suggestedName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={confirmSuggestedAction}>
            <input type="hidden" name="account_subdomain" value={accountSubdomain} />
            <Button type="submit" disabled={isPending}>
              Sim, confirmar
            </Button>
          </form>
          <Button
            type="button"
            className="bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50"
            disabled={isPending}
            onClick={() => setShowRewrite(true)}
          >
            Não é isso
          </Button>
        </div>
        {showRewrite ? (
          <RewriteForm
            accountSubdomain={accountSubdomain}
            action={rewriteAction}
            disabled={isPending}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function RewriteForm({
  accountSubdomain,
  action,
  disabled,
}: {
  accountSubdomain: string;
  action: (payload: FormData) => void;
  disabled: boolean;
}) {
  return (
    <form action={action} className="space-y-3 rounded-lg border bg-white p-4">
      <input type="hidden" name="account_subdomain" value={accountSubdomain} />
      <label htmlFor="rewrite_input" className="text-sm font-medium text-gray-900">
        Qual nicho descreve melhor sua conta?
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="rewrite_input"
          name="rewrite_input"
          maxLength={120}
          required
          disabled={disabled}
          placeholder="Ex.: Clínica de estética para noivas"
          autoComplete="off"
        />
        <Button type="submit" disabled={disabled}>
          Enviar
        </Button>
      </div>
      <p className="text-xs text-gray-500">Use até 120 caracteres. Não vamos chamar a IA novamente.</p>
    </form>
  );
}
