"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BUSINESS_IDENTIFICATION_LABELS, identificationFactIndex, updateIdentificationFact } from "../../../../../lib/communication-base/business-identification";
import type { CommunicationFact } from "../../../../../lib/communication-base/contracts";

export function BusinessFactsFields({ draft, onChange, disabled, id, identification = false }: Readonly<{
  draft: string; onChange: (value: string) => void; disabled: boolean; id: string; identification?: boolean;
}>) {
  const rows: CommunicationFact[] = JSON.parse(draft);
  const predefinedIndexes = identification ? BUSINESS_IDENTIFICATION_LABELS.map((label) => identificationFactIndex(rows, label)) : [];
  const update = (index: number, patch: Partial<CommunicationFact>) => onChange(JSON.stringify(rows.map((row, i) => i === index ? { ...row, ...patch } : row)));
  return <fieldset disabled={disabled} className="space-y-2 border-t border-border pt-3">
    <legend className="text-sm font-medium">Registros do negócio</legend>
    <p id={id + "-help"} className="text-xs text-muted-foreground">Acrescente razão social, CNPJ, contatos ou outros registros pertinentes. Até 30 informações.</p>
    <input type="hidden" name="facts" value={draft} />
    {identification ? <div className="grid gap-2 sm:grid-cols-2">{BUSINESS_IDENTIFICATION_LABELS.map((label, i) => {
      const index = predefinedIndexes[i];
      return <label key={label} className="text-sm" htmlFor={id + "-initial-" + i}>{label}
        <Input id={id + "-initial-" + i} value={index < 0 ? "" : rows[index].value} maxLength={1000}
          disabled={disabled || (index < 0 && rows.length >= 30)}
          onChange={(event) => onChange(JSON.stringify(updateIdentificationFact(rows, label, event.target.value)))} />
      </label>;
    })}</div> : null}
    {rows.map((row, index) => predefinedIndexes.includes(index) ? null : <div key={index} className="space-y-1.5 border-b border-border pb-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm" htmlFor={id + index + "-label"}>Rótulo {index + 1}
          <Input id={id + index + "-label"} value={row.label} maxLength={100} onChange={(e) => update(index, { label: e.target.value })} /></label>
        <label className="text-sm" htmlFor={id + index + "-value"}>Valor {index + 1}
          <Input id={id + index + "-value"} value={row.value} maxLength={1000} onChange={(e) => update(index, { value: e.target.value })} /></label>
      </div>
      <Button type="button" variant="secondary" className="min-h-11" onClick={() => onChange(JSON.stringify(rows.filter((_, i) => i !== index)))}>Retirar informação {index + 1}</Button>
    </div>)}
    <Button type="button" variant="secondary" className="min-h-11" disabled={rows.length >= 30} onClick={() => onChange(JSON.stringify([...rows, { label: "", value: "" }]))}>Adicionar informação</Button>
  </fieldset>;
}
