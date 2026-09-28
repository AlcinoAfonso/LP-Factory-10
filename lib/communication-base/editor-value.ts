import type { CommunicationSectionValue } from "./contracts";
import type { CommunicationSectionDefinition } from "./registry";

export function parseEditorValue(
  format: CommunicationSectionDefinition["format"],
  raw: string,
): CommunicationSectionValue {
  if (format === "text") return raw;
  if (format === "items") return raw.split(/\r?\n/);
  return raw.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    const separator = line.indexOf("|");
    return separator < 0
      ? { question: line.trim(), answer: "" }
      : { question: line.slice(0, separator).trim(), answer: line.slice(separator + 1).trim() };
  });
}

export function formatEditorValue(
  value: CommunicationSectionValue,
  format: CommunicationSectionDefinition["format"],
): string {
  if (typeof value === "string") return value;
  if (format === "items") return Array.isArray(value)
    ? value.map((item) => typeof item === "string" ? oneLine(item) : "").join("\n")
    : "";
  return Array.isArray(value)
    ? value.map((item) => typeof item === "object" && item !== null && "question" in item
      ? `${oneLine(item.question).replaceAll("|", "/")} | ${oneLine(item.answer)}`
      : "").join("\n")
    : "";
}

function oneLine(value: string): string {
  return value.replace(/[\r\n\u2028\u2029]+/g, " ");
}
