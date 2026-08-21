"use client";

import { useState } from "react";
import type {
  ConfirmInputCatalogEvaluationActionResult,
  InputCatalogEvaluationActionResult,
  InputCatalogEvaluationReference,
} from "../../actions";
import type {
  InputCatalogEvaluationCandidate as InputCatalogEvaluationPresentationCandidate,
  InputCatalogEvaluationMode as InputCatalogEvaluationPresentationMode,
  InputCatalogEvaluationOutput as InputCatalogEvaluationPresentationOutput,
} from "@/conversion-content/landing-page/taxon-preparation";

export type AdminTaxonInputCatalogEvaluationRuntimeProps = Readonly<{
  taxonId: string;
  reviewedVersion: number | null;
  evaluateAction: (input: Readonly<{
    taxonId: string;
    mode: InputCatalogEvaluationPresentationMode;
    focalHypothesis: string | null;
    feedback: Readonly<{
      text: string;
      previousOutput: InputCatalogEvaluationPresentationOutput;
      reference: InputCatalogEvaluationReference;
    }> | null;
  }>) => Promise<InputCatalogEvaluationActionResult>;
  confirmAction: (input: Readonly<{
    reference: InputCatalogEvaluationReference;
  }>) => Promise<ConfirmInputCatalogEvaluationActionResult>;
}>;

export type InputCatalogEvaluationPresentationState =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "result"; output: InputCatalogEvaluationPresentationOutput }>
  | Readonly<{ kind: "failure"; message: string }>;

export type AdminTaxonInputCatalogEvaluationProps = Readonly<{
  mode: InputCatalogEvaluationPresentationMode;
  hypothesis: string;
  hypothesisError?: string | null;
  state: InputCatalogEvaluationPresentationState;
  stale: boolean;
  administrativeDecisionPending?: boolean;
  administrativeDecisionFeedback?: Readonly<{
    kind: "success" | "failure";
    message: string;
  }> | null;
  onModeChange: (mode: InputCatalogEvaluationPresentationMode) => void;
  onHypothesisChange: (value: string) => void;
  onEvaluate: (input: Readonly<{
    mode: InputCatalogEvaluationPresentationMode;
    hypothesis: string | null;
    feedback: Readonly<{
      text: string;
      previousOutput: InputCatalogEvaluationPresentationOutput;
    }> | null;
  }>) => void;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  onConfirmAdministrativeSufficiency: () => void;
}>;

const modeContent: Record<
  InputCatalogEvaluationPresentationMode,
  Readonly<{ label: string; description: string }>
> = {
  systematic: {
    label: "Avaliação sistemática",
    description: "Procura gaps factuais materiais em toda a pesquisa autorizada.",
  },
  hypothesis: {
    label: "Hipótese focal",
    description: "Avalia uma necessidade factual específica indicada por você.",
  },
};

const statusContent: Record<
  InputCatalogEvaluationPresentationOutput["status"],
  Readonly<{ label: string; className: string }>
