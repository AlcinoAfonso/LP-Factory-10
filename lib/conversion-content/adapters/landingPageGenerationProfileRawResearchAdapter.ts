import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createServiceClient } from "@/lib/supabase/service";
import type { ResolvedLandingPageResearch } from "../landing-page/research-resolution";
import type { GenerationProfileRawResearch } from "../landing-page/generation-profile/proposal";

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function readGenerationProfileRawResearch(
  research: ResolvedLandingPageResearch,
): Promise<Readonly<{ items: readonly GenerationProfileRawResearch[]; notices: readonly string[] }>> {
  const sources = [research.businessBuyer, research.endCustomer];
  const sourceIds = [...new Set(sources.map((source) => source.sourceTaxonId))];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,slug")
    .in("id", sourceIds);
  if (error || !Array.isArray(data)) {
    return { items: [], notices: ["Pesquisa bruta complementar indisponivel: taxons de origem nao puderam ser resolvidos."] };
  }
  const slugs = new Map(data.flatMap((row) =>
    typeof row.id === "string" && typeof row.slug === "string" && SAFE_SLUG.test(row.slug)
      ? [[row.id, row.slug] as const]
      : [],
  ));
  const items: GenerationProfileRawResearch[] = [];
  const notices: string[] = [];
  for (const source of sources) {
    const slug = slugs.get(source.sourceTaxonId);
    if (!slug) {
      notices.push(`Pesquisa bruta complementar ausente para ${source.audienceScope}.`);
      continue;
    }
    const relativePath = path.posix.join(
      "docs/pesquisas-brutas",
      slug,
      source.audienceScope === "business_buyer" ? "business_buyer" : "end_customer",
      `v${source.version}.md`,
    );
    try {
      const content = await readFile(path.join(process.cwd(), ...relativePath.split("/")), "utf8");
      const bytes = Buffer.from(content, "utf8");
      const blob = createHash("sha1")
        .update(Buffer.from(`blob ${bytes.byteLength}\0`, "utf8"))
        .update(bytes)
        .digest("hex");
      items.push({
        reference: {
          path: relativePath,
          audienceScope: source.audienceScope,
          sourceTaxonId: source.sourceTaxonId,
          sourceRelation: source.sourceRelation,
          version: source.version,
          blob,
        },
        content,
      });
    } catch (readError) {
      const code = readError instanceof Error && "code" in readError ? String(readError.code) : "unknown";
      notices.push(code === "ENOENT"
        ? `Pesquisa bruta complementar nao encontrada: ${relativePath}`
        : `Pesquisa bruta complementar nao pode ser lida: ${relativePath}`);
    }
  }
  return { items, notices };
}
