import { createHash } from "node:crypto";

import type { InputCatalogEvaluationOutput } from "./contracts";

export function fingerprintInputCatalogEvaluationOutput(
  output: InputCatalogEvaluationOutput,
): string {
  return createHash("sha256").update(JSON.stringify(output)).digest("hex");
}
