"use client";

import { useEffect, useRef, useState } from "react";
import type { InputCatalogEvaluationActionResult, InputCatalogEvaluationReference, InputCatalogHumanDecisionActionResult } from "../../actions";
import type { FactualReviewDecisionLayer, InputCatalogEvaluationMode, InputCatalogEvaluationOutput } from "@/conversion-content/landing-page/taxon-preparation";

const layers: readonly FactualReviewDecisionLayer[] = ["universal", "segment", "niche", "ultra_niche"];
const layerLabels: Record<FactualReviewDecisionLayer, string> = { universal: "Universal", segment: "Segmento", niche: "Nicho", ultra_niche: "Ultranicho" };
const strategyLabels: Record<InputCatalogEvaluationOutput["sourceStrategy"], string> = { e20_5: "Pesquisa E20.5", web_search_fallback: "Web Search por ausência legítima da E20.5", web_search_focal: "Web Search focal" };
const stateLabels: Record<InputCatalogEvaluationOutput["sourceState"], string> = { e20_5_available: "E20.5 válida disponível", e20_5_absent_authorized: "Ausência E20.5 autorizada" };

type DecisionAction = (input: Readonly<{
  reviewId: string;
  expectedRevision: number;
  acceptedCandidates: readonly Readonly<{ index: number; layer: FactualReviewDecisionLayer }>[];
  ownCandidate: Readonly<{ factualNeed: string; layer: FactualReviewDecisionLayer }> | null;
}>) => Promise<InputCatalogHumanDecisionActionResult>;

