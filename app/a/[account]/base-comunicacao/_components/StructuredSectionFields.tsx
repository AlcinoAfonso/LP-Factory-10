"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CommunicationFaq } from "../../../../../lib/communication-base/contracts";
import type { CommunicationSectionStage } from "../../../../../lib/communication-base/registry";
import {
  COMMUNICATION_FAQ_MAX, COMMUNICATION_INTELLIGENCE_SECTION_MAX,
  COMMUNICATION_ITEM_MAX, COMMUNICATION_ITEMS_MAX, COMMUNICATION_TEXT_MAX,
} from "../../../../../lib/communication-base/policy";

export function StructuredSectionFields({ format, stage, draft, onChange, disabled, id }: Readonly<{
  format: "items" | "faq"; stage: CommunicationSectionStage; draft: string;
  onChange: (value: string) => void; disabled: boolean; id: string;
}>) {
  const rows: (string | CommunicationFaq)[] = JSON.parse(draft || "[]");
  const intelligence = stage === 2;
  const itemMaxLength = intelligence ? COMMUNICATION_INTELLIGENCE_SECTION_MAX : COMMUNICATION_ITEM_MAX;
  const answerMaxLength = intelligence ? COMMUNICATION_INTELLIGENCE_SECTION_MAX : COMMUNICATION_TEXT_MAX;
  const totalCharacters = rows.reduce((total, row) =>
    total + (typeof row === "string" ? row.trim().length : row.question.trim().length + row.answer.trim().length), 0);
  const update = (index: number, value: string | CommunicationFaq) => onChange(JSON.stringify(rows.map((row, i) => i === index ? value : row)));
  const remove = (index: number) => onChange(JSON.stringify(rows.filter((_, i) => i !== index)));
  return <div className="space-y-3">
    <input type="hidden" name="value" value={draft} />
    {intelligence ? <p id={id + "-hint"} className="text-xs text-muted-foreground tabular-nums">
      {totalCharacters.toLocaleString("pt-BR")} / {COMMUNICATION_INTELLIGENCE_SECTION_MAX.toLocaleString("pt-BR")} caracteres nesta seção
    </p> : null}
    {rows.map((row, index) => <fieldset key={index} disabled={disabled} className="space-y-1.5 border-b border-border pb-3">
      <legend className="text-sm font-medium">{format === "faq" ? "Pergunta e resposta" : "Item"} {index + 1}</legend>
      {typeof row === "string" ? <>
        <label className="sr-only" htmlFor={id + index}>Item {index + 1}</label>
        <Textarea id={id + index} rows={3} value={row} maxLength={itemMaxLength} onChange={(e) => update(index, e.target.value)}
          aria-describedby={id + "-hint"} className="text-sm" />
      </> : <>
        <label className="block text-sm" htmlFor={id + index + "-question"}>Pergunta</label>
        <Input id={id + index + "-question"} value={row.question} maxLength={itemMaxLength} className="min-h-11"
          onChange={(e) => update(index, { ...row, question: e.target.value })} />
        <label className="block text-sm" htmlFor={id + index + "-answer"}>Resposta</label>
        <Textarea id={id + index + "-answer"} rows={3} value={row.answer} maxLength={answerMaxLength}
          onChange={(e) => update(index, { ...row, answer: e.target.value })} />
      </>}
      <Button type="button" variant="secondary" className="min-h-11" onClick={() => remove(index)}>Retirar {format === "faq" ? "par" : "item"} {index + 1}</Button>
    </fieldset>)}
    <Button type="button" variant="secondary" className="min-h-11" disabled={disabled || rows.length >= (format === "faq" ? COMMUNICATION_FAQ_MAX : COMMUNICATION_ITEMS_MAX)}
      onClick={() => onChange(JSON.stringify([...rows, format === "faq" ? { question: "", answer: "" } : ""]))}>
      {format === "faq" ? "Adicionar pergunta e resposta" : "Adicionar item"}
    </Button>
  </div>;
}

export function StructuredSectionContent({ value }: Readonly<{ value: unknown }>) {
  if (typeof value === "string") return <p className="whitespace-pre-wrap break-words text-sm leading-6">{value}</p>;
  if (!Array.isArray(value)) return null;
  return <div className="space-y-3">{value.map((row, i) => typeof row === "string"
    ? <p key={i} className="whitespace-pre-wrap break-words text-sm leading-6">{row}</p>
    : <div key={i}><h3 className="whitespace-pre-wrap break-words text-sm font-semibold">{row.question}</h3>
      <p className="whitespace-pre-wrap break-words text-sm leading-6">{row.answer}</p></div>)}</div>;
}
