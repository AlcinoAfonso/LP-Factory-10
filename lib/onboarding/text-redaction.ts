export function redactEmailAndUrl(input: string): string {
  return input
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email removido]")
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/giu, "[url removida]");
}

export function redactPotentialContactDetails(input: string): string {
  return redactEmailAndUrl(input)
    .replace(/(?:\+?\d[\s().-]*){10,}/gu, "[telefone removido]")
    .replace(/\s+/g, " ")
    .trim();
}
