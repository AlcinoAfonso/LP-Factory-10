const urlTokens = /\bhttps?:\/\/[^\s<>"“”«»\u0000-\u001f\u007f]+/giu;
const closing = new Map([["(", ")"], ["[", "]"], ["{", "}"]]);

export function isHttpAddress(value: string): boolean {
  if (!/^https?:\/\//i.test(value) || /[\s\u0000-\u001f\u007f]/u.test(value)) return false;
  try {
    const parsed = new URL(value);
    return Boolean(parsed.hostname && (parsed.protocol === "http:" || parsed.protocol === "https:"));
  } catch {
    return false;
  }
}

function addressInSentence(token: string, preceding: string | undefined): string {
  const quote = preceding === "'" ? "'" : preceding === "‘" ? "’" : undefined;
  if (quote) {
    const lastQuote = token.lastIndexOf(quote);
    if (lastQuote >= 0 && /^[.,;!?]*$/u.test(token.slice(lastQuote + 1))) return token.slice(0, lastQuote);
  }
  const expected: string[] = [];
  for (const [index, character] of token.split("").entries()) {
    const terminator = closing.get(character);
    if (terminator) expected.push(terminator);
    else if (character === ")" || character === "]" || character === "}") {
      if (expected.at(-1) !== character) return token.slice(0, index);
      expected.pop();
    }
  }
  return token.replace(/[.,;!?]+$/u, "");
}

export function communicationTextLinks(text: string) {
  const links: { value: string; start: number; end: number }[] = [];
  const standalone = text.trim();
  for (const match of text.matchAll(urlTokens)) {
    const value = match[0] === standalone ? standalone : addressInSentence(match[0], text[match.index - 1]);
    if (isHttpAddress(value)) links.push({ value, start: match.index, end: match.index + value.length });
  }
  return links;
}
