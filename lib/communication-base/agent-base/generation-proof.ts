import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { AgentBaseEnvironment } from "../config";
import type { AgentBasePilotSection } from "./pilot";

// The existing OpenAI server secret authenticates each ephemeral result across requests.
export function pilotProof(secret: string | undefined, environment: AgentBaseEnvironment, accountId: string, version: number, catalogState: string, nicheRevision: string,
  section: AgentBasePilotSection): string | null {
  if (!secret) return null;
  const { key, value, basis, sources, researched } = section;
  return createHmac("sha256", secret).update(section.generationId ? "d14f-agent-base-proof-v3" : "d14f-agent-base-proof-v2")
    .update(JSON.stringify([environment, accountId, version, catalogState, nicheRevision,
      ...(section.generationId ? [section.generationId] : []), { key, value, basis, sources, researched }])).digest("hex");
}
export function verifiedPilotProof(secret: string | undefined, environment: AgentBaseEnvironment, accountId: string, version: number, catalogState: string, nicheRevision: string,
  section: AgentBasePilotSection) {
  const expected = pilotProof(secret, environment, accountId, version, catalogState, nicheRevision, section);
  return Boolean(expected && typeof section.proof === "string" && /^[0-9a-f]{64}$/.test(section.proof) &&
    timingSafeEqual(Buffer.from(section.proof, "hex"), Buffer.from(expected, "hex")));
}


export function resolveAgentBaseGenerationId(previous: readonly AgentBasePilotSection[]) {
  if (!previous.length) return randomUUID();
  const generationId = previous[0].generationId;
  return generationId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(generationId) &&
    previous.every(section => section.generationId === generationId) ? generationId : null;
}
