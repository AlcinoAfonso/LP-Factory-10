export const PHONE_LIKE_PATTERN = /(?:\+?\d[\s().\/\\\p{Pd}\u2212\u2044\u2215\uFF0F]*){10,}/gu;

export function redactEmailAndUrl(input: string): string {
  return input
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email removido]")
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/giu, "[url removida]");
}

export function redactPotentialContactDetails(input: string): string {
  return redactEmailAndUrl(input)
    .replace(PHONE_LIKE_PATTERN, "[telefone removido]")
    .replace(/\s+/g, " ")
    .trim();
}
