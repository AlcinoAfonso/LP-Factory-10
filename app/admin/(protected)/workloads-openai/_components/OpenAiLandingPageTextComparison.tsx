"use client";

import { useState, useTransition } from "react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  buildLandingPageDraftComparisonSummary,
  landingPageDraftComparisonConfigurationKey,
  type LandingPageDraftComparisonDecision,
  type LandingPageDraftComparisonEvaluation,
  type LandingPageDraftComparisonResult,
  type LandingPageDraftComparisonRound,
  type LandingPageDraftComparisonSelection,
} from "@/lp-builder/landingPageDraftComparison";
import type {
  OpenAiConfigurationSource,
  OpenAiManagedWorkloadEnvironment,
  OpenAiReasoningEffort,
} from "@/openai-workloads/contracts";
import {
  repeatLandingPageDraftComparisonAction,
  startLandingPageDraftComparisonAction,
} from "../comparisonActions";

type Baseline = LandingPageDraftComparisonSelection &
  Readonly<{
    environment: OpenAiManagedWorkloadEnvironment;
    source: OpenAiConfigurationSource;
    revision: string;
  }>;

type Props = Readonly<{
  baselines: readonly Baseline[];
  options: readonly LandingPageDraftComparisonSelection[];
  catalogAvailable: boolean;
}>;

type EvaluationDraft = Readonly<{
  validity: "valid" | "invalid";
  quality: 1 | 2 | 3 | 4 | 5;
  correction: "none" | "light" | "substantial";
  comment: string;
}>;

const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";
const field =
  "mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";

