"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminGenerationProfile,
  AdminGenerationProfileTaxon,
  GenerationProfileGapDecision,
  GenerationProfileLifecycleReadiness,
  GenerationProfileProposal,
  GenerationProfileRecommendationInput,
} from "@/conversion-content/landing-page/generation-profile";
import {
  applyGenerationProfileCandidate,
  receiveGenerationProfileProposal,
} from "@/conversion-content/landing-page/generation-profile/editor-assistance";
import {
  activateGenerationProfileAction,
  archiveGenerationProfileAction,
  discardGenerationProfileProposalAction,
  proposeGenerationProfileAction,
  saveGenerationProfileAction,
} from "../actions";

type Feedback = { tone: "success" | "error" | "warning"; message: string } | null;
type EditableRecommendation = GenerationProfileRecommendationInput & { editorKey: string };
type AppliedProposalContext = Readonly<{
  decision?: GenerationProfileGapDecision;
  candidate: GenerationProfileProposal;
}> | null;

export function GenerationProfileEditor({ taxon, profiles, aiConfigured, researchAvailability, lifecycle }: {
  taxon: AdminGenerationProfileTaxon;
  profiles: readonly AdminGenerationProfile[];
  aiConfigured: boolean;
  researchAvailability: { available: boolean; reason: string | null };
  lifecycle: GenerationProfileLifecycleReadiness;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const draft = profiles.find((profile) => profile.status === "draft") ?? null;
  const active = profiles.find((profile) => profile.status === "active") ?? null;
  const seed = draft ?? active;
  const [draftMeta, setDraftMeta] = useState(draft ? { id: draft.id, updatedAt: draft.updatedAt, version: draft.version } : null);
  const [generationGuidance, setGenerationGuidance] = useState(seed?.generationGuidance ?? "");
  const [recommendations, setRecommendations] = useState<EditableRecommendation[]>(
    seed ? seed.recommendations.map((item, index) => ({ ...item, editorKey: `${seed.id}-${index}` })) : [],
  );
  const [savedEditorState, setSavedEditorState] = useState(() => serializeEditorState(seed?.generationGuidance ?? "", seed?.recommendations ?? []));
  const [humanFeedback, setHumanFeedback] = useState("");
  const [candidate, setCandidate] = useState<GenerationProfileProposal | null>(null);
  const [candidateGapDecision, setCandidateGapDecision] = useState<GenerationProfileGapDecision | "">("");
  const [appliedProposalContext, setAppliedProposalContext] = useState<AppliedProposalContext>(null);
  const [persistedGapDecision, setPersistedGapDecision] = useState<GenerationProfileGapDecision | null>(draft?.lastGapDecision ?? null);
  const [proposal, setProposal] = useState<{ requestId: string; fingerprint: string } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [manualEditorVisible, setManualEditorVisible] = useState(draft !== null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const recommendationPayload = recommendations.map(({ editorKey: _editorKey, ...item }) => item);
  const currentEditor = { generationGuidance, recommendations: recommendationPayload };
  const hasUnsavedChanges = proposal !== null || serializeEditorState(generationGuidance, recommendationPayload) !== savedEditorState;
  const aiAvailable = aiConfigured && researchAvailability.available;
  const aiUnavailableReason = !aiConfigured
    ? "Assistencia indisponivel: verifique a configuracao server-side da OpenAI. O fluxo manual continua completo."
    : researchAvailability.reason;
  const activationBlockedByGaps = (appliedProposalContext?.decision ?? persistedGapDecision) === "wait_for_modules";
  const editorLockedByCandidate = candidate !== null;

  function announce(next: Feedback) {
    setFeedback(next);
    queueMicrotask(() => feedbackRef.current?.focus());
  }

  function updateRecommendation(index: number, patch: Partial<GenerationProfileRecommendationInput>) {
    setRecommendations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function requestProposal() {
    startTransition(async () => {
      const result = await proposeGenerationProfileAction({
        taxonId: taxon.id,
        currentEditor,
        ...(candidate ? { currentCandidate: candidate } : {}),
        humanFeedback,
      });
      const transition = receiveGenerationProfileProposal({
        currentEditor,
        currentDirty: hasUnsavedChanges,
        currentCandidate: candidate,
        result,
      });
      if (!transition.received) {
        if (!result.ok) announce({ tone: result.error.code === "missing_information" ? "warning" : "error", message: `${result.error.code}: ${result.error.message}` });
        return;
      }
      setCandidate(transition.candidate);
      setCandidateGapDecision("");
      announce({ tone: "success", message: candidate ? "Proposta refinada recebida; o editor original foi preservado." : "Proposta candidata recebida; revise o diff antes de aplicar." });
    });
  }

  function applyCandidate() {
    if (!candidate || (candidate.gaps.length > 0 && !candidateGapDecision)) return;
    const transition = applyGenerationProfileCandidate({ currentEditor, candidate });
    const existingKeys = new Map(recommendations.map((item) => [item.moduleKey, item.editorKey]));
    setRecommendations(transition.editor.recommendations.map((item) => ({
      ...item,
      editorKey: existingKeys.get(item.moduleKey) ?? crypto.randomUUID(),
    })));
    setProposal(transition.proposal);
    setAppliedProposalContext({
      candidate,
      ...(candidate.gaps.length > 0 ? { decision: candidateGapDecision as GenerationProfileGapDecision } : {}),
    });
    setCandidate(null);
    setCandidateGapDecision("");
    setManualEditorVisible(true);
    announce({ tone: "warning", message: "Proposta aplicada somente ao editor. Salve o rascunho para persistir as recomendacoes." });
  }

  function discardCandidate() {
    if (!candidate) return;
    startTransition(async () => {
      await discardGenerationProfileProposalAction({ taxonId: taxon.id, requestId: candidate.requestId });
      setCandidate(null);
      setCandidateGapDecision("");
      announce({ tone: "warning", message: "Proposta candidata descartada; o editor original foi preservado." });
    });
  }

  function saveDraft() {
    if (editorLockedByCandidate) return;
    startTransition(async () => {
      const result = await saveGenerationProfileAction({
        ownerTaxonId: taxon.id,
        ...(draftMeta ? { profileId: draftMeta.id, expectedUpdatedAt: draftMeta.updatedAt } : {}),
        ...(generationGuidance.trim() ? { generationGuidance } : {}),
        recommendations: recommendationPayload,
        origin: proposal ? "ai" : "manual",
        ...(proposal ? { requestId: proposal.requestId, proposalFingerprint: proposal.fingerprint } : {}),
        ...(appliedProposalContext ? {
          gapAnalysisCompleted: true,
          gapItemKeys: appliedProposalContext.candidate.gaps.map((gap) => gap.itemKey),
          researchVersions: appliedProposalContext.candidate.researchVersions,
          ...(appliedProposalContext.decision ? {
            gapDecision: appliedProposalContext.decision,
            gapImpactSummary: appliedProposalContext.candidate.gaps.map((gap) => gap.impact).join("; "),
          } : {}),
        } : {}),
      });
      if (!result.ok) {
        announce({ tone: "error", message: `${result.error.code}: ${result.error.message}` });
        return;
      }
      setDraftMeta({ id: result.profileId, version: result.version, updatedAt: result.updatedAt });
      setSavedEditorState(serializeEditorState(generationGuidance, recommendationPayload));
      setProposal(null);
      setPersistedGapDecision(appliedProposalContext ? appliedProposalContext.decision ?? null : persistedGapDecision);
      setAppliedProposalContext(null);
      announce({ tone: "success", message: `Draft v${result.version} salvo.` });
      router.refresh();
    });
  }

  function activateDraft() {
    if (!draftMeta || hasUnsavedChanges || candidate || activationBlockedByGaps || !window.confirm(`Aprovar e ativar a versao ${draftMeta.version}?`)) return;
    startTransition(async () => {
      const result = await activateGenerationProfileAction({ taxonId: taxon.id, profileId: draftMeta.id, expectedUpdatedAt: draftMeta.updatedAt });
      if (!result.ok) return announce({ tone: "error", message: `${result.error.code}: ${result.error.message}` });
      setDraftMeta(null);
      setAppliedProposalContext(null);
      setPersistedGapDecision(null);
      announce({ tone: "success", message: `Versao ${result.version} aprovada e ativada.` });
      router.refresh();
    });
  }

  function archiveProfile(profile: AdminGenerationProfile) {
    if (!window.confirm(`Arquivar a versao ${profile.version} (${profile.status})?`)) return;
    startTransition(async () => {
      const result = await archiveGenerationProfileAction({ taxonId: taxon.id, profileId: profile.id, expectedUpdatedAt: profile.updatedAt });
      if (!result.ok) return announce({ tone: "error", message: `${result.error.code}: ${result.error.message}` });
      if (draftMeta?.id === profile.id) setDraftMeta(null);
      announce({ tone: "success", message: `Versao ${result.version} arquivada.` });
      router.refresh();
    });
  }

  const proposalDiff = candidate?.diff.recommendations ?? [];
  const replacements = candidate?.diff.replacements ?? [];
  const gapDiff = candidate?.diff.gaps ?? { added: [], resolved: [] };
  const aiActionLabel = candidate ? "Refinar novamente com IA" : active ? "Evoluir perfil com IA" : "Criar perfil com IA";

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
    <section className="space-y-5 rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
        <h2 className="font-semibold">{active ? "Evolua a estrutura do perfil" : "Crie a estrutura do perfil"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {active
            ? `A IA reavalia o active v${active.version} contra as fontes vigentes antes de propor qualquer alteracao.`
            : "A IA usa lp_sections e o catalogo autorizado para preparar a estrutura inicial antes da edicao tecnica."}
        </p>
        <div className="mt-4">
          <label className="text-sm font-medium" htmlFor="human-feedback">Feedback humano mais recente para a IA</label>
          <Textarea id="human-feedback" value={humanFeedback} onChange={(event) => setHumanFeedback(event.target.value)} disabled={pending || !aiAvailable} />
          <p className="mt-1 text-xs text-muted-foreground">{aiAvailable ? "Uma acao explicita realiza uma unica chamada paga; nao ha retry automatico." : aiUnavailableReason}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={requestProposal} disabled={pending || !aiAvailable}>{aiActionLabel}</Button>
          {!manualEditorVisible && <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => setManualEditorVisible(true)} disabled={pending}>Editar manualmente</Button>}
        </div>
      </div>

      {candidate && <CandidateReview candidate={candidate} diff={proposalDiff} replacements={replacements} gapDiff={gapDiff} gapDecision={candidateGapDecision} onGapDecision={setCandidateGapDecision} onApply={applyCandidate} onDiscard={discardCandidate} pending={pending} />}

      <div ref={feedbackRef} tabIndex={-1} aria-live="polite" className={feedback ? `rounded-md border p-3 text-sm ${feedback.tone === "error" ? "border-red-200 bg-red-50 text-red-700" : feedback.tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-green-200 bg-green-50 text-green-700"}` : "sr-only"}>{feedback?.message ?? "Sem feedback."}</div>

      {manualEditorVisible && <>
      {editorLockedByCandidate && <p id="editor-candidate-lock" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">O editor esta temporariamente bloqueado enquanto a proposta candidata e o diff estao em revisao. Aplique ou descarte a proposta para voltar a editar.</p>}
      <fieldset disabled={editorLockedByCandidate} aria-describedby={editorLockedByCandidate ? "editor-candidate-lock" : undefined} className="min-w-0 space-y-5 border-0 p-0">
      <legend className="sr-only">Editor do perfil</legend>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Editor do perfil</h2>
          <p className="text-sm text-muted-foreground">{draftMeta ? `Editando draft v${draftMeta.version}` : active ? `Nova versao baseada integralmente no active v${active.version}; nada foi persistido.` : "Nova versao ainda nao persistida"}</p>
        </div>
        <AdminStatusBadge tone={draftMeta ? "warning" : "neutral"}>{draftMeta ? "draft" : "novo"}</AdminStatusBadge>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="generation-guidance">Orientacao geral (opcional e humana)</label>
        <Textarea id="generation-guidance" value={generationGuidance} onChange={(event) => setGenerationGuidance(event.target.value)} disabled={pending} aria-describedby="guidance-help" />
        <p id="guidance-help" className="mt-1 text-xs text-muted-foreground">A IA nao preenche nem modifica este campo.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Recomendacoes</h3>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => setRecommendations((current) => [...current, { editorKey: crypto.randomUUID(), moduleKey: "", moduleVersion: 1, priority: "P2", recommendedOrder: (current.length + 1) * 10 }])} disabled={pending}>Adicionar manualmente</Button>
        </div>
        {recommendations.map((item, index) => <fieldset className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-2" key={item.editorKey}>
          <legend className="px-1 text-xs font-medium">Recomendacao {index + 1}</legend>
          <Field label="Modulo"><Input value={item.moduleKey} onChange={(event) => updateRecommendation(index, { moduleKey: event.target.value })} disabled={pending} /></Field>
          <Field label="Versao do modulo"><Input type="number" min={1} value={item.moduleVersion} onChange={(event) => updateRecommendation(index, { moduleVersion: Number(event.target.value) })} disabled={pending} /></Field>
          <Field label="Variante (opcional)"><Input value={item.variantKey ?? ""} onChange={(event) => updateRecommendation(index, { variantKey: event.target.value || undefined })} disabled={pending} /></Field>
          <Field label="Versao da variante"><Input type="number" min={1} value={item.variantVersion ?? ""} onChange={(event) => updateRecommendation(index, { variantVersion: event.target.value ? Number(event.target.value) : undefined })} disabled={pending} /></Field>
          <Field label="Prioridade"><Select value={item.priority} onChange={(event) => updateRecommendation(index, { priority: event.target.value as "P1" | "P2" | "P3" })} disabled={pending}><option>P1</option><option>P2</option><option>P3</option></Select></Field>
          <Field label="Ordem"><Input type="number" min={1} value={item.recommendedOrder} onChange={(event) => updateRecommendation(index, { recommendedOrder: Number(event.target.value) })} disabled={pending} /></Field>
          <div className="md:col-span-2"><Field label="Orientacao especifica (opcional e humana)"><Textarea value={item.itemGuidance ?? ""} onChange={(event) => updateRecommendation(index, { itemGuidance: event.target.value || undefined })} disabled={pending} /></Field></div>
          <Button className="w-fit bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => setRecommendations((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={pending}>Remover recomendacao</Button>
        </fieldset>)}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-3">
          <Button onClick={saveDraft} disabled={pending || !lifecycle.ready}>Salvar rascunho</Button>
          <Button className="bg-green-700 text-white hover:bg-green-800" onClick={activateDraft} disabled={pending || !lifecycle.ready || !draftMeta || hasUnsavedChanges || candidate !== null || activationBlockedByGaps}>Aprovar e ativar</Button>
        </div>
        {!lifecycle.ready && <p className="text-sm text-amber-700">Acoes de lifecycle indisponiveis: {lifecycle.reason}</p>}
        {hasUnsavedChanges && <p className="text-sm text-amber-700">Salve o rascunho antes de aprovar e ativar</p>}
        {candidate && <p className="text-sm text-amber-700">Revise, aplique ou descarte a proposta candidata antes de ativar.</p>}
        {activationBlockedByGaps && <p className="text-sm text-red-700">Ativacao bloqueada: a decisao atual e aguardar a criacao dos modulos faltantes.</p>}
        {!draftMeta && <p className="text-sm text-muted-foreground">Aprovar e ativar indisponivel: salve primeiro uma versao draft.</p>}
      </div>
      </fieldset>
      </>}
    </section>

    <aside className="space-y-3">
      <h2 className="font-semibold">Versoes</h2>
      {profiles.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma versao persistida.</p> : profiles.map((profile) => <article key={profile.id} className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2"><span className="font-medium">v{profile.version}</span><AdminStatusBadge tone={profile.status === "active" ? "success" : profile.status === "draft" ? "warning" : "neutral"}>{profile.status}</AdminStatusBadge></div>
        <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{profile.generationGuidance ?? "Sem orientacao geral."}</p>
        {profile.status !== "archived" && <><Button className="mt-3 w-full bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => archiveProfile(profile)} disabled={pending || !lifecycle.ready}>Arquivar</Button>{!lifecycle.ready && <p className="mt-1 text-xs text-amber-700">Arquivar indisponivel: lifecycle ainda nao verificado.</p>}</>}
      </article>)}
    </aside>
  </div>;
}

function CandidateReview({ candidate, diff, replacements, gapDiff, gapDecision, onGapDecision, onApply, onDiscard, pending }: {
  candidate: GenerationProfileProposal;
  diff: readonly { moduleKey: string; status: "kept" | "added" | "changed" | "removed"; changes: readonly ("module_version" | "variant" | "priority" | "order")[] }[];
  replacements: readonly { fromModuleKey: string; toModuleKey: string; recommendedOrder: number }[];
  gapDiff: Readonly<{ added: GenerationProfileProposal["gaps"]; resolved: GenerationProfileProposal["gaps"] }>;
  gapDecision: GenerationProfileGapDecision | "";
  onGapDecision: (value: GenerationProfileGapDecision | "") => void;
  onApply: () => void;
  onDiscard: () => void;
  pending: boolean;
}) {
  return <section className="space-y-4 rounded-md border border-blue-200 bg-blue-50/50 p-4" aria-label="Proposta candidata">
    <div><h3 className="font-semibold">Proposta candidata</h3><p className="text-sm text-muted-foreground">A candidata e o diff sao transitórios; o editor ainda nao foi alterado.</p></div>
    <div><h4 className="text-sm font-semibold">Cobertura de lp_sections</h4><ul className="mt-2 space-y-3 text-sm">{candidate.coverage.map((item) => <li className="min-w-0 break-words" key={item.coverageId}><p><strong>{item.sectionName}</strong> — {item.status}</p><p><span className="font-medium">Identidades compatíveis:</span> {item.compatibleIdentities.map((identity) => identity.variantKey ?? identity.moduleKey).join(", ") || "nenhuma"}</p><p><span className="font-medium">Identidades escolhidas:</span> {item.selectedIdentities.map((identity) => identity.variantKey ?? identity.moduleKey).join(", ") || "nenhuma"}</p></li>)}</ul></div>
    <div><h4 className="text-sm font-semibold">Diff estrutural</h4><ul className="mt-2 flex flex-wrap gap-2">{diff.map((item) => <li key={item.moduleKey}><AdminStatusBadge tone={item.status === "removed" ? "danger" : item.status === "added" ? "success" : "neutral"}>{item.moduleKey}: {item.status}{item.changes.length > 0 ? ` (${item.changes.join(", ")})` : ""}</AdminStatusBadge></li>)}</ul><p className="mt-2 text-xs text-muted-foreground">Substituições: {replacements.map((item) => `${item.fromModuleKey} → ${item.toModuleKey} (ordem ${item.recommendedOrder})`).join(", ") || "nenhuma"}. Gaps novos: {gapDiff.added.map((gap) => gap.sectionName).join(", ") || "nenhum"}. Gaps resolvidos: {gapDiff.resolved.map((gap) => gap.sectionName).join(", ") || "nenhum"}.</p></div>
    {candidate.gaps.length > 0 && <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <h4 className="text-sm font-semibold">Gaps do catálogo vigente</h4>
      <ul className="space-y-1 text-sm">{candidate.gaps.map((gap) => <li key={gap.coverageId}><strong>{gap.sectionName}</strong> — prioridade {gap.sourcePriority}, ordem {gap.sourceOrder}: {gap.reason} Impacto: {gap.impact}</li>)}</ul>
      <label className="block text-sm font-medium">Decisão humana<Select value={gapDecision} onChange={(event) => onGapDecision(event.target.value as GenerationProfileGapDecision | "")} disabled={pending}><option value="">Selecione</option><option value="wait_for_modules">Aguardar criacao dos modulos</option><option value="proceed_with_available">Prosseguir com os disponiveis</option></Select></label>
    </div>}
    <div className="flex flex-wrap gap-2"><Button onClick={onApply} disabled={pending || (candidate.gaps.length > 0 && !gapDecision)}>Aplicar proposta</Button><Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={onDiscard} disabled={pending}>Descartar proposta</Button></div>
  </section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1 text-sm font-medium"><span>{label}</span>{children}</label>;
}

function serializeEditorState(generationGuidance: string, recommendations: readonly GenerationProfileRecommendationInput[]) {
  return JSON.stringify({ generationGuidance, recommendations });
}
