export const PHONE_LIKE_PATTERN = /(?:\+?\d[\s().\/\\\p{Pd}\u2212\u2044\u2215\uFF0F]*){8,}/gu;

// Calendar dates are commercial context, even though they contain eight digits.
export function isCalendarDate(input: string): boolean {
  const text = input.trim().replace(/[.)]+$/, "");
  const local = /^(\d{2})([/.\-])(\d{2})\2(\d{4})$/.exec(text);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!local && !iso) return false;
  const year = Number(local ? local[4] : iso![1]);
  const month = Number(local ? local[3] : iso![2]);
  const day = Number(local ? local[1] : iso![3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 && date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function replacePotentialPhoneNumbers(input: string, replace: (raw: string) => string): string {
  return input.replace(PHONE_LIKE_PATTERN, (raw: string, offset: number) => {
    const before = input.slice(Math.max(0, offset - 20), offset);
    const after = input.slice(offset + raw.length, offset + raw.length + 20);
    const monetary = /^\d[\d.\s]*$/.test(raw.trim()) && (
      /(?:\b(?:BRL|USD|EUR|GBP|JPY)|(?:R|US|CA|AU)?\$|[€£¥])\s*$/iu.test(before)
      || /^\s*(?:BRL|USD|EUR|GBP|JPY|reais|dólares|euros)\b/iu.test(after));
    return isCalendarDate(raw) || monetary ? raw : replace(raw);
  });
}

export function redactEmailAndUrl(input: string): string {
  return input
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email removido]")
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/giu, "[url removida]");
}

export function redactPotentialContactDetails(input: string): string {
  return replacePotentialPhoneNumbers(redactEmailAndUrl(input), () => "[telefone removido]")
    .replace(/\s+/g, " ")
    .trim();
}
