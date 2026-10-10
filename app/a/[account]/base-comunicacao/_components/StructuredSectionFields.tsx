"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CommunicationFaq } from "../../../../../lib/communication-base/contracts";

export function StructuredSectionFields({ format, draft, onChange, disabled, id }: Readonly<{
  format: "items" | "faq"; draft: string; onChange: (value: string) => void; disabled: boolean; id: string;
}>) {
  const rows: (string | CommunicationFaq)[] = JSON.parse(draft || "[]");
  const update = (index: number, value: string | CommunicationFaq) => onChange(JSON.stringify(rows.map((row, i) => i === index ? value : row)));
  const remove = (index: number) => onChange(JSON.stringify(rows.filter((_, i) => i !== index)));
  return <div className="space-y-3">
    <input type="hidden" name="value" value={draft} />
    {rows.map((row, index) => <fieldset key={index} disabled={disabled} className="space-y-1.5 border-b border-border pb-3">
      <legend className="text-sm font-medium">{format === "faq" ? "Pergunta e resposta" : "Item"} {index + 1}</legend>
      {typeof row === "string" ? <>
        <label className="sr-only" htmlFor={id + index}>Item {index + 1}</label>
        <Textarea id={id + index} rows={3} value={row} maxLength={400} onChange={(e) => update(index, e.target.value)}
          aria-describedby={id + "-hint"} className="text-sm" />
      </> : <>
        <label className="block text-sm" htmlFor={id + index + "-question"}>Pergunta</label>
        <Input id={id + index + "-question"} value={row.question} maxLength={400}
          onChange={(e) => update(index, { ...row, question: e.target.value })} />
        <label className="block text-sm" htmlFor={id + index + "-answer"}>Resposta</label>
        <Textarea id={id + index + "-answer"} rows={3} value={row.answer} maxLength={4000}
          onChange={(e) => update(index, { ...row, answer: e.target.value })} />
      </>}
      <Button type="button" variant="secondary" className="min-h-11" onClick={() => remove(index)}>Retirar {format === "faq" ? "par" : "item"} {index + 1}</Button>
    </fieldset>)}
    <Button type="button" variant="secondary" className="min-h-11" disabled={disabled || rows.length >= (format === "faq" ? 15 : 20)}
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
