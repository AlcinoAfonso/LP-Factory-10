import "server-only";

export function isE1011PassageEnabled(): boolean {
  return process.env.E10_11_PASSAGE_ENABLED === "true";
}
