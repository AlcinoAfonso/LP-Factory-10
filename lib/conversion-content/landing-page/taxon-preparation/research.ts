import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE,
  type EndCustomerResearchErrorCode,
  type LoadEndCustomerResearchCandidateInput,
  type LoadEndCustomerResearchCandidateResult,
} from "./contracts";

const IDENTIFICATION_HEADING = "## 1. Identificação e uso";
const REQUIRED_METADATA_KEYS = [
  "taxon_slug",
  "audience_scope",
  "research_version",
] as const;
const CANONICAL_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const METADATA_ITEM_PATTERN =
  /^- `(taxon_slug|audience_scope|research_version)`: `([^`\r\n]+)`\s*$/;
const REQUIRED_METADATA_ITEM_PATTERN =
  /^-\s*`?(taxon_slug|audience_scope|research_version)\b/;

type ResearchFileReader = (
  filePath: string,
  encoding: "utf8",
) => Promise<string>;

type LoadEndCustomerResearchOptions = Readonly<{
  researchRoot: string;
  readResearchFile: ResearchFileReader;
}>;

export async function loadEndCustomerResearchCandidate(
  input: LoadEndCustomerResearchCandidateInput,
): Promise<LoadEndCustomerResearchCandidateResult> {
  return loadEndCustomerResearchCandidateInternal(input, {
    researchRoot: path.join(process.cwd(), "docs", "pesquisas-brutas"),
    readResearchFile: readUtf8File,
  });
}

export async function loadEndCustomerResearchCandidateForValidation(
  input: LoadEndCustomerResearchCandidateInput,
  options: Partial<LoadEndCustomerResearchOptions>,
): Promise<LoadEndCustomerResearchCandidateResult> {
  return loadEndCustomerResearchCandidateInternal(input, {
    researchRoot:
      options.researchRoot ??
      path.join(process.cwd(), "docs", "pesquisas-brutas"),
    readResearchFile: options.readResearchFile ?? readUtf8File,
  });
}

async function loadEndCustomerResearchCandidateInternal(
  input: LoadEndCustomerResearchCandidateInput,
  options: LoadEndCustomerResearchOptions,
): Promise<LoadEndCustomerResearchCandidateResult> {
  const { slug, isActive } = input.taxon;

  if (containsPathTraversal(slug)) {
    return failure(
      "PATH_OUTSIDE_RESEARCH_ROOT",
      "O slug do taxon não pode sair do diretório de pesquisas.",
    );
  }

  if (!CANONICAL_SLUG_PATTERN.test(slug)) {
    return failure("INVALID_TAXON_SLUG", "O slug do taxon não é canônico.");
  }

  if (!isActive) {
    return failure("TAXON_INACTIVE", "O taxon precisa estar ativo.");
  }

  if (
    !Number.isSafeInteger(input.researchVersion) ||
    input.researchVersion <= 0
  ) {
    return failure(
      "INVALID_RESEARCH_VERSION",
      "A versão da pesquisa deve ser um inteiro positivo.",
    );
  }

  const researchRoot = path.resolve(options.researchRoot);
  const relativePath = path.join(
    slug,
    END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE,
    `v${input.researchVersion}.md`,
  );
  const filePath = path.resolve(researchRoot, relativePath);
  const confinedPath = path.relative(researchRoot, filePath);

  if (
    confinedPath.startsWith(`..${path.sep}`) ||
    confinedPath === ".." ||
    path.isAbsolute(confinedPath)
  ) {
    return failure(
      "PATH_OUTSIDE_RESEARCH_ROOT",
      "O arquivo solicitado não pertence ao diretório de pesquisas.",
    );
  }

  let content: string;
  try {
    content = await options.readResearchFile(filePath, "utf8");
  } catch (error) {
    if (isNodeErrorWithCode(error, "ENOENT")) {
      return failure("FILE_NOT_FOUND", "A pesquisa solicitada não existe.");
    }
    return failure("READ_FAILED", "Não foi possível ler a pesquisa solicitada.");
  }

  const metadataResult = validateMetadata(
    content,
    slug,
    input.researchVersion,
  );
  if (!metadataResult.ok) return metadataResult;

  return Object.freeze({
    ok: true,
    value: Object.freeze({
      taxonSlug: slug,
      audienceScope: END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE,
      researchVersion: input.researchVersion,
      relativePath: relativePath.split(path.sep).join("/"),
      content,
    }),
  });
}

async function readUtf8File(
  filePath: string,
  encoding: "utf8",
): Promise<string> {
  return readFile(filePath, encoding);
}

function validateMetadata(
  content: string,
  expectedTaxonSlug: string,
  expectedResearchVersion: number,
): LoadEndCustomerResearchCandidateResult | Readonly<{ ok: true }> {
  const lines = content.replaceAll("\r\n", "\n").split("\n");
  const firstSectionIndex = lines.findIndex((line) => line.startsWith("## "));

  if (
    firstSectionIndex < 0 ||
    lines[firstSectionIndex].trim() !== IDENTIFICATION_HEADING ||
    lines.filter((line) => line.trim() === IDENTIFICATION_HEADING).length !== 1
  ) {
    return failure(
      "METADATA_INVALID",
      "A seção canônica de identificação está ausente ou duplicada.",
    );
  }

  const nextSectionOffset = lines
    .slice(firstSectionIndex + 1)
    .findIndex((line) => line.startsWith("## "));
  const sectionEndIndex =
    nextSectionOffset < 0
      ? lines.length
      : firstSectionIndex + 1 + nextSectionOffset;
  const identificationLines = lines.slice(firstSectionIndex + 1, sectionEndIndex);
  const metadata = new Map<string, string[]>();

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    const isRequiredMetadataItem = REQUIRED_METADATA_ITEM_PATTERN.test(line);
    if (!isRequiredMetadataItem) continue;

    const isInsideIdentification =
      index > firstSectionIndex && index < sectionEndIndex;
    const match = METADATA_ITEM_PATTERN.exec(line);
    if (!isInsideIdentification || !match) {
      return failure(
        "METADATA_INVALID",
        "A metadata obrigatória está fora da seção ou possui sintaxe inválida.",
      );
    }

    if (!match) continue;
    const values = metadata.get(match[1]) ?? [];
    values.push(match[2]);
    metadata.set(match[1], values);
  }

  if (
    REQUIRED_METADATA_KEYS.some((key) => (metadata.get(key)?.length ?? 0) !== 1)
  ) {
    return failure(
      "METADATA_INVALID",
      "Cada chave obrigatória deve possuir exatamente um item canônico.",
    );
  }

  if (
    metadata.get("taxon_slug")?.[0] !== expectedTaxonSlug ||
    metadata.get("audience_scope")?.[0] !==
      END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE ||
    metadata.get("research_version")?.[0] !== String(expectedResearchVersion)
  ) {
    return failure(
      "METADATA_INVALID",
      "A metadata não corresponde à identidade solicitada.",
    );
  }

  if (lines.slice(sectionEndIndex).join("\n").trim().length === 0) {
    return failure(
      "CONTENT_EMPTY",
      "A pesquisa não possui conteúdo após a identificação.",
    );
  }

  return { ok: true };
}

function containsPathTraversal(slug: string): boolean {
  return (
    slug.includes("/") ||
    slug.includes("\\") ||
    slug === "." ||
    slug === ".." ||
    slug.startsWith("..")
  );
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === code
  );
}

function failure(
  code: EndCustomerResearchErrorCode,
  message: string,
): LoadEndCustomerResearchCandidateResult {
  return Object.freeze({
    ok: false,
    error: Object.freeze({ code, message }),
  });
}
