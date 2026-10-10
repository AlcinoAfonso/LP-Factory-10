import type { CommunicationMaterial } from "./contracts";
export const COMMUNICATION_MATERIAL_BUCKET = "communication-base-assets";
export const COMMUNICATION_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const COMMUNICATION_MATERIALS_MAX = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isMaterialId(raw: unknown): raw is string { return typeof raw === "string" && UUID.test(raw); }
export function safeMaterialLink(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  try { const url = new URL(raw.trim()); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function parseCommunicationMaterials(raw: unknown): readonly CommunicationMaterial[] | null {
  if (!Array.isArray(raw) || raw.length > COMMUNICATION_MATERIALS_MAX) return null;
  const ids = new Set<string>(); const result: CommunicationMaterial[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || !isMaterialId(row.id) || ids.has(row.id) ||
      !["image", "video", "audio", "testimonial"].includes(row.kind) ||
      typeof row.name !== "string" || !row.name.trim() || row.name.length > 120 ||
      typeof row.context !== "string" || row.context.length > 1000 ||
      typeof row.author !== "string" || row.author.length > 160 ||
      typeof row.authorization !== "string" || row.authorization.length > 1000) return null;
    const source = row.source;
    if (!source || typeof source !== "object") return null;
    if (source.type === "text") {
      if (row.kind !== "testimonial" || typeof source.text !== "string" || !source.text.trim() || source.text.length > 4000) return null;
    } else if (source.type === "link") {
      if (row.kind === "testimonial" || !safeMaterialLink(source.url)) return null;
    } else if (source.type === "private") {
      if (row.kind !== "image" || source.bucket !== COMMUNICATION_MATERIAL_BUCKET ||
        typeof source.path !== "string" || !/^[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(source.path) ||
        !["image/png", "image/jpeg", "image/webp"].includes(source.mime)) return null;
    } else return null;
    ids.add(row.id);
    result.push({ id: row.id, kind: row.kind, name: row.name.trim(), context: row.context.trim(),
      author: row.author.trim(), authorization: row.authorization.trim(),
      source: source.type === "text" ? { type: "text", text: source.text.trim() }
        : source.type === "link" ? { type: "link", url: safeMaterialLink(source.url)! }
        : { type: "private", bucket: COMMUNICATION_MATERIAL_BUCKET, path: source.path, mime: source.mime } });
  }
  return result;
}
export function imageExtension(bytes: Uint8Array, mime: string): "png" | "jpg" | "webp" | null {
  if (mime === "image/png" && [137,80,78,71,13,10,26,10].every((byte,i)=>bytes[i]===byte)) return "png";
  if (mime === "image/jpeg" && bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return "jpg";
  if (mime === "image/webp" && String.fromCharCode(...bytes.slice(0,4))==="RIFF" && String.fromCharCode(...bytes.slice(8,12))==="WEBP") return "webp";
  return null;
}
export function ownsMaterialPath(accountId: string, itemId: string, path: string): boolean {
  return isMaterialId(accountId) && isMaterialId(itemId) && path.startsWith(accountId + "/" + itemId + "/");
}