export function AdminTaxonInputCatalogEvaluationRuntime({ taxonId, currentInputCatalogVersion, currentReviewedVersion, draftRevision, evaluateAction, decisionAction }: Readonly<{
  taxonId: string;
  currentInputCatalogVersion: number;
  currentReviewedVersion: number | null;
  draftRevision?: number;
  evaluateAction: (input: Readonly<{ taxonId: string; inputCatalogVersion: number; mode: InputCatalogEvaluationMode; focalHypothesis: string | null; feedback: Readonly<{ text: string; reviewId: string; expectedRevision: number }> | null; draftRevision?: number }>) => Promise<InputCatalogEvaluationActionResult>;
  decisionAction: DecisionAction;
}>) {
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const focusTargetRef = useRef<"feedback" | "result">("feedback");
  const [mode, setMode] = useState<InputCatalogEvaluationMode>("systematic");
  const [version, setVersion] = useState(String(currentInputCatalogVersion));
  const [hypothesis, setHypothesis] = useState("");
  const [feedback, setFeedback] = useState("");
  const [output, setOutput] = useState<InputCatalogEvaluationOutput | null>(null);
  const [reference, setReference] = useState<InputCatalogEvaluationReference | null>(null);
  const [accepted, setAccepted] = useState<Record<number, FactualReviewDecisionLayer>>({});
  const [ownNeed, setOwnNeed] = useState("");
  const [ownLayer, setOwnLayer] = useState<FactualReviewDecisionLayer>("universal");
  const [pending, setPending] = useState<"evaluation" | "decision" | null>(null);
  const [stale, setStale] = useState(false);
  const [message, setMessage] = useState<Readonly<{ tone: "error" | "success"; text: string }> | null>(null);

  useEffect(() => {
    if (!message) return;
    if (focusTargetRef.current === "result") resultHeadingRef.current?.focus();
    else feedbackRef.current?.focus();
  }, [message, output]);

  function showMessage(
    next: Readonly<{ tone: "error" | "success"; text: string }>,
    target: "feedback" | "result" = "feedback",
  ) {
    focusTargetRef.current = target;
    setMessage(next);
  }

  function invalidateResult() {
    if (output) setStale(true);
    setMessage(null);
  }

  async function runEvaluation() {
    const parsedVersion = Number(version);
    if (!Number.isSafeInteger(parsedVersion) || parsedVersion <= 0) return showMessage({ tone: "error", text: "Escolha uma versão executável positiva." });
    if (mode === "hypothesis" && !hypothesis.trim()) return showMessage({ tone: "error", text: "Descreva a hipótese factual focal." });
    setPending("evaluation");
    setMessage(null);
    try {
      const result = await evaluateAction({
        taxonId,
        inputCatalogVersion: parsedVersion,
        mode,
        focalHypothesis: mode === "hypothesis" ? hypothesis.trim() : null,
        feedback: output && reference && feedback.trim()
          ? { text: feedback.trim(), reviewId: reference.reviewId, expectedRevision: reference.reviewRevision }
          : null,
        ...(draftRevision === undefined ? {} : { draftRevision }),
      });
      if (!result.ok) {
        setOutput(null);
        setReference(null);
        return showMessage({ tone: "error", text: result.message });
      }
      setOutput(result.output);
      setReference(result.reference);
      setAccepted({});
      setOwnNeed("");
      setFeedback("");
      setStale(false);
      showMessage({ tone: "success", text: "Avaliação concluída; nenhuma decisão foi registrada automaticamente." }, "result");
    } catch {
      showMessage({ tone: "error", text: "A comunicação com o servidor falhou. Nenhuma decisão foi registrada." });
    } finally {
      setPending(null);
    }
  }

  async function recordDecision() {
    if (!output || !reference || stale || output.status === "inconclusive") return;
    const acceptedCandidates = Object.entries(accepted).map(([index, layer]) => ({ index: Number(index), layer }));
    const ownCandidate = ownNeed.trim() ? { factualNeed: ownNeed.trim(), layer: ownLayer } : null;
    if ((acceptedCandidates.length > 0 || ownCandidate) && draftRevision === undefined) {
      return showMessage({ tone: "error", text: "Decisão com mudança exige abrir esta avaliação pelo draft exato na Estrutura da LP." });
    }
    setPending("decision");
    setMessage(null);
    try {
      const result = await decisionAction({
        reviewId: reference.reviewId,
        expectedRevision: reference.reviewRevision,
        acceptedCandidates,
        ownCandidate,
      });
      if (!result.ok) {
        if (result.stale) setStale(true);
        return showMessage({ tone: "error", text: result.message });
      }
      showMessage({ tone: "success", text: result.decisionKind === "catalog_change" ? "Decisão humana com mudança vinculada ao draft exato; aguarda publicação." : `Decisão sem mudança concluída sobre a versão ${result.reviewedVersion}.` });
    } catch {
      showMessage({ tone: "error", text: "A comunicação com o servidor falhou. A decisão não foi registrada." });
    } finally {
      setPending(null);
    }
  }

  const actionableIndexes = output?.candidates.flatMap((candidate, index) => candidate.conclusion === "refine_existing_field" || candidate.conclusion === "possible_new_field" ? [index] : []) ?? [];
  const decisionKind = Object.keys(accepted).length > 0 || ownNeed.trim() ? "catalog_change" : "no_change";

  return (
    <section aria-labelledby="evaluation-title" className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avaliação opcional</p>
      <h2 id="evaluation-title" className="mt-1 text-lg font-semibold text-card-foreground">Avaliação factual v2</h2>
      <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">A avaliação produz recomendação. Decisão, autorização, publicação e ativação permanecem etapas humanas separadas.</p>

      <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Versão do catálogo" hint={draftRevision === undefined ? `Marcador atual: ${currentReviewedVersion ?? "nenhum"}.` : "Fixada pelo draft atual."} id="evaluation-version">
          <input aria-describedby="evaluation-version-hint" aria-invalid={message?.tone === "error" || undefined} className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-60" disabled={pending !== null || draftRevision !== undefined} id="evaluation-version" min={1} onChange={(event) => { setVersion(event.currentTarget.value); invalidateResult(); }} type="number" value={version} />
        </Field>
        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold text-foreground">Modo</legend>
          <div className="mt-2 grid gap-2">
            {(["systematic", "hypothesis"] as const).map((candidateMode) => (
              <label key={candidateMode} className="flex min-h-11 min-w-0 items-center gap-3 rounded-md border border-border px-3 py-2 text-sm focus-within:ring-4 focus-within:ring-brand-600/20">
                <input checked={mode === candidateMode} disabled={pending !== null} name="evaluation-mode" onChange={() => { setMode(candidateMode); invalidateResult(); }} type="radio" />
                <span>{candidateMode === "systematic" ? "Sistemática" : "Hipótese focal"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {mode === "hypothesis" ? <Field label="Hipótese factual" hint="Uma necessidade factual por execução; não inclua dados sensíveis." id="evaluation-hypothesis"><textarea aria-describedby="evaluation-hypothesis-hint" className="min-h-28 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20" id="evaluation-hypothesis" maxLength={2000} onChange={(event) => { setHypothesis(event.currentTarget.value); invalidateResult(); }} value={hypothesis} /></Field> : null}
      {output && !stale ? <Field label="Feedback para nova avaliação" hint={output.followUpQuestion ?? "Opcional; uma nova execução continua explícita."} id="evaluation-feedback"><textarea aria-describedby="evaluation-feedback-hint" className="min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20" id="evaluation-feedback" maxLength={2000} onChange={(event) => setFeedback(event.currentTarget.value)} value={feedback} /></Field> : null}

      <button className="mt-5 min-h-11 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white outline-none transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-60" disabled={pending !== null} onClick={runEvaluation} type="button">{pending === "evaluation" ? "Avaliando…" : output && !stale ? "Reavaliar" : "Executar avaliação"}</button>
      {message ? <Feedback focusRef={feedbackRef} tone={message.tone}>{message.text}</Feedback> : null}
      {stale ? <Feedback tone="error">O resultado ficou desatualizado; execute uma nova avaliação.</Feedback> : null}

      {output ? <div className="mt-6 min-w-0">
        <h3 ref={resultHeadingRef} tabIndex={-1} className="text-base font-semibold text-foreground outline-none">Resultado validado</h3>
        <dl className="mt-3 grid min-w-0 gap-3 text-sm sm:grid-cols-3"><Metric label="Status" value={output.status} /><Metric label="Estratégia" value={strategyLabels[output.sourceStrategy]} /><Metric label="Estado da fonte" value={stateLabels[output.sourceState]} /></dl>
        <p className="mt-3 break-words text-sm leading-6 text-foreground">{output.summary}</p>
        <SourceList label="Fontes do resumo" urls={output.summarySourceUrls} />
        <ol className="mt-4 grid min-w-0 gap-3">
          {output.candidates.map((candidate, index) => <li key={`${candidate.origin}-${index}`} className="min-w-0 rounded-md border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">Candidato {index + 1}: {candidate.conclusion}</p>
            <p className="mt-2 break-words text-sm">{candidate.factualNeed}</p>
            <p className="mt-2 break-words text-xs text-muted-foreground">{candidate.evidence}</p>
            <SourceList label="Fontes do candidato" urls={candidate.sourceUrls} />
            {actionableIndexes.includes(index) ? <fieldset className="mt-3 min-w-0"><legend className="text-xs font-semibold text-foreground">Decisão humana sobre este candidato</legend><div className="mt-2 flex min-w-0 flex-wrap gap-2">
              <label className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><input checked={accepted[index] === undefined} name={`candidate-${index}`} onChange={() => setAccepted((current) => { const next = { ...current }; delete next[index]; return next; })} type="radio" />Rejeitar</label>
              {layers.map((layer) => <label key={layer} className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><input checked={accepted[index] === layer} name={`candidate-${index}`} onChange={() => setAccepted((current) => ({ ...current, [index]: layer }))} type="radio" />Aceitar em {layerLabels[layer]}</label>)}
            </div></fieldset> : null}
          </li>)}
        </ol>
        {output.status !== "inconclusive" ? <fieldset className="mt-5 min-w-0 rounded-md border border-border p-4"><legend className="px-1 text-sm font-semibold text-foreground">Candidato próprio opcional</legend>
          <Field label="Necessidade factual" hint="Deixe vazio quando não houver candidato humano adicional." id="own-candidate"><textarea aria-describedby="own-candidate-hint" id="own-candidate" maxLength={1000} value={ownNeed} onChange={(event) => setOwnNeed(event.currentTarget.value)} className="min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20" /></Field>
          <Field label="Camada explícita" hint="Obrigatória quando houver candidato próprio." id="own-layer"><select aria-describedby="own-layer-hint" id="own-layer" value={ownLayer} onChange={(event) => setOwnLayer(event.currentTarget.value as FactualReviewDecisionLayer)} className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">{layers.map((layer) => <option key={layer} value={layer}>{layerLabels[layer]}</option>)}</select></Field>
        </fieldset> : null}
        <div className="mt-5 rounded-md border-2 border-border p-4"><p className="text-sm font-semibold text-foreground">Decisão preparada: {decisionKind === "no_change" ? "sem mudança" : "com mudança"}</p><p className="mt-1 text-xs text-muted-foreground">{decisionKind === "catalog_change" ? "Só pode ser persistida sobre o draft e a revisão exatos; nenhum field é criado aqui." : "Todos os candidatos acionáveis foram rejeitados e não há candidato próprio."}</p><button className="mt-3 min-h-11 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white outline-none transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-60" disabled={pending !== null || stale || output.status === "inconclusive"} onClick={recordDecision} type="button">{pending === "decision" ? "Registrando…" : "Registrar decisão humana"}</button></div>
      </div> : null}
    </section>
  );
}

function Field({ children, hint, id, label }: Readonly<{ children: React.ReactNode; hint: string; id: string; label: string }>) { return <div className="mt-4 min-w-0"><label className="text-sm font-semibold text-foreground" htmlFor={id}>{label}</label><p id={`${id}-hint`} className="mt-1 break-words text-xs text-muted-foreground">{hint}</p><div className="mt-2">{children}</div></div>; }
function Metric({ label, value }: Readonly<{ label: string; value: string }>) { return <div className="min-w-0 rounded-md border border-border bg-background px-3 py-2"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-semibold text-foreground">{value}</dd></div>; }
function SourceList({ label, urls }: Readonly<{ label: string; urls: readonly string[] }>) { return <div className="mt-3 min-w-0"><p className="text-xs font-semibold text-muted-foreground">{label}</p>{urls.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">Sem fonte web para esta estratégia.</p> : <ul className="mt-1 min-w-0 space-y-1 text-xs">{urls.map((url) => <li key={url} className="min-w-0 break-words"><a className="text-brand-700 underline" href={url} rel="noreferrer" target="_blank">{url}</a></li>)}</ul>}</div>; }
function Feedback({ children, focusRef, tone }: Readonly<{ children: string; focusRef?: React.Ref<HTMLParagraphElement>; tone: "error" | "success" }>) { return <p ref={focusRef} tabIndex={focusRef ? -1 : undefined} aria-live="polite" role={tone === "error" ? "alert" : "status"} className={`mt-4 break-words rounded-md border px-3 py-2 text-sm outline-none ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{children}</p>; }
