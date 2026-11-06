"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField, FormFieldLabel } from "@/components/ui/form-field";
import type { ActionableNicheResolution } from "../../../../lib/onboarding/niche-resolution/contracts";
import {
  confirmOptionNicheResolutionAction,
  confirmSuggestedNicheResolutionAction,
  rewriteNicheResolutionAction,
  type NicheResolutionActionState,
  type AccountNicheEditorState,
  searchAccountNicheAction,
  saveAccountNicheAction,
} from "../niche-resolution-actions";

export function AccountNicheEditor({ account, state, hasIntelligence = false }: Readonly<{
  account: string; state: AccountNicheEditorState; hasIntelligence?: boolean;
}>) {
  const id = useId();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const discard = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const expected = useRef<string | null>(null);
  const searchRevision = useRef(0);
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [candidates, setCandidates] = useState<readonly { taxonId: string; name: string; parentName: string | null }[]>([]);
  const [selected, setSelected] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<"search" | "save" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = Boolean(selected && (selected !== expected.current || confirmed));
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (dialog.current?.open && (dirty || pending === "save")) { event.preventDefault(); event.returnValue = ""; }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, pending]);
  if (!state.ok) return <FeedbackMessage tone="error">{state.message}</FeedbackMessage>;
  if (!state.canEdit) return null;
  const taxon = state.taxon;
  const label = !taxon ? "Definir nicho" : !taxon.confirmed ? "Confirmar nicho" : "Redefinir nicho";
  const chosen = candidates.find(candidate => candidate.taxonId === selected);
  const changed = selected !== taxon?.taxonId;
  function close() { searchRevision.current += 1; setPending(null); discard.current?.close(); dialog.current?.close(); trigger.current?.focus(); }
  function requestClose() {
    if (pending === "save") return;
    if (dirty) { if (!discard.current?.open) discard.current?.showModal(); } else close();
  }
  return <div className="text-sm">
    {taxon?.confirmed && state.hasProducts ? <p className="text-xs text-muted-foreground">A redefinição não está disponível porque esta conta já possui produto desenvolvido.</p> : <Button
      ref={trigger} variant="secondary" className="min-h-11 px-0 underline underline-offset-4" onClick={() => {
        expected.current = taxon?.taxonId ?? null;
        setQuery(""); setSearchedQuery(""); setCandidates(taxon ? [{ ...taxon, parentName: null }] : []);
        setSelected(taxon?.taxonId ?? ""); setConfirmed(false); setError("");
        dialog.current?.showModal();
      }}>{label}</Button>}
    {notice ? <FeedbackMessage tone="success">{notice}</FeedbackMessage> : null}
    <dialog ref={dialog} aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); requestClose(); }}
      onClick={event => { if (event.target === event.currentTarget) requestClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-4 text-foreground shadow-xl backdrop:bg-black/40">
      <h2 id={`${id}-title`} className="text-lg font-semibold">{label}</h2>
      {taxon ? <p className="mt-2 break-words text-sm">Nicho atual: <strong>{taxon.name}</strong></p> : null}
      {taxon && state.hasProducts ? <p className="mt-2 text-sm text-muted-foreground">Você pode confirmar o nicho atual. A redefinição não está disponível porque esta conta já possui produto desenvolvido.</p> : null}
      {!(taxon && state.hasProducts) ? <form className="mt-3 flex items-end gap-2" onSubmit={async event => {
        event.preventDefault(); if (pending) return;
        const revision = ++searchRevision.current;
        setPending("search"); setError("");
        try {
          const result = await searchAccountNicheAction(account, query);
          if (revision !== searchRevision.current) return;
          if (result.ok) {
            setCandidates(result.candidates); setSearchedQuery(query); setSelected(""); setConfirmed(false);
            if (!result.candidates.length) setError("Nenhum nicho oficial encontrado. Tente descrever sua atividade de outra forma.");
          } else setError(result.message);
        } catch { if (revision === searchRevision.current) setError("Não foi possível buscar os nichos agora. Tente novamente."); }
        finally { if (revision === searchRevision.current) setPending(null); }
      }}>
        <FormField className="min-w-0 flex-1"><FormFieldLabel htmlFor={`${id}-search`}>Buscar nicho</FormFieldLabel>
          <Input id={`${id}-search`} autoFocus minLength={2} maxLength={120} value={query} disabled={pending !== null}
            onChange={event => setQuery(event.target.value)} className="min-h-11" /></FormField>
        <Button type="submit" className="min-h-11" disabled={pending !== null || query.trim().length < 2}>{pending === "search" ? "Buscando..." : "Buscar"}</Button>
      </form> : null}
      {candidates.length ? <FormField className="mt-3"><FormFieldLabel htmlFor={`${id}-choice`}>Nicho oficial</FormFieldLabel>
        <Select id={`${id}-choice`} value={selected} disabled={pending !== null} className="min-h-11" onChange={event => { setSelected(event.target.value); setConfirmed(false); }}>
          <option value="">Selecione um nicho</option>
          {candidates.map(candidate => <option key={candidate.taxonId} value={candidate.taxonId}>{candidate.name}{candidate.parentName ? ` — ${candidate.parentName}` : ""}</option>)}
        </Select></FormField> : null}
      {chosen ? <label className="mt-3 flex min-h-11 items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={confirmed} disabled={pending !== null} onChange={event => setConfirmed(event.target.checked)} />
        <span className="break-words">Confirmo que <strong>{chosen.name}</strong> representa o nicho do meu negócio.</span>
      </label> : null}
      {hasIntelligence && changed ? <FeedbackMessage tone="warning" className="mt-3">Os conteúdos de Inteligência e copy serão preservados. Revise-os para adequá-los ao novo nicho antes de reutilizá-los.</FeedbackMessage> : null}
      {error ? <FeedbackMessage tone="error" className="mt-3">{error}</FeedbackMessage> : null}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" className="min-h-11" disabled={pending === "save"} onClick={requestClose}>Cancelar</Button>
        <Button className="min-h-11" disabled={pending !== null || !chosen || !confirmed || (!changed && Boolean(taxon?.confirmed))} onClick={async () => {
          if (!chosen || !confirmed || pending) return;
          setPending("save"); setError("");
          try {
            const result = await saveAccountNicheAction({ account, query: searchedQuery, taxonId: chosen.taxonId, expectedTaxonId: expected.current, confirmed });
            if (!result.ok) { setError(result.message); return; }
            setNotice(hasIntelligence && changed ? "Nicho salvo. Revise os conteúdos de Inteligência e copy antes de reutilizá-los. Nenhum conteúdo foi alterado." : "Nicho confirmado e salvo.");
            close(); router.refresh();
          } catch { setError("Não foi possível salvar o nicho agora. Tente novamente."); }
          finally { setPending(null); }
        }}>{pending === "save" ? "Salvando..." : "Salvar"}</Button>
      </div>
    </dialog>
    <dialog ref={discard} aria-labelledby={`${id}-discard`} onCancel={event => { event.preventDefault(); discard.current?.close(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-background p-4 text-foreground shadow-xl backdrop:bg-black/40">
      <h2 id={`${id}-discard`} className="font-semibold">Descartar a escolha do nicho?</h2>
      <p className="mt-2 text-sm">A escolha ainda não foi salva.</p>
      <div className="mt-3 flex flex-wrap gap-2"><Button className="min-h-11" onClick={() => discard.current?.close()}>Continuar editando</Button>
        <Button className="min-h-11" variant="secondary" onClick={close}>Descartar alterações</Button></div>
    </dialog>
  </div>;
}

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

  const formError =
    confirmSuggestedState.formError ??
    confirmOptionState.formError ??
    rewriteState.formError ??
    null;
  const isPending = isConfirmingSuggested || isConfirmingOption || isRewriting;

  if (resolution.uxMode === "fallback_review") {
    return (
      <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
        <CardHeader>
          <CardTitle>Informe seu nicho</CardTitle>
          <CardDescription>Nao encontramos uma opcao segura. Salve o texto que melhor descreve sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
          <RewriteForm
            accountSubdomain={accountSubdomain}
            action={rewriteAction}
            disabled={isPending}
          />
        </CardContent>
      </Card>
    );
  }

  if (resolution.uxMode === "choose_from_options" && resolution.options.length === 1) {
    const [singleOption] = resolution.options;

    return (
      <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
        <CardHeader>
          <CardTitle>Confirma seu nicho?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
          <div className="rounded-lg border border-blue-100 bg-white px-4 py-3">
            <p className="text-base font-semibold text-gray-950">{singleOption.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OptionActionForm
              option={singleOption}
              accountSubdomain={accountSubdomain}
              confirmAction={confirmOptionAction}
              disabled={isPending}
              label="Sim, confirmar"
            />
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

  if (resolution.uxMode === "choose_from_options") {
    return (
      <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
        <CardHeader>
          <CardTitle>Escolha o nicho mais proximo</CardTitle>
          <CardDescription>Encontramos algumas opcoes possiveis para personalizar melhor seu dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError ? <FeedbackMessage tone="error">{formError}</FeedbackMessage> : null}
          <div className="flex flex-wrap gap-2">
            {resolution.options.map((option) => (
              <OptionActionForm
                key={option.taxonId ?? option.name}
                option={option}
                accountSubdomain={accountSubdomain}
                confirmAction={confirmOptionAction}
                disabled={isPending}
                label={option.name}
              />
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
          <p className="text-sm text-gray-600">Identificamos que seu nicho provavelmente e:</p>
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

function OptionActionForm({
  option,
  accountSubdomain,
  confirmAction,
  disabled,
  label,
}: {
  option: ActionableNicheResolution["options"][number];
  accountSubdomain: string;
  confirmAction: (payload: FormData) => void;
  disabled: boolean;
  label: string;
}) {
  if (option.isOfficial && option.taxonId) {
    return (
      <form action={confirmAction}>
        <input type="hidden" name="account_subdomain" value={accountSubdomain} />
        <input type="hidden" name="taxon_id" value={option.taxonId} />
        <Button type="submit" disabled={disabled}>
          {label}
        </Button>
      </form>
    );
  }

  return (
    <form action={confirmAction}>
      <input type="hidden" name="account_subdomain" value={accountSubdomain} />
      <input type="hidden" name="option_name" value={option.name} />
      <Button type="submit" disabled={disabled}>
        {label}
      </Button>
    </form>
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
          placeholder="Ex.: Clinica de estetica para noivas"
          autoComplete="off"
        />
        <Button type="submit" disabled={disabled}>
          Salvar
        </Button>
      </div>
      <p className="text-xs text-gray-500">Use ate 120 caracteres. Essa escolha encerra a confirmacao.</p>
    </form>
  );
}
