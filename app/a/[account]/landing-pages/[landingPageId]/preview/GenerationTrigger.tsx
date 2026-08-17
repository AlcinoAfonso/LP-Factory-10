"use client";

import { useActionState } from "react";

import {
  generateLandingPageRevisionAction,
  type GenerateLandingPageRevisionActionState,
} from "./actions";

const initialState: GenerateLandingPageRevisionActionState = { status: "idle" };

export function GenerationTrigger({
  accountSlug,
  landingPageId,
}: Readonly<{ accountSlug: string; landingPageId: string }>) {
  const [state, action, pending] = useActionState(
    generateLandingPageRevisionAction,
    initialState,
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="account_slug" value={accountSlug} />
      <input type="hidden" name="landing_page_id" value={landingPageId} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Verificando disponibilidade…" : "Gerar nova revisão"}
      </button>
      {state.status === "error" ? (
        <p role="status" className="max-w-prose text-sm leading-6 text-amber-800">
          {state.message}
        </p>
      ) : state.status === "success" ? (
        <p role="status" className="max-w-prose text-sm leading-6 text-emerald-800">
          Revisão {state.revisionNumber} criada com sucesso.
        </p>
      ) : null}
    </form>
  );
}
