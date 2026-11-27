import { find } from "linkifyjs";

export function isHttpAddress(value: string): boolean {
  if (!/^https?:\/\//i.test(value) || /\s/u.test(value)) return false;
  try {
    const parsed = new URL(value);
    return Boolean(parsed.hostname && (parsed.protocol === "http:" || parsed.protocol === "https:"));
  } catch {
    return false;
  }
}

export function communicationTextLinks(text: string) {
  return /https?:\/\//i.test(text) ? find(text, "url").filter(link => isHttpAddress(link.value)) : [];
}
