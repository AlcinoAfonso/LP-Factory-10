const NUMERIC_SPAN_PATTERN = /(?:\+?\d[\s().\/\\\p{Pd}\u2212\u2044\u2215\uFF0F]*)+/gu;

// Calendar dates are commercial context, even though they contain eight digits.
export function isCalendarDate(input: string): boolean {
  const text = input.trim().replace(/[.)]+$/, "");
  const local = /^(\d{1,2})([/.\-])(\d{1,2})\2(\d{4})$/.exec(text);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (!local && !iso) return false;
  const year = Number(local ? local[4] : iso![1]);
  const month = Number(local ? local[3] : iso![2]);
  const day = Number(local ? local[1] : iso![3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 && date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function replacePotentialPhoneNumbers(input: string, replace: (raw: string) => string): string {
  const spans = new RegExp(NUMERIC_SPAN_PATTERN.source, NUMERIC_SPAN_PATTERN.flags);
  let result = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = spans.exec(input)) !== null) {
    const start = match.index;
    const raw = match[0];
    const remaining = input.slice(start);
    result += input.slice(cursor, start);
    const date = /^(?:\d{1,2}([/.\-])\d{1,2}\1\d{4}|\d{4}-\d{1,2}-\d{1,2})(?=\D|$)/u.exec(remaining)?.[0];
    const amount = /^(?:\d{1,3}(?:\.\d{3})+(?:[.,]\d{1,2})?|\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d{1,3}(?:[ \t\u00a0\u202f]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?!\d|[.,]\d)/u.exec(remaining)?.[0];
    const before = input.slice(cursor, start);
    const afterAmount = amount ? input.slice(start + amount.length) : "";
    const monetaryBefore = /(?:\b(?:BRL|USD|EUR|GBP|JPY)|(?:R|US|CA|AU)?\$|[€£¥])\s*$/iu.test(before);
    const monetarySuffix = /^\s*(?:BRL|USD|EUR|GBP|JPY|reais|dólares|euros)\b/iu.exec(afterAmount)?.[0];
    const monetaryValue = amount && (monetaryBefore || monetarySuffix) ? amount + (monetarySuffix ?? "") : null;
    const quantitySuffix = /^\s*(?:clientes?|pessoas?|pedidos?|vendas?|unidades?|atendimentos?|visitas?|acessos?|seguidores?|itens|produtos?|m[²³]|kg|km|%)(?=\s|[.,;:!?)]|$)/iu.exec(afterAmount)?.[0];
    const contactLabel = /\b(?:whats(?:app)?|telefone|tel|celular|contato|n[uú]mero)\s*(?:(?:é|:)\s*)*$/iu.test(before);
    const quantityValue = amount && quantitySuffix && !contactLabel ? amount + quantitySuffix : null;
    const protectedValue = date && isCalendarDate(date) ? date : monetaryValue ?? quantityValue;
    if (protectedValue) {
      result += protectedValue;
      cursor = start + protectedValue.length;
      spans.lastIndex = cursor;
      continue;
    }
    const candidate = raw.replace(/\D+$/u, "");
    result += candidate.replace(/\D/g, "").length >= 8
      ? replace(candidate) + raw.slice(candidate.length) : raw;
    cursor = start + raw.length;
  }
  return result + input.slice(cursor);
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
