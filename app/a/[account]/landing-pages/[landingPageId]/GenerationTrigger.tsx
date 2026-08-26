"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import {
  generateLandingPageRevisionAction,
  type GenerateLandingPageRevisionActionState,
} from "./generation-actions";

const initialState: GenerateLandingPageRevisionActionState = { status: "idle" };

export function GenerationTrigger({
  accountSlug,
  landingPageId,
}: Readonly<{ accountSlug: string; landingPageId: string }>) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    generateLandingPageRevisionAction,
    initialState,
  );
  const successfulRevisionId = state.status === "success" ? state.revisionId : null;

  useEffect(() => {
    if (!successfulRevisionId) return;
    router.push(`/a/${accountSlug}/landing-pages/${landingPageId}/preview?revision=${successfulRevisionId}`);
  }, [accountSlug, landingPageId, router, successfulRevisionId]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="account_slug" value={accountSlug} />
      <input type="hidden" name="landing_page_id" value={landingPageId} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Gerando nova versão…" : "Gerar nova versão"}
      </button>
      {state.status === "error" ? (
        <p role="status" className="max-w-prose text-sm leading-6 text-amber-800">
          {state.message}
        </p>
      ) : state.status === "success" ? (
        <p role="status" className="max-w-prose text-sm leading-6 text-emerald-800">
          Versão {state.revisionNumber} criada. Abrindo o preview…
        </p>
      ) : null}
    </form>
  );
}
