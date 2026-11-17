import type { OpenAiCandidateProofMetadata } from "./proofCore";

type Mutation = { data: unknown; error: { code?: string; message?: string } | null };
type Proof = { ok: true; metadata: OpenAiCandidateProofMetadata } | { ok: false; code: string };

// One human decision, the existing versioned lifecycle, no alternate configuration store.
export async function applyOpenAiConfigurationCore(input: {
  expectedVersion: number;
  prove: () => Promise<Proof>;
  save: (version: number) => Promise<Mutation>;
  promote: (version: number, metadata: OpenAiCandidateProofMetadata) => Promise<Mutation>;
  activate: (version: number, revisionId: string) => Promise<Mutation>;
}): Promise<{ ok: true; version: number } | { ok: false; code: string; error?: Mutation["error"] }> {
  const proof = await input.prove();
  if (!proof.ok) return { ok: false, code: "proof_" + proof.code };
  const saved = await input.save(input.expectedVersion);
  if (saved.error) return { ok: false, code: "save", error: saved.error };
  const savedVersion = saved.data;
  if (!positiveVersion(savedVersion)) return { ok: false, code: "operation_failed" };
  const promoted = await input.promote(savedVersion, proof.metadata);
  if (promoted.error) return { ok: false, code: "promote", error: promoted.error };
  const revision = Array.isArray(promoted.data) && promoted.data.length === 1 ? promoted.data[0] : null;
  if (!revision || typeof revision.candidate_revision_id !== "string" || !positiveVersion(revision.configuration_version) ||
    !positiveVersion(revision.candidate_revision_number)) return { ok: false, code: "operation_failed" };
  const activated = await input.activate(revision.configuration_version, revision.candidate_revision_id);
  if (activated.error) return { ok: false, code: "activate", error: activated.error };
  if (!positiveVersion(activated.data)) return { ok: false, code: "operation_failed" };
  return { ok: true, version: activated.data };
}

function positiveVersion(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
