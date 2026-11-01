import type { CommunicationFact } from "./contracts";

// Nome público remains the section's value, shared with the Base header.
export const BUSINESS_IDENTIFICATION_LABELS = [
  "Nome completo ou razão social", "CPF/CNPJ", "CEP", "Logradouro", "Número",
  "Complemento", "Bairro", "Cidade", "UF",
] as const;

export function identificationFactIndex(rows: readonly CommunicationFact[], label: string): number {
  return rows.findIndex((row) => row.label.trim().toLocaleLowerCase("pt-BR") === label.toLocaleLowerCase("pt-BR"));
}

export function updateIdentificationFact(rows: readonly CommunicationFact[], label: string, value: string): readonly CommunicationFact[] {
  const index = identificationFactIndex(rows, label);
  if (index < 0) return value.trim() && rows.length < 30 ? [...rows, { label, value }] : rows;
  if (!value.trim()) return rows.filter((_, i) => i !== index);
  return rows.map((row, i) => i === index ? { ...row, value } : row);
}
