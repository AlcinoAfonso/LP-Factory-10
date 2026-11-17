"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { OpenAiActiveCostFilters, OpenAiActiveCostReadModel } from "@/openai-costs/active-contracts";
import type { DialogueCostDetail, DialogueCostResult, DialogueListResult, OpenAiCostDialogue } from "@/openai-costs/dialogue-costs";
import { readDialogueCostAction } from "../actions";
import { OpenAiCostExecutionDetails } from "./OpenAiEconomicHierarchy";

export function OpenAiDialogueCosts({ result, active, filters }: Readonly<{
  result: DialogueListResult | null; active: OpenAiActiveCostReadModel | null; filters: OpenAiActiveCostFilters;
}>) {
  const dialogues = result?.ok ? result.dialogues.filter(dialogue =>
    filters.universe !== "lp_factory" && (!filters.accountId || dialogue.accountId === filters.accountId) &&
    (!filters.workload || (dialogue.workloads
      ? dialogue.workloads.includes(filters.workload)
      : active?.executions.some(e => e.accountId === dialogue.accountId && e.economicEvent?.kind === "niche_resolution" &&
        e.economicEvent.eventId === dialogue.dialogueId && e.workload === filters.workload)))) : [];
  return <section className="space-y-3" aria-labelledby="niche-dialogue-costs-title">
    <h2 id="niche-dialogue-costs-title" className="text-lg font-semibold text-foreground">Diálogos do Agente Nicho</h2>
    <p className="text-sm text-muted-foreground">Diálogos iniciados ou com operações vinculadas no período. Abrir consulta o diálogo completo, inclusive operações fora do período, sem alterar a reconciliação global.</p>
    {!result || !result.ok ? <p role="status" className="text-sm text-muted-foreground">Consulta de diálogos indisponível. Atualize os custos para tentar novamente.</p>
      : dialogues.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum diálogo encontrado para esta seleção.</p>
      : <div className="overflow-x-auto rounded-md border border-border"><table className="w-full text-left text-sm">
        <caption className="sr-only">Diálogos individuais do Agente Nicho</caption>
        <thead className="bg-muted"><tr>{["Diálogo", "Conta", "Ambiente", "Estado", "Custo completo", "Detalhe"].map(label => <th key={label} scope="col" className="px-3 py-2 font-medium">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">{dialogues.map(dialogue => <DialogueRow key={dialogue.dialogueId} dialogue={dialogue} active={active} />)}</tbody>
      </table></div>}
  </section>;
}

function DialogueRow({ dialogue, active }: Readonly<{ dialogue: OpenAiCostDialogue; active: OpenAiActiveCostReadModel | null }>) {
  const [result, setResult] = useState<DialogueCostResult | null>(null);
  const [pending, startTransition] = useTransition();
  const linked = active?.executions.filter(e => e.accountId === dialogue.accountId && e.economicEvent?.kind === "niche_resolution" && e.economicEvent.eventId === dialogue.dialogueId) ?? [];
  const accountName = dialogue.accountName ?? linked[0]?.accountName ?? "Conta " + dialogue.accountId.slice(0, 8);
  const environments = result?.ok ? result.value.executions.map(e => e.environment) : linked.map(e => e.environment);
  const query = () => startTransition(async () => {
    try { setResult(await readDialogueCostAction({ dialogueId: dialogue.dialogueId, accountId: dialogue.accountId })); }
    catch { setResult({ ok: false, code: "DIALOGUE_COST_UNAVAILABLE" }); }
  });
  return <Dialog.Root><tr>
    <td className="px-3 py-2"><span className="block font-medium">{originLabel(dialogue.origin)}</span><span className="block text-xs text-muted-foreground">{timestamp(dialogue.startedAt)} · {dialogue.dialogueId.slice(0, 8)}</span></td>
    <td className="max-w-48 break-words px-3 py-2">{accountName}</td>
    <td className="px-3 py-2">{[...new Set(environments)].map(environmentLabel).join(", ") || "Não registrado"}</td>
    <td className="px-3 py-2">{(result?.ok ? result.value.dialogue.endedAt : dialogue.endedAt) ? "Encerrado" : "Aberto"}</td>
    <td className="px-3 py-2">{pending ? "Consultando…" : result?.ok ? <><span className="block">{costLabel(result.value)}</span><span className="block text-xs text-muted-foreground">{result.value.calculatedCostUsd === null ? "Sem valor comprovado" : usd(result.value.calculatedCostUsd)}</span></> : result ? "Indisponível" : "Consultar"}</td>
    <td className="px-3 py-2"><Dialog.Trigger asChild><Button variant="secondary" className="min-h-11" onClick={query}>Abrir</Button></Dialog.Trigger></td>
  </tr>
  <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[94dvh] w-[calc(100%_-_1rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-background p-4 shadow-lg sm:p-5">
      <div className="sticky -top-4 z-10 flex items-start justify-between gap-3 border-b border-border bg-background py-2">
        <Dialog.Title className="text-lg font-semibold">{originLabel(dialogue.origin)} · {timestamp(dialogue.startedAt)}</Dialog.Title>
        <Dialog.Close asChild><Button variant="secondary" className="min-h-11">Fechar</Button></Dialog.Close>
      </div>
      <Dialog.Description className="my-3 text-sm text-muted-foreground">Todas as operações financeiras explicitamente vinculadas a este diálogo e conta, em todos os períodos. Valores em USD.</Dialog.Description>
      <p className="mb-3 break-all text-sm">{accountName} · Conta {dialogue.accountId}</p>
      {pending ? <p role="status" className="my-3 text-sm">Consultando o diálogo completo…</p> : result?.ok ? <DialogueCostDetailView detail={result.value} />
        : <p role="alert" className="my-3 text-sm">Custo indisponível. A consulta não pôde ser concluída; nenhum subtotal é apresentado como total.</p>}
      <Button variant="secondary" className="mt-4 min-h-11" disabled={pending} onClick={query}>Atualizar diálogo</Button>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

export function DialogueCostDetailView({ detail }: Readonly<{ detail: DialogueCostDetail }>) {
  const dialogue = detail.dialogue;
  return <div className="space-y-4">
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <Datum label="Diálogo canônico" value={dialogue.dialogueId} />
      <Datum label="Origem" value={originLabel(dialogue.origin)} />
      <Datum label="Início" value={timestamp(dialogue.startedAt)} />
      <Datum label="Estado" value={dialogue.endedAt ? "Encerrado em " + timestamp(dialogue.endedAt) : "Aberto"} />
      <Datum label="Ambiente" value={[...new Set(detail.executions.map(e => e.environment))].map(environmentLabel).join(", ") || "Não registrado"} />
    </dl>
    <div className="rounded-md border border-border bg-card p-3">
      <AdminStatusBadge tone={detail.status === "partial" || detail.status === "unrecorded" ? "warning" : "neutral"}>{costLabel(detail)}</AdminStatusBadge>
      <p className="mt-2 text-lg font-semibold">{detail.calculatedCostUsd === null ? "Sem valor comprovado" : usd(detail.calculatedCostUsd)}</p>
      <p className="mt-2 text-sm">{detail.callCount} chamadas · {detail.attemptCount} tentativas · {detail.retryCount} retries · {detail.webSearchCallCount} pesquisas Web{detail.unknownSearchCount ? " · " + detail.unknownSearchCount + " operações com pesquisas indisponíveis" : ""}</p>
      <p className="mt-1 text-xs text-muted-foreground">Chamadas são operações iniciais; tentativas incluem retries. Cada operação entra uma única vez no custo, incluindo cache e ferramentas.</p>
      {detail.status === "partial" || detail.status === "unrecorded" ? <p className="mt-2 text-sm">{detail.pendingCount} pendências · {detail.unavailableCount} custos indisponíveis · {detail.missingOperationCount} execuções sem operação. Este valor não é um custo final completo.</p> : null}
      <p className="mt-2 text-xs text-muted-foreground">Total das operações registradas no ledger. Ausência de registro não comprova custo zero; registros antigos sem vínculo explícito não são associados retroativamente.</p>
    </div>
    {detail.executions.map(execution => <OpenAiCostExecutionDetails key={execution.executionId} execution={execution} />)}
  </div>;
}
function Datum({ label, value }: Readonly<{ label: string; value: string }>) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-all">{value}</dd></div>; }
function originLabel(origin: OpenAiCostDialogue["origin"]) { return origin === "pending_setup" ? "Atendimento inicial" : "Redefinir nicho"; }
function environmentLabel(value: string) { return value === "production" ? "Produção" : value === "preview" ? "Preview" : "Desenvolvimento"; }
function timestamp(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
function costLabel(detail: DialogueCostDetail) { return detail.status === "final" ? "Custo final" : detail.status === "accumulated" ? "Custo acumulado" : detail.status === "partial" ? "Subtotal calculável — parcial" : "Sem custo registrado"; }
function usd(value: string) { const [integer, fraction = "00"] = value.split("."); return "US$ " + integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + fraction; }
