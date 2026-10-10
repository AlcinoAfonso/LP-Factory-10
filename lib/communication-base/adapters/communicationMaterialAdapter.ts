import "server-only";
import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { COMMUNICATION_MATERIAL_BUCKET, COMMUNICATION_IMAGE_MAX_BYTES, imageExtension, isMaterialId, ownsMaterialPath } from "../materials";
import type { CommunicationBaseResult, CommunicationMaterial } from "../contracts";

export async function uploadCommunicationImage(accountId: string, itemId: string, file: File): Promise<CommunicationBaseResult<Extract<CommunicationMaterial["source"], {type: "private"}>>> {
  if (!isMaterialId(accountId) || !isMaterialId(itemId) || file.size <= 0 || file.size > COMMUNICATION_IMAGE_MAX_BYTES) return { ok: false, error: "invalid" };
  try {
    const bytes = new Uint8Array(await file.arrayBuffer()); const extension = imageExtension(bytes, file.type);
    if (!extension) return { ok: false, error: "invalid" };
    const path = accountId + "/" + itemId + "/" + randomUUID() + "." + extension;
    const { error } = await createServiceClient().storage.from(COMMUNICATION_MATERIAL_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
    return error ? { ok: false, error: "write_failed" } : { ok: true, value: { type: "private", bucket: COMMUNICATION_MATERIAL_BUCKET, path, mime: file.type } };
  } catch { return { ok: false, error: "write_failed" }; }
}
// Only a new upload whose Base CAS failed may be deleted. Persisted objects are retained privately.
export async function cleanupUncommittedCommunicationImage(accountId: string, itemId: string, path: string): Promise<boolean> {
  if (!ownsMaterialPath(accountId, itemId, path)) return false;
  try { const { error } = await createServiceClient().storage.from(COMMUNICATION_MATERIAL_BUCKET).remove([path]); return !error; } catch { return false; }
}
export async function signCommunicationImage(accountId: string, item: CommunicationMaterial): Promise<CommunicationBaseResult<string>> {
  if (item.source.type !== "private" || item.source.bucket !== COMMUNICATION_MATERIAL_BUCKET || !ownsMaterialPath(accountId, item.id, item.source.path)) return { ok: false, error: "invalid" };
  try {
    const { data, error } = await createServiceClient().storage.from(COMMUNICATION_MATERIAL_BUCKET).createSignedUrl(item.source.path, 60);
    return !error && data?.signedUrl ? { ok: true, value: data.signedUrl } : { ok: false, error: "read_failed" };
  } catch { return { ok: false, error: "read_failed" }; }
}