> = {
  sufficient: {
    label: "Catálogo possivelmente suficiente",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  candidate_gaps: {
    label: "Gaps candidatos para revisão",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  inconclusive: {
    label: "Avaliação inconclusiva",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
};

const originLabels: Record<InputCatalogEvaluationPresentationCandidate["origin"], string> = {
  systematic: "Achado sistemático",
  human_hypothesis: "Hipótese humana",
  incidental: "Achado incidental",
};

const conclusionLabels: Record<InputCatalogEvaluationPresentationCandidate["conclusion"], string> = {
  covered: "Coberto pelo catálogo atual",
  refine_existing_field: "Possível refinamento de field",
  possible_new_field: "Possível novo field",
  inconclusive: "Candidato inconclusivo",
};

export function AdminTaxonInputCatalogEvaluationRuntime({
  taxonId,
  reviewedVersion,
  evaluateAction,
  confirmAction,
}: AdminTaxonInputCatalogEvaluationRuntimeProps) {
  const [mode, setMode] = useState<InputCatalogEvaluationPresentationMode>("systematic");
  const [hypothesis, setHypothesis] = useState("");
  const [feedback, setFeedback] = useState("");
  const [state, setState] = useState<InputCatalogEvaluationPresentationState>({ kind: "idle" });
  const [reference, setReference] = useState<InputCatalogEvaluationReference | null>(null);
  const [stale, setStale] = useState(false);
  const [decisionPending, setDecisionPending] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<
    Readonly<{ kind: "success" | "failure"; message: string }> | null
  >(null);

  async function evaluate(input: Readonly<{
    mode: InputCatalogEvaluationPresentationMode;
    hypothesis: string | null;
    feedback: Readonly<{
      text: string;
      previousOutput: InputCatalogEvaluationPresentationOutput;
    }> | null;
  }>) {
    const feedbackInput = input.feedback && reference
      ? { ...input.feedback, reference }
      : null;
    setState({ kind: "loading" });
    setReference(null);
    setStale(false);
    setDecisionFeedback(null);
    let result: InputCatalogEvaluationActionResult;
    try {
      result = await evaluateAction({
        taxonId,
        mode: input.mode,
        focalHypothesis: input.hypothesis,
        feedback: feedbackInput,
      });
    } catch {
      setState({
        kind: "failure",
        message: "A comunicação com o servidor falhou. Nenhuma suficiência foi registrada.",
      });
      return;
    }
    if (!result.ok) {
      setState({ kind: "failure", message: result.message });
      return;
    }
    setReference(result.reference);
    setState({ kind: "result", output: result.output });
    setFeedback("");
  }

  async function confirm() {
    if (!reference) return;
    setDecisionPending(true);
    setDecisionFeedback(null);
    let result: ConfirmInputCatalogEvaluationActionResult;
    try {
      result = await confirmAction({ reference });
    } catch {
      setDecisionPending(false);
      setDecisionFeedback({
        kind: "failure",
        message: "A comunicação com o servidor falhou. A decisão não foi confirmada.",
      });
      return;
    }
    setDecisionPending(false);
    if (!result.ok) {
      if (result.stale) setStale(true);
      setDecisionFeedback({ kind: "failure", message: result.message });
      return;
    }
    setDecisionFeedback({
      kind: "success",
      message: `Versão E20.2 ${result.reviewedVersion} confirmada por decisão administrativa.`,
    });
  }

  if (reviewedVersion === null) {
    return (
      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold text-card-foreground">
          Avaliação factual do catálogo E20.2
        </h2>
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Defina explicitamente uma versão executável E20.2 no registro administrativo antes de iniciar a avaliação.
        </p>
      </section>
    );
  }

  return (
    <AdminTaxonInputCatalogEvaluation
      administrativeDecisionFeedback={decisionFeedback}
      administrativeDecisionPending={decisionPending}
      feedback={feedback}
      hypothesis={hypothesis}
      mode={mode}
      onConfirmAdministrativeSufficiency={confirm}
      onEvaluate={evaluate}
      onFeedbackChange={setFeedback}
      onHypothesisChange={(value) => {
        setHypothesis(value);
        setFeedback("");
        if (state.kind === "result") setStale(true);
      }}
      onModeChange={(value) => {
        setMode(value);
        setFeedback("");
        if (state.kind === "result") setStale(true);
      }}
      stale={stale}
      state={state}
    />
  );
}

const taxonomyLayerLabels: Record<
  NonNullable<InputCatalogEvaluationPresentationCandidate["suggestedTaxonomyLayer"]>,
  string
> = {
  universal: "Universal",
  segment: "Segmento",
  niche: "Nicho",
  ultra_niche: "Ultranicho",
};

export function AdminTaxonInputCatalogEvaluation({
  mode,
  hypothesis,
  hypothesisError = null,
  state,
  stale,
  administrativeDecisionPending = false,
  administrativeDecisionFeedback = null,
  feedback,
  onModeChange,
  onHypothesisChange,
  onEvaluate,
  onFeedbackChange,
  onConfirmAdministrativeSufficiency,
}: AdminTaxonInputCatalogEvaluationProps) {
  const isLoading = state.kind === "loading";
  const output = state.kind === "result" ? state.output : null;
  const isInconclusive = output?.status === "inconclusive";
  const modeMismatch = output !== null && output.mode !== mode;
  const resultInvalid = stale || modeMismatch;
  const normalizedHypothesis = hypothesis.trim();
  const normalizedFeedback = feedback.trim();
  const displayedHypothesisError = mode === "hypothesis"
    ? hypothesisError ?? (normalizedHypothesis ? null : "Descreva uma hipótese factual focal para avaliar.")
    : null;
  const canRefine =
    output !== null &&
    !resultInvalid &&
    output.followUpQuestion !== null;
  const feedbackError = canRefine && !normalizedFeedback
    ? "Responda à solicitação factual antes de reavaliar."
    : null;
  const evaluationBlocked =
    isLoading ||
    (mode === "hypothesis" && displayedHypothesisError !== null) ||
    feedbackError !== null;
  const administrativeDecisionBlocked =
    resultInvalid ||
    state.kind !== "result" ||
    isInconclusive ||
    administrativeDecisionPending;
  const administrativeBlockReason = getAdministrativeBlockReason({
    administrativeDecisionPending,
    modeMismatch,
    stale,
    state,
  });

  return (
    <section
      aria-labelledby="input-catalog-evaluation-title"
      className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-card"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Checkpoint de integração final
        </p>
        <h2
          className="mt-1 text-lg font-semibold text-card-foreground"
          id="input-catalog-evaluation-title"
        >
          Avaliação factual do catálogo E20.2
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A avaliação é uma recomendação não autoritativa. Ela não altera fields, catálogo ou suficiência.
        </p>
      </div>

      <fieldset className="mt-5 min-w-0">
        <legend className="text-sm font-semibold text-foreground">Modo de avaliação</legend>
        <p className="mt-1 text-sm text-muted-foreground" id="input-catalog-evaluation-mode-instruction">
          Escolha uma leitura integral ou concentre a avaliação em uma hipótese humana.
        </p>
        <div
          aria-describedby="input-catalog-evaluation-mode-instruction"
          className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2"
        >
          {(Object.keys(modeContent) as InputCatalogEvaluationPresentationMode[]).map((candidateMode) => {
            const content = modeContent[candidateMode];
            const active = mode === candidateMode;

            return (
              <label
                className={`flex min-h-11 min-w-0 cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition focus-within:ring-4 focus-within:ring-brand-600/20 ${
                  active
                    ? "border-brand-600 bg-brand-600/5 text-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted/50"
                }`}
                key={candidateMode}
              >
                <input
                  checked={active}
                  className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
                  disabled={isLoading}
                  name="input-catalog-evaluation-mode"
                  onChange={() => onModeChange(candidateMode)}
                  type="radio"
                  value={candidateMode}
                />
                <span className="min-w-0">
                  <span className="block font-medium">{content.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {content.description}
                  </span>
                  {active ? (
                    <span className="mt-2 block text-xs font-semibold text-brand-600">Modo ativo</span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {mode === "hypothesis" ? (
        <div className="mt-5 min-w-0">
          <label
            className="text-sm font-semibold text-foreground"
            htmlFor="input-catalog-evaluation-hypothesis"
          >
            Hipótese focal
          </label>
          <p className="mt-1 text-sm text-muted-foreground" id="input-catalog-evaluation-hypothesis-instruction">
            Descreva uma necessidade factual por execução. Não inclua prompts, pesquisa integral ou dados sensíveis.
          </p>
          <textarea
            aria-describedby={`input-catalog-evaluation-hypothesis-instruction${
              displayedHypothesisError ? " input-catalog-evaluation-hypothesis-error" : ""
            }`}
            aria-invalid={displayedHypothesisError ? true : undefined}
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-border bg-background p-3 text-sm text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-60"
            disabled={isLoading}
            id="input-catalog-evaluation-hypothesis"
            maxLength={2000}
            onChange={(event) => onHypothesisChange(event.currentTarget.value)}
            placeholder="Ex.: Para este ultranicho, precisamos compreender..."
            required
            value={hypothesis}
          />
          {displayedHypothesisError ? (
            <p
              className="mt-2 text-sm text-red-700"
              id="input-catalog-evaluation-hypothesis-error"
              role="alert"
            >
              {displayedHypothesisError}
            </p>
          ) : null}
        </div>
      ) : null}

      {canRefine ? (
        <div className="mt-5 min-w-0">
          <label
            className="text-sm font-semibold text-foreground"
            htmlFor="input-catalog-evaluation-feedback"
          >
            Resposta para refinamento
          </label>
          <p
            className="mt-1 text-sm text-muted-foreground"
            id="input-catalog-evaluation-feedback-instruction"
          >
            {output.followUpQuestion}
          </p>
          <textarea
            aria-describedby={`input-catalog-evaluation-feedback-instruction${
              feedbackError ? " input-catalog-evaluation-feedback-error" : ""
            }`}
            aria-invalid={feedbackError ? true : undefined}
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-border bg-background p-3 text-sm text-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-60"
            disabled={isLoading}
            id="input-catalog-evaluation-feedback"
            maxLength={2000}
            onChange={(event) => onFeedbackChange(event.currentTarget.value)}
            placeholder="Responda somente com a informação factual solicitada."
            required
            value={feedback}
          />
          {feedbackError ? (
            <p
              className="mt-2 text-sm text-red-700"
              id="input-catalog-evaluation-feedback-error"
              role="alert"
            >
              {feedbackError}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        disabled={evaluationBlocked}
        onClick={() => onEvaluate({
          mode,
          hypothesis: mode === "hypothesis" ? normalizedHypothesis : null,
          feedback: canRefine && output
            ? { text: normalizedFeedback, previousOutput: output }
            : null,
        })}
        type="button"
      >
        {isLoading
          ? "Avaliando..."
          : canRefine
            ? "Reavaliar com feedback"
            : stale || state.kind === "failure"
              ? "Executar nova avaliação"
              : "Executar avaliação"}
      </button>

      <div
        aria-atomic="true"
        aria-busy={isLoading}
        aria-live="polite"
        className="mt-6 min-w-0"
      >
        {stale ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <p className="font-semibold">Resultado desatualizado</p>
            <p className="mt-1">
              As fontes mudaram desde a avaliação. Execute novamente antes de qualquer decisão administrativa.
            </p>
          </div>
        ) : null}

        {!stale && modeMismatch ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <p className="font-semibold">O modo ativo mudou</p>
            <p className="mt-1">
              Este resultado pertence a outro modo. Execute novamente antes de qualquer decisão administrativa.
            </p>
          </div>
        ) : null}

        {state.kind === "idle" ? (
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground" role="status">
            Nenhuma avaliação executada nesta sessão.
          </div>
        ) : null}

        {state.kind === "loading" ? (
          <div className="rounded-md border border-brand-600/30 bg-brand-600/5 px-4 py-3 text-sm text-foreground" role="status">
            <p className="font-semibold">Avaliação em andamento</p>
            <p className="mt-1 text-muted-foreground">
              Aguarde a validação do resultado antes de tomar uma decisão administrativa.
            </p>
          </div>
        ) : null}

        {state.kind === "failure" ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <p className="font-semibold">Não foi possível concluir a avaliação</p>
            <p className="mt-1 break-words">{state.message}</p>
            <p className="mt-1">Nenhuma suficiência foi registrada. Tente novamente por ação explícita.</p>
          </div>
        ) : null}

        {output ? <EvaluationResult invalidForDecision={resultInvalid} output={output} /> : null}
      </div>

      <div
        aria-describedby="input-catalog-administrative-decision-description"
        className="mt-6 min-w-0 rounded-md border-2 border-border bg-background p-4"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ação humana separada
        </p>
        <h3 className="mt-1 text-base font-semibold text-foreground">Decisão administrativa</h3>
        <p className="mt-1 text-sm text-muted-foreground" id="input-catalog-administrative-decision-description">
          Confirmar suficiência é uma decisão explícita do administrador. A recomendação acima nunca executa esta ação.
        </p>
        {administrativeBlockReason ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" id="input-catalog-administrative-decision-blocker">
            {administrativeBlockReason}
          </p>
        ) : null}
        <button
          aria-describedby={administrativeBlockReason ? "input-catalog-administrative-decision-blocker" : undefined}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={administrativeDecisionBlocked}
          onClick={onConfirmAdministrativeSufficiency}
          type="button"
        >
          {administrativeDecisionPending ? "Registrando decisão..." : "Confirmar suficiência administrativamente"}
        </button>
        {administrativeDecisionFeedback ? (
          <p
            className={`mt-3 text-sm ${
              administrativeDecisionFeedback.kind === "success" ? "text-emerald-800" : "text-red-700"
            }`}
            role={administrativeDecisionFeedback.kind === "failure" ? "alert" : "status"}
          >
            {administrativeDecisionFeedback.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function EvaluationResult({
  invalidForDecision,
  output,
}: Readonly<{
  invalidForDecision: boolean;
  output: InputCatalogEvaluationPresentationOutput;
}>) {
  const status = statusContent[output.status];

  return (
    <div className={`min-w-0 ${invalidForDecision ? "mt-3 opacity-70" : ""}`}>
      <div className={`rounded-md border px-4 py-3 ${status.className}`}>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="font-semibold">{status.label}</p>
          <span className="rounded-full border border-current/20 px-2 py-1 text-xs font-medium">
            {modeContent[output.mode].label}
          </span>
          {invalidForDecision ? (
            <span className="rounded-full border border-red-300 bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
              Inválido para decisão
            </span>
          ) : null}
        </div>
        <p className="mt-2 break-words text-sm leading-6">{output.summary}</p>
        <p className="mt-2 text-xs font-medium">
          Recomendação da IA para revisão humana; não constitui aprovação da E20.2.
        </p>
      </div>

      <div className="mt-4 min-w-0">
        <h3 className="text-base font-semibold text-foreground">Candidatos avaliados</h3>
        {output.candidates.length ? (
          <ol className="mt-3 grid min-w-0 gap-3">
            {output.candidates.map((candidate, index) => (
              <li className="min-w-0" key={`${candidate.origin}-${candidate.conclusion}-${index}`}>
                <CandidateCard candidate={candidate} position={index + 1} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Nenhum gap candidato foi apresentado neste resultado.
          </p>
        )}
      </div>

      {output.followUpQuestion ? (
        <div className="mt-4 rounded-md border border-brand-600/30 bg-brand-600/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Informação adicional solicitada</p>
          <p className="mt-1 break-words text-sm text-foreground">{output.followUpQuestion}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Responda por uma nova execução explícita; esta pergunta não registra decisão nem mantém conversa persistente.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CandidateCard({
  candidate,
  position,
}: Readonly<{
  candidate: InputCatalogEvaluationPresentationCandidate;
  position: number;
}>) {
  return (
    <article className="min-w-0 rounded-md border border-border bg-background p-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-foreground">Candidato {position}</h4>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
          {originLabels[candidate.origin]}
        </span>
        <span className="rounded-full border border-border px-2 py-1 text-xs font-medium text-foreground">
          {conclusionLabels[candidate.conclusion]}
        </span>
      </div>

      <Description label="Necessidade factual" value={candidate.factualNeed} />
      <Description label="Cobertura atual" value={candidate.currentCoverage} />
      {candidate.allegedInsufficiency ? (
        <Description label="Insuficiência alegada" value={candidate.allegedInsufficiency} />
      ) : null}
      <Description label="Evidência curta" value={candidate.evidence} />

      <dl className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
        <CompactDescription label="Fields relacionados">
          {candidate.relatedFields.length ? candidate.relatedFields.join(", ") : "Nenhum"}
        </CompactDescription>
        <CompactDescription label="Origem operacional esperada">
          {candidate.expectedOperationalSource ?? "Não informada"}
        </CompactDescription>
        <CompactDescription label="Consumidor real">
          {candidate.realConsumer ?? "Não informado"}
        </CompactDescription>
        <CompactDescription label="Prejuízo concreto">
          {candidate.concreteHarm ?? "Não informado"}
        </CompactDescription>
        <CompactDescription label="Camada taxonômica sugerida">
          {candidate.suggestedTaxonomyLayer
            ? taxonomyLayerLabels[candidate.suggestedTaxonomyLayer]
            : "Não sugerida"}
        </CompactDescription>
        <CompactDescription label="Incertezas">
          {candidate.uncertainties.length ? candidate.uncertainties.join("; ") : "Nenhuma declarada"}
        </CompactDescription>
      </dl>
    </article>
  );
}

function Description({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="mt-3 min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function CompactDescription({ label, children }: Readonly<{ label: string; children: string }>) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

function getAdministrativeBlockReason({
  administrativeDecisionPending,
  modeMismatch,
  stale,
  state,
}: Readonly<{
  administrativeDecisionPending: boolean;
  modeMismatch: boolean;
  stale: boolean;
  state: InputCatalogEvaluationPresentationState;
}>): string | null {
  if (administrativeDecisionPending) {
    return "A decisão administrativa está sendo registrada.";
  }
  if (stale) {
    return "Bloqueado: as fontes mudaram e invalidaram o resultado atual.";
  }
  if (modeMismatch) {
    return "Bloqueado: o resultado não corresponde ao modo de avaliação ativo.";
  }
  if (state.kind === "loading") {
    return "Bloqueado: aguarde a conclusão da avaliação.";
  }
  if (state.kind === "failure") {
    return "Bloqueado: a avaliação falhou e não produziu resultado válido.";
  }
  if (state.kind === "idle") {
    return "Bloqueado: execute uma avaliação válida antes de decidir.";
  }
  if (state.output.status === "inconclusive") {
    return "Bloqueado: um resultado inconclusivo não permite registrar suficiência.";
  }
  return null;
}
