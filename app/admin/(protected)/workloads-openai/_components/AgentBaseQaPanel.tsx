"use client";

import { useActionState } from "react";
import { AGENT_BASE_QA_MODEL, AGENT_BASE_QA_REASONING_EFFORT } from "@/communication-base/agent-base/research";

import {
  runAgentBaseQaAction,
  type AgentBaseQaState,
} from "../agent-base-qa-action";

const B_GROUPS = [
  { label: "Dores", prefix: "Dor: " },
  { label: "Desejos", prefix: "Desejo: " },
  { label: "Crenças", prefix: "Crença: " },
  { label: "Objeções", prefix: "Objeção: " },
] as const;

const INITIAL_STATE: AgentBaseQaState = {
  status: "idle", message: "", mode: null, report: "", audience: "", marketInsights: [], sources: [],
  model: null, effort: null, latencyMs: null, totalTokens: null, webCalls: null,
};

export function AgentBaseQaPanel() {
  const [state, formAction, pending] = useActionState(runAgentBaseQaAction, INITIAL_STATE);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5"
      aria-labelledby="agent-base-qa-heading">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">D14F · Experimento somente no Preview</p>
      <h2 id="agent-base-qa-heading" className="mt-1 text-lg font-semibold text-foreground">
        Agente Base — laboratório de inteligência de mercado
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        Caso: João Imóveis QA. A execução consulta a Categoria 1 e o nicho oficial salvos,
        executa {AGENT_BASE_QA_MODEL} com esforço {AGENT_BASE_QA_REASONING_EFFORT}, exclusivamente
        neste experimento, e realiza pesquisa Web pela OpenAI. O Modelo A gera as seções 3.2 e 3.3;
        o Modelo B testa apenas a seção 3.3 com quatro listas objetivas. O diagnóstico anterior continua
        disponível. Nenhum resultado é salvo na Base e os outros agentes não são alterados.
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap gap-3">
        <button type="submit" name="intent" value="sections" disabled={pending}
          className="min-h-11 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-800 focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Executando o Agente Base..." : "Gerar seções 3.2 e 3.3"}
        </button>
        <button type="submit" name="intent" value="insights_b" disabled={pending}
          className="min-h-11 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-800 focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60">
          Testar Modelo B — seção 3.3
        </button>
        <button type="submit" name="intent" value="research" disabled={pending}
          className="min-h-11 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60">
          Executar diagnóstico anterior
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
            <div><dt className="inline font-semibold">Consultas Web: </dt><dd className="inline">{state.webCalls ?? "indisponível"}</dd></div>
          </dl>
          {state.mode === "sections" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Rascunhos estratégicos para revisão humana. Não constituem fatos confirmados da empresa.
              </p>
              <section aria-labelledby="agent-base-section-32" className="space-y-2">
                <h3 id="agent-base-section-32" className="text-base font-semibold text-foreground">
                  3.2 Público e contexto
                </h3>
                <div className="whitespace-pre-wrap break-words rounded-md border border-border bg-background p-4 text-sm leading-6 text-foreground">
                  {state.audience}
                </div>
              </section>
              <section aria-labelledby="agent-base-section-33" className="space-y-2">
                <h3 id="agent-base-section-33" className="text-base font-semibold text-foreground">
                  3.3 Dores, desejos, crenças e objeções
                </h3>
                <ul className="list-disc space-y-2 rounded-md border border-border bg-background p-4 pl-8 text-sm leading-6 text-foreground">
                  {state.marketInsights.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </section>
            </div>
          ) : state.mode === "insights_b" ? (
            <section aria-labelledby="agent-base-section-b" className="space-y-3">
              <p className="text-sm text-muted-foreground">Hipóteses estratégicas para revisão humana.</p>
              <h3 id="agent-base-section-b" className="text-base font-semibold text-foreground">
                3.3 Dores, desejos, crenças e objeções — Modelo B
              </h3>
              <div className="space-y-4 rounded-md border border-border bg-background p-4">
                {B_GROUPS.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">{group.label}</h4>
                    <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-foreground">
                      {state.marketInsights.filter((item) => item.startsWith(group.prefix)).map((item, index) => (
                        <li key={index}>{item.slice(group.prefix.length)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <>
              <h3 className="text-base font-semibold text-foreground">Diagnóstico de mercado</h3>
              <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-4 text-sm leading-6 text-foreground">
                {state.report}
              </div>
            </>
          )}
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
