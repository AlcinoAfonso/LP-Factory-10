"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { InputCatalogEvaluationMode, InputCatalogEvaluationOutput } from "@/conversion-content/landing-page/taxon-preparation";

type EvaluationResult = Readonly<{ ok: true; output: InputCatalogEvaluationOutput }> | Readonly<{ ok: false; code: string; message: string }>;
type Props = Readonly<{
  taxonId: string;
  isActive: boolean;
  evaluateAction: (input: Readonly<{ taxonId: string; mode: InputCatalogEvaluationMode; focalHypothesis: string | null }>) => Promise<EvaluationResult>;
}>;

export function AdminTaxonInputCatalogEvaluation({ taxonId, isActive, evaluateAction }: Props) {
  const [mode, setMode] = useState<InputCatalogEvaluationMode>("systematic");
  const [hypothesis, setHypothesis] = useState("");
  const [output, setOutput] = useState<InputCatalogEvaluationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function evaluate() {
    setError(null);
    setOutput(null);
    startTransition(async () => {
      const result = await evaluateAction({ taxonId, mode, focalHypothesis: mode === "hypothesis" ? hypothesis : null });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOutput(result.output);
    });
  }

  return (
    <section aria-labelledby="factual-evaluation-title" className="rounded-lg border border-border bg-card p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Apoio opcional por IA</p>
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground" id="factual-evaluation-title">Avaliar suficiência factual</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">A IA apenas recomenda. A avaliação não libera o taxon e não cria, edita ou inativa fields.</p>
        </div>
        <AdminStatusBadge tone={isActive ? "success" : "neutral"}>{isActive ? "Taxon ativo" : "Taxon inativo"}</AdminStatusBadge>
      </div>

      <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium text-foreground">Modo de avaliação</legend>
        {(["systematic", "hypothesis"] as const).map((value) => (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 outline-none focus-within:ring-4 focus-within:ring-brand-600/30" key={value}>
            <input checked={mode === value} name="evaluation-mode" onChange={() => setMode(value)} type="radio" />
            <span className="text-sm font-medium text-foreground">{value === "systematic" ? "Revisão sistemática" : "Hipótese focal"}</span>
          </label>
        ))}
      </fieldset>

      {mode === "hypothesis" ? (
        <label className="mt-4 block text-sm font-medium text-foreground">
          Hipótese factual
          <textarea className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30" maxLength={600} onChange={(event) => setHypothesis(event.target.value)} placeholder="Ex.: o consumidor precisa conhecer a faixa típica de comissão antes de avançar." value={hypothesis} />
        </label>
      ) : null}

      <button className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending || (mode === "hypothesis" && !hypothesis.trim())} onClick={evaluate} type="button">
        {pending ? "Avaliando…" : "Executar avaliação consultiva"}
      </button>

      <div aria-live="polite" className="mt-4">
        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p> : null}
        {output ? <EvaluationOutput output={output} taxonId={taxonId} /> : null}
      </div>
    </section>
  );
}

function EvaluationOutput({ output, taxonId }: Readonly<{ output: InputCatalogEvaluationOutput; taxonId: string }>) {
  return (
    <div className="space-y-4 rounded-md border border-border bg-background p-4">
      <div className="flex flex-wrap items-center gap-3">
        <AdminStatusBadge tone={output.status === "sufficient" ? "success" : output.status === "candidate_gaps" ? "warning" : "neutral"}>{output.status === "sufficient" ? "Cobertura suficiente" : output.status === "candidate_gaps" ? "Candidatos a gap" : "Inconclusivo"}</AdminStatusBadge>
        <span className="text-xs text-muted-foreground">{output.sourceStrategy}</span>
      </div>
      <p className="text-sm text-foreground">{output.summary}</p>
      {output.candidates.length > 0 ? (
        <div className="grid gap-3">
          {output.candidates.map((candidate, index) => (
            <article className="rounded-md border border-border p-4" key={`${candidate.factualNeed}-${index}`}>
              <p className="font-medium text-foreground">{candidate.factualNeed}</p>
              <p className="mt-2 text-sm text-muted-foreground">{candidate.evidence}</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Detail label="Conclusão" value={candidate.conclusion} />
                <Detail label="Camada sugerida" value={candidate.suggestedTaxonomyLayer ?? "Não definida"} />
                <Detail label="Consumidor real" value={candidate.realConsumer ?? "Não comprovado"} />
                <Detail label="Prejuízo concreto" value={candidate.concreteHarm ?? "Não comprovado"} />
              </dl>
            </article>
          ))}
        </div>
      ) : null}
      {output.followUpQuestion ? <p className="text-sm text-muted-foreground">Próxima pergunta: {output.followUpQuestion}</p> : null}
      <Link className="inline-flex min-h-11 items-center rounded-md font-semibold text-brand-700 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-brand-600/30" href={`/admin/estrutura-lp?view=entradas&taxon=${taxonId}`}>Abrir gestão humana de fields</Link>
    </div>
  );
}

function Detail({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div><dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt><dd className="mt-1 text-foreground">{value}</dd></div>;
}
