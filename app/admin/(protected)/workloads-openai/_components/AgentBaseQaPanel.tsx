"use client";

import { useActionState } from "react";

import {
  AGENT_BASE_QA_INITIAL_STATE,
  runAgentBaseQaAction,
} from "../agent-base-qa-action";

export function AgentBaseQaPanel() {
  const [state, formAction, pending] = useActionState(runAgentBaseQaAction, AGENT_BASE_QA_INITIAL_STATE);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5"
      aria-labelledby="agent-base-qa-heading">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">D14F · Experimento somente no Preview</p>
      <h2 id="agent-base-qa-heading" className="mt-1 text-lg font-semibold text-foreground">
        Agente Base — pesquisa real de nicho
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        Caso: João Imóveis QA. A execução consulta a Categoria 1 e o nicho oficial salvos,
        usa o modelo ativo da Base em Preview e realiza pesquisa Web pela OpenAI.
        Não gera as sete seções, não salva na Base nem altera configurações de outros agentes.
      </p>
      <form action={formAction} className="mt-4">
        <button type="submit" disabled={pending}
          className="min-h-11 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-800 focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Pesquisando o mercado..." : "Executar pesquisa real"}
        </button>
      </form>
      <div aria-live="polite" aria-atomic="true" className="mt-3 text-sm text-foreground">
        {pending ? "O Agente Base está pesquisando. A resposta será apresentada nesta página." : state.message}
      </div>
      {state.status === "success" ? (
        <div className="mt-5 space-y-4 border-t border-border pt-4">
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <div><dt className="inline font-semibold">Modelo: </dt><dd className="inline">{state.model}</dd></div>
            <div><dt className="inline font-semibold">Esforço: </dt><dd className="inline">{state.effort}</dd></div>
            <div><dt className="inline font-semibold">Duração: </dt><dd className="inline">{state.latencyMs == null ? "indisponível" : `${Math.round(state.latencyMs / 1000)} s`}</dd></div>
            <div><dt className="inline font-semibold">Tokens: </dt><dd className="inline">{state.totalTokens ?? "indisponível"}</dd></div>
          </dl>
          <h3 className="text-base font-semibold text-foreground">Análise produzida pelo Agente Base</h3>
          <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-4 text-sm leading-6 text-foreground">
            {state.report}
          </div>
          <h3 className="text-base font-semibold text-foreground">Fontes identificadas na resposta OpenAI</h3>
          <ul className="space-y-2">
            {state.sources.map((source) => (
              <li key={source.url} className="break-all text-sm">
                <a className="text-brand-700 underline underline-offset-2" href={source.url} target="_blank"
                  rel="noopener noreferrer">{source.title || source.url}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
