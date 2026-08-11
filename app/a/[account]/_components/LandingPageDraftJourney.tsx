"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { generateFirstLandingPageDraftAction } from "../landing-page-actions";
import { initialLandingPageGenerationActionState } from "./landing-page-generation-action-contract";

export function LandingPageDraftJourney(props: Readonly<{
  accountSubdomain: string;
  landingPageId: string;
  experienceStatus: "unavailable" | "empty" | "invalid" | "ready";
}>) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    generateFirstLandingPageDraftAction,
    initialLandingPageGenerationActionState,
  );
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  useEffect(() => {
    if (state.formError) errorRef.current?.focus();
  }, [state.formError]);

  const previewHref = `/a/${props.accountSubdomain}/landing-pages/${props.landingPageId}/preview`;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-10">
        <div className="flex flex-wrap gap-2" aria-label="Estado da landing page">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
            Draft
          </span>
          <span className="rounded-full bg-graytech-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-graytech-700">
            Não publicada
          </span>
        </div>
        <h1 className="mt-5 break-words text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Sua primeira landing page está pronta para a próxima etapa.
        </h1>

        {props.experienceStatus === "ready" ? (
          <div className="mt-4">
            <p className="max-w-2xl break-words text-sm leading-6 text-graytech-700 sm:text-base">
              O conteúdo já foi materializado. O próximo passo disponível é revisar a página na visualização privada.
            </p>
            <Link
              href={previewHref}
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Abrir visualização privada
            </Link>
          </div>
        ) : null}

        {props.experienceStatus === "empty" ? (
          <form action={formAction} className="mt-4">
            <input type="hidden" name="account_subdomain" value={props.accountSubdomain} />
            <input type="hidden" name="landing_page_id" value={props.landingPageId} />
            <p className="max-w-2xl break-words text-sm leading-6 text-graytech-700 sm:text-base">
              A página ainda não possui conteúdo materializado. Gere a candidata completa para validá-la e criar o primeiro snapshot imutável.
            </p>
            <Button type="submit" disabled={pending} className="mt-7 min-h-11">
              {pending ? "Gerando landing page..." : "Gerar primeira landing page"}
            </Button>
          </form>
        ) : null}

        {props.experienceStatus === "unavailable" ? (
          <FeedbackMessage tone="warning" className="mt-5 max-w-2xl leading-6">
            A geração e a visualização ainda não estão disponíveis neste ambiente. Nenhuma chamada de geração será iniciada.
          </FeedbackMessage>
        ) : null}

        {props.experienceStatus === "invalid" ? (
          <FeedbackMessage tone="error" className="mt-5 max-w-2xl leading-6">
            O conteúdo materializado não pode ser reproduzido com segurança. A página permanece privada e não publicada.
          </FeedbackMessage>
        ) : null}

        {state.formError ? (
          <div ref={errorRef} tabIndex={-1} className="mt-5 max-w-2xl">
            <FeedbackMessage tone="error">{state.formError}</FeedbackMessage>
          </div>
        ) : null}
      </section>
    </main>
  );
}