export function OpenAiLandingPageTextComparison({
  baselines,
  options,
  catalogAvailable,
}: Props) {
  const [environment, setEnvironment] =
    useState<OpenAiManagedWorkloadEnvironment>("preview");
  const [selectedKeys, setSelectedKeys] = useState<readonly string[]>([]);
  const [round, setRound] = useState<LandingPageDraftComparisonRound | null>(null);
  const [evaluations, setEvaluations] = useState<
    Readonly<Record<string, EvaluationDraft>>
  >({});
  const [evaluatedAliases, setEvaluatedAliases] = useState<readonly string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [finalistKeys, setFinalistKeys] = useState<readonly string[]>([]);
  const [repetitions, setRepetitions] = useState<
    readonly LandingPageDraftComparisonResult[]
  >([]);
  const [decisionKind, setDecisionKind] =
    useState<LandingPageDraftComparisonDecision["kind"]>(
      "insufficient_evidence",
    );
  const [recommendedAlias, setRecommendedAlias] = useState("");
  const [rationale, setRationale] = useState("");
  const [limitations, setLimitations] = useState("");
  const [feedback, setFeedback] = useState<
    Readonly<{ tone: "error" | "success"; message: string }> | null
  >(null);
  const [pending, startTransition] = useTransition();

  const baseline = baselines.find(
    (candidate) => candidate.environment === environment,
  );
  const baselineKey = baseline
    ? landingPageDraftComparisonConfigurationKey(baseline)
    : null;
  const eligibleOptions = options.filter(
    (option) =>
      landingPageDraftComparisonConfigurationKey(option) !== baselineKey,
  );
  const successfulResults = round?.results.filter((result) => result.attempt.ok) ?? [];
  const readyToReveal =
    Boolean(round) &&
    successfulResults.every((result) => evaluatedAliases.includes(result.alias));
  const completeEvaluations = evaluations as Readonly<
    Record<string, LandingPageDraftComparisonEvaluation>
  >;
  const decision: LandingPageDraftComparisonDecision = {
    kind: decisionKind,
    recommendedAlias:
      decisionKind === "recommendation" ? recommendedAlias || null : null,
    rationale,
    limitations,
  };
  const summary =
    round &&
    revealed &&
    rationale.trim() &&
    (decisionKind === "insufficient_evidence" || recommendedAlias)
      ? buildLandingPageDraftComparisonSummary({
          round,
          evaluations: completeEvaluations,
          repetitions,
          decision,
        })
      : null;

  function resetComparison(nextEnvironment: OpenAiManagedWorkloadEnvironment) {
    setEnvironment(nextEnvironment);
    setSelectedKeys([]);
    setRound(null);
    setEvaluations({});
    setEvaluatedAliases([]);
    setRevealed(false);
    setFinalistKeys([]);
    setRepetitions([]);
    setFeedback(null);
  }

  function toggleSelection(key: string) {
    setSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((candidate) => candidate !== key)
        : [...current, key],
    );
  }

  function executeInitialRound() {
    const configurations = eligibleOptions.filter((option) =>
      selectedKeys.includes(landingPageDraftComparisonConfigurationKey(option)),
    );
    setFeedback(null);
    startTransition(async () => {
      const result = await startLandingPageDraftComparisonAction({
        environment,
        configurations,
      });
      if (!result.ok) {
        setFeedback({ tone: "error", message: result.message });
        return;
      }
      const drafts = Object.fromEntries(
        result.round.results
          .filter((candidate) => candidate.attempt.ok)
          .map((candidate) => [candidate.alias, initialEvaluation()]),
      );
      setRound(result.round);
      setEvaluations(drafts);
      setEvaluatedAliases([]);
      setRevealed(false);
      setFinalistKeys([]);
      setRepetitions([]);
      setFeedback({
        tone: "success",
        message: "Rodada concluída. Avalie os resultados antes de revelar as configurações.",
      });
    });
  }

  function updateEvaluation(alias: string, patch: Partial<EvaluationDraft>) {
    setEvaluations((current) => ({
      ...current,
      [alias]: { ...(current[alias] ?? initialEvaluation()), ...patch },
    }));
    setEvaluatedAliases((current) =>
      current.filter((candidate) => candidate !== alias),
    );
  }

  function registerEvaluation(alias: string) {
    setEvaluatedAliases((current) =>
      current.includes(alias) ? current : [...current, alias],
    );
  }

  function toggleFinalist(key: string) {
    setFinalistKeys((current) => {
      if (current.includes(key)) {
        return current.filter((candidate) => candidate !== key);
      }
      return current.length >= 2 ? current : [...current, key];
    });
  }

  function repeatFinalists() {
    if (!round) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await repeatLandingPageDraftComparisonAction({
        roundToken: round.roundToken,
        finalistKeys,
      });
      if (!result.ok) {
        setFeedback({ tone: "error", message: result.message });
        return;
      }
      setRepetitions(result.results);
      setFeedback({
        tone: "success",
        message: "Repetição focalizada concluída sem alterar o lifecycle.",
      });
    });
  }

  function copySummary() {
    if (!summary) return;
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(summary);
        setFeedback({ tone: "success", message: "Resumo copiado." });
      } catch {
        setFeedback({
          tone: "error",
          message: "Não foi possível copiar automaticamente. Selecione o resumo manualmente.",
        });
      }
    });
  }

  return (
    <section
      className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-6"
      aria-labelledby="landing-page-text-comparison-title"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            E21.3.3 · evidência transitória
          </p>
          <h2
            id="landing-page-text-comparison-title"
            className="mt-1 text-xl font-semibold text-foreground"
          >
            Comparação textual da Landing Page
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Compare a baseline ativa e candidatas elegíveis com a mesma fixture v4 de
            Corretor Imóveis. A identidade fica oculta na apresentação até todas as
            avaliações qualitativas serem registradas.
          </p>
        </div>
        <AdminStatusBadge tone="neutral">Sem persistência</AdminStatusBadge>
      </div>

      <div className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        Esta experiência não salva candidata, não promove revisão e não ativa configuração.
        Qualquer continuação operacional permanece humana no lifecycle E21.2.5.
      </div>

      <fieldset className="mt-6" disabled={pending || Boolean(round)}>
        <legend className="text-sm font-semibold text-foreground">1. Ambiente e baseline</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["preview", "production"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={value === environment ? primaryButton : secondaryButton}
              aria-pressed={value === environment}
              onClick={() => resetComparison(value)}
            >
              {value === "preview" ? "Preview" : "Production"}
            </button>
          ))}
        </div>
        {baseline ? (
          <dl className="mt-4 grid gap-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-950 sm:grid-cols-3">
            <div><dt className="font-semibold">Baseline ativa</dt><dd className="mt-1 break-all font-mono text-xs">{baseline.model}</dd></div>
            <div><dt className="font-semibold">Esforço</dt><dd className="mt-1">{effortLabel(baseline.reasoningEffort)}</dd></div>
            <div><dt className="font-semibold">Fonte e revisão</dt><dd className="mt-1">{baseline.source} · {baseline.revision}</dd></div>
          </dl>
        ) : (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
            A baseline ativa deste ambiente não pôde ser confirmada.
          </p>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">2. Candidatas do catálogo</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha de 1 a 5 candidatas; com a baseline, a rodada terá de 2 a 6 configurações.
          </p>
          {catalogAvailable && eligibleOptions.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {eligibleOptions.map((option) => {
                const key = landingPageDraftComparisonConfigurationKey(option);
                return (
                  <label key={key} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-3 text-sm text-foreground hover:bg-muted">
                    <input
                      type="checkbox"
                      className="mt-1 size-5 accent-brand-700"
                      checked={selectedKeys.includes(key)}
                      onChange={() => toggleSelection(key)}
                    />
                    <span><span className="block break-all font-mono text-xs font-semibold">{option.model}</span><span className="mt-1 block text-muted-foreground">{effortLabel(option.reasoningEffort)}</span></span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
              O catálogo elegível não está disponível; a comparação permanece bloqueada.
            </p>
          )}
        </div>
        <button
          type="button"
          className={`${primaryButton} mt-5`}
          disabled={!baseline || !catalogAvailable || selectedKeys.length < 1 || selectedKeys.length > 5}
          onClick={executeInitialRound}
        >
          Executar comparação cega
        </button>
      </fieldset>

      {pending ? (
        <p className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950" role="status" aria-live="polite">
          Executando chamadas isoladas. Uma falha não cancela os demais resultados…
        </p>
      ) : null}
      {feedback ? (
        <div className={`mt-5 rounded-md border p-4 text-sm ${feedback.tone === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-green-200 bg-green-50 text-green-900"}`} role={feedback.tone === "error" ? "alert" : "status"} aria-live={feedback.tone === "error" ? "assertive" : "polite"}>
          {feedback.message}
        </div>
      ) : null}

      {round ? (
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="text-base font-semibold text-foreground">3. Avaliação cega</h3><p className="mt-1 text-sm text-muted-foreground">Avalie somente o conteúdo textual. O cegamento é apresentacional.</p></div>
            <AdminStatusBadge tone={revealed ? "success" : "warning"}>{revealed ? "Identidades reveladas" : "Identidades ocultas"}</AdminStatusBadge>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {round.results.map((result) => (
              <ResultCard
                key={result.alias}
                result={result}
                evaluation={evaluations[result.alias] ?? initialEvaluation()}
                evaluationRegistered={evaluatedAliases.includes(result.alias)}
                revealed={revealed}
                disabled={pending}
                onEvaluationChange={(patch) => updateEvaluation(result.alias, patch)}
                onRegister={() => registerEvaluation(result.alias)}
              />
            ))}
          </div>
          <button type="button" className={`${primaryButton} mt-5`} disabled={!readyToReveal || revealed || pending} onClick={() => setRevealed(true)}>
            Revelar configurações e eficiência
          </button>
          {!readyToReveal ? <p className="mt-2 text-xs text-muted-foreground">Registre a avaliação de cada resultado gerado para avançar.</p> : null}
        </div>
      ) : null}

      {round && revealed ? (
        <div className="mt-8 space-y-8 border-t border-border pt-6">
          <section aria-labelledby="repeat-title">
            <h3 id="repeat-title" className="text-base font-semibold text-foreground">4. Repetição focalizada</h3>
            <p className="mt-1 text-sm text-muted-foreground">A baseline será repetida sempre. Escolha até dois finalistas; o catálogo será revalidado imediatamente antes das chamadas.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {round.results.filter((result) => !result.configuration.baseline && result.attempt.ok).map((result) => (
                <label key={result.configuration.key} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-background p-3 text-sm hover:bg-muted">
                  <input type="checkbox" className="size-5 accent-brand-700" checked={finalistKeys.includes(result.configuration.key)} disabled={pending || (!finalistKeys.includes(result.configuration.key) && finalistKeys.length >= 2)} onChange={() => toggleFinalist(result.configuration.key)} />
                  <span>{result.alias} · {result.configuration.model} + {effortLabel(result.configuration.reasoningEffort)}</span>
                </label>
              ))}
            </div>
            <button type="button" className={`${secondaryButton} mt-4`} disabled={pending} onClick={repeatFinalists}>Repetir baseline{finalistKeys.length ? " e finalistas" : ""}</button>
            {repetitions.length > 0 ? <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-950" role="status"><p>{repetitions.length} resultados de repetição disponíveis. Estabilidade só pode ser discutida para essas configurações.</p><ul className="mt-2 space-y-1">{repetitions.map((result) => <li key={result.configuration.key}>{result.alias} · {result.configuration.model} + {effortLabel(result.configuration.reasoningEffort)} · {result.attempt.ok ? `${result.attempt.latencyMs} ms; ${metric(result.attempt.usage.totalTokens)} tokens` : `falha ${result.attempt.kind}`}</li>)}</ul></div> : null}
          </section>

          <section aria-labelledby="decision-title">
            <h3 id="decision-title" className="text-base font-semibold text-foreground">5. Decisão humana</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="comparison-decision" className="text-sm font-medium text-foreground">Conclusão</label><select id="comparison-decision" className={field} value={decisionKind} onChange={(event) => { const value = event.target.value as LandingPageDraftComparisonDecision["kind"]; setDecisionKind(value); if (value === "insufficient_evidence") setRecommendedAlias(""); }}><option value="insufficient_evidence">Evidência insuficiente</option><option value="recommendation">Confirmar recomendação específica</option></select></div>
              {decisionKind === "recommendation" ? <div><label htmlFor="comparison-recommendation" className="text-sm font-medium text-foreground">Configuração recomendada</label><select id="comparison-recommendation" className={field} value={recommendedAlias} onChange={(event) => setRecommendedAlias(event.target.value)}><option value="">Selecione</option>{successfulResults.filter((result) => evaluations[result.alias]?.validity === "valid").map((result) => <option key={result.alias} value={result.alias}>{result.alias} · {result.configuration.model} + {effortLabel(result.configuration.reasoningEffort)}</option>)}</select></div> : null}
            </div>
            <div className="mt-4"><label htmlFor="comparison-rationale" className="text-sm font-medium text-foreground">Motivo e trade-offs observados</label><textarea id="comparison-rationale" className={`${field} min-h-24`} value={rationale} maxLength={1200} onChange={(event) => setRationale(event.target.value)} /></div>
            <div className="mt-4"><label htmlFor="comparison-limitations" className="text-sm font-medium text-foreground">Limitações</label><textarea id="comparison-limitations" className={`${field} min-h-20`} value={limitations} maxLength={1200} onChange={(event) => setLimitations(event.target.value)} /></div>
          </section>

          <section aria-labelledby="summary-title">
            <h3 id="summary-title" className="text-base font-semibold text-foreground">6. Resumo transitório</h3>
            {summary ? <><textarea className={`${field} min-h-64 font-mono text-xs`} readOnly value={summary} aria-label="Resumo copiável da comparação" /><button type="button" className={`${primaryButton} mt-3`} onClick={copySummary} disabled={pending}>Copiar resumo</button></> : <p className="mt-2 text-sm text-muted-foreground">Informe uma conclusão e o motivo para gerar o resumo antes de recarregar a página.</p>}
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ResultCard({
  result,
  evaluation,
  evaluationRegistered,
  revealed,
  disabled,
  onEvaluationChange,
  onRegister,
}: Readonly<{
  result: LandingPageDraftComparisonResult;
  evaluation: EvaluationDraft;
  evaluationRegistered: boolean;
  revealed: boolean;
  disabled: boolean;
  onEvaluationChange: (patch: Partial<EvaluationDraft>) => void;
  onRegister: () => void;
}>) {
  const fieldId = result.alias.toLowerCase().replaceAll(" ", "-");
  return (
    <article className="min-w-0 rounded-lg border border-border bg-background p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3"><h4 className="font-semibold text-foreground">{result.alias}</h4><AdminStatusBadge tone={result.attempt.ok ? "neutral" : "danger"}>{result.attempt.ok ? "Gerado" : "Erro isolado"}</AdminStatusBadge></div>
      {result.attempt.ok ? <div className="mt-4 space-y-4">{result.attempt.projection.map((section, index) => <section key={`${section.kind}-${index}`} className="rounded-md border border-border p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</p>{section.lines.map((line, lineIndex) => <p key={lineIndex} className="mt-2 text-sm leading-6 text-foreground">{line}</p>)}</section>)}</div> : <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">Este resultado falhou com o estado <span className="font-mono text-xs">{result.attempt.kind}</span>. Os demais permanecem válidos para avaliação.</p>}
      {result.attempt.ok ? <fieldset className="mt-5 space-y-4 border-t border-border pt-4" disabled={disabled || revealed}><legend className="text-sm font-semibold text-foreground">Régua humana</legend><div className="grid gap-3 sm:grid-cols-3"><div><label htmlFor={`${fieldId}-validity`} className="text-xs font-medium text-foreground">Validade</label><select id={`${fieldId}-validity`} className={field} value={evaluation.validity} onChange={(event) => onEvaluationChange({ validity: event.target.value as EvaluationDraft["validity"] })}><option value="valid">Válido</option><option value="invalid">Inválido</option></select></div><div><label htmlFor={`${fieldId}-quality`} className="text-xs font-medium text-foreground">Qualidade</label><select id={`${fieldId}-quality`} className={field} value={evaluation.quality} onChange={(event) => onEvaluationChange({ quality: Number(event.target.value) as EvaluationDraft["quality"] })}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></div><div><label htmlFor={`${fieldId}-correction`} className="text-xs font-medium text-foreground">Correção humana</label><select id={`${fieldId}-correction`} className={field} value={evaluation.correction} onChange={(event) => onEvaluationChange({ correction: event.target.value as EvaluationDraft["correction"] })}><option value="none">Nenhuma</option><option value="light">Leve</option><option value="substantial">Substancial</option></select></div></div><div><label htmlFor={`${fieldId}-comment`} className="text-xs font-medium text-foreground">Comentário opcional</label><textarea id={`${fieldId}-comment`} className={`${field} min-h-20`} maxLength={800} value={evaluation.comment} onChange={(event) => onEvaluationChange({ comment: event.target.value })} /></div><button type="button" className={secondaryButton} onClick={onRegister}>{evaluationRegistered ? "Avaliação registrada" : "Registrar avaliação"}</button></fieldset> : null}
      {revealed ? <div className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><p className="font-semibold">{result.configuration.model} + {effortLabel(result.configuration.reasoningEffort)}{result.configuration.baseline ? " · baseline" : ""}</p><p className="mt-1 text-xs">{result.configuration.source} · {result.configuration.revision}</p>{result.attempt.ok ? <p className="mt-2 text-xs">Latência: {result.attempt.latencyMs} ms · input: {metric(result.attempt.usage.inputTokens)} · cached: {metric(result.attempt.usage.cachedInputTokens)} · output: {metric(result.attempt.usage.outputTokens)} · reasoning: {metric(result.attempt.usage.reasoningTokens)}</p> : null}<p className="mt-2 text-xs font-semibold">Custo não confirmado.</p></div> : null}
    </article>
  );
}

function initialEvaluation(): EvaluationDraft {
  return { validity: "valid", quality: 3, correction: "none", comment: "" };
}

function effortLabel(value: OpenAiReasoningEffort) {
  return { none: "Nenhum", low: "Baixo", medium: "Médio", high: "Alto", xhigh: "Extra-alto", max: "Máximo" }[value];
}

function metric(value: number | null) {
  return value === null ? "indisponível" : String(value);
}
