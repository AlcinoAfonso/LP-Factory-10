export function redactPotentialContactDetails(input: string): string {
  return input
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email removido]")
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/giu, "[url removida]")
    .replace(/(?:\+?\d[\s().-]*){10,15}/gu, "[telefone removido]")
    .replace(/\s+/g, " ")
    .trim();
}
