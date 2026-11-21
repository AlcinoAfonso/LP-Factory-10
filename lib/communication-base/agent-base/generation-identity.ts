import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { AgentBaseEnvironment } from "../config";
import type { AgentBasePilotSection } from "./pilot";

export const category3Uuid = z.uuid();
export function category3GenerationId(
  secret: string,
  attemptId: string,
  environment: AgentBaseEnvironment,
  accountId: string,
  version: number,
) {
  const hex = createHmac("sha256", secret).update("d14f-category-3-generation-v1")
    .update(JSON.stringify([attemptId, environment, accountId, version])).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

type ProofContext = Readonly<{
  environment: AgentBaseEnvironment; accountId: string; version: number;
  catalogState: string; nicheRevision: string; generationId: string | null;
}>;

export function signCategory3Section(secret: string, context: ProofContext, section: AgentBasePilotSection) {
  const { environment, accountId, version, catalogState, nicheRevision, generationId } = context;
  const { key, value, basis, sources, researched, dispatchedOperationId } = section;
  const scope = [environment, accountId, version, catalogState, nicheRevision];
  // Preserve previous proofs for sections already in flight during deployment.
  const versionTag = generationId ? (dispatchedOperationId === undefined ? "v3" : "v4") : "v2";
  const proof = createHmac("sha256", secret).update("d14f-agent-base-proof-" + versionTag);
  const identity = generationId ? [generationId] : [];
  const operation = versionTag === "v4" ? { dispatchedOperationId } : {};
  return proof.update(JSON.stringify([...scope, ...identity, { key, value, basis, sources, researched, ...operation }])).digest("hex");
}

export function verifyCategory3Section(secret: string, context: ProofContext, section: AgentBasePilotSection) {
  if (!section || typeof section.proof !== "string" || !/^[0-9a-f]{64}$/.test(section.proof)) return false;
  if (section.dispatchedOperationId !== undefined &&
      (!context.generationId || !category3Uuid.safeParse(section.dispatchedOperationId).success)) return false;
  const expected = signCategory3Section(secret, context, section);
  return timingSafeEqual(Buffer.from(section.proof, "hex"), Buffer.from(expected, "hex"));
}
