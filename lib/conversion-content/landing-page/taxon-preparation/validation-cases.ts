import assert from "node:assert/strict";

import type {
  EndCustomerResearchErrorCode,
  LoadEndCustomerResearchCandidateInput,
  LoadEndCustomerResearchCandidateResult,
} from "./contracts";
import { loadEndCustomerResearchCandidate } from "./index";
import { loadEndCustomerResearchCandidateForValidation } from "./research";

const VALID_INPUT: LoadEndCustomerResearchCandidateInput = {
  taxon: { slug: "corretor-imoveis", isActive: true },
  researchVersion: 1,
};

type ValidationCase = Readonly<{
  name: string;
  run: () => Promise<void>;
}>;

const cases: readonly ValidationCase[] = [
  {
    name: "loads the archived research integrally from the canonical path",
    run: async () => {
      const result = assertSuccess(
        await loadEndCustomerResearchCandidate(VALID_INPUT),
      );
      assert.equal(result.taxonSlug, "corretor-imoveis");
      assert.equal(result.audienceScope, "end_customer");
      assert.equal(result.researchVersion, 1);
      assert.equal(
        result.relativePath,
        "corretor-imoveis/end_customer/v1.md",
      );
      assert.match(result.content, /^# Pesquisa bruta - Corretor Imóveis/);
      assert.match(result.content, /## 3\. Núcleo estratégico/);
    },
  },
  {
    name: "rejects a non-positive or non-integer version before reading",
    run: async () => {
      let reads = 0;
      const reader = async () => {
        reads += 1;
        return validContent();
      };

      assertFailure(
        await loadEndCustomerResearchCandidateForValidation(
          { ...VALID_INPUT, researchVersion: 0 },
          { readResearchFile: reader },
        ),
        "INVALID_RESEARCH_VERSION",
      );
      assertFailure(
        await loadEndCustomerResearchCandidateForValidation(
          { ...VALID_INPUT, researchVersion: 1.5 },
          { readResearchFile: reader },
        ),
        "INVALID_RESEARCH_VERSION",
      );
      assert.equal(reads, 0);
    },
  },
  {
    name: "rejects path traversal before reading",
    run: async () => {
      let reads = 0;
      const result = await loadEndCustomerResearchCandidateForValidation(
        {
          taxon: { slug: "../corretor-imoveis", isActive: true },
          researchVersion: 1,
        },
        {
          readResearchFile: async () => {
            reads += 1;
            return validContent();
          },
        },
      );

      assertFailure(result, "PATH_OUTSIDE_RESEARCH_ROOT");
      assert.equal(reads, 0);
    },
  },
  {
    name: "distinguishes a missing file from an operational read failure",
    run: async () => {
      const missing = Object.assign(new Error("missing"), { code: "ENOENT" });
      const denied = Object.assign(new Error("denied"), { code: "EACCES" });

      assertFailure(
        await loadWithReader(async () => Promise.reject(missing)),
        "FILE_NOT_FOUND",
      );
      assertFailure(
        await loadWithReader(async () => Promise.reject(denied)),
        "READ_FAILED",
      );
    },
  },
  {
    name: "rejects missing, duplicate, malformed or divergent metadata",
    run: async () => {
      assertFailure(
        await loadWithContent(
          validContent().replace("- `taxon_slug`: `corretor-imoveis`\n", ""),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `taxon_slug`: `corretor-imoveis`",
            "- `taxon_slug`: `corretor-imoveis`\n- `taxon_slug`: `corretor-imoveis`",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `research_version`: `1`",
            "- research_version: 1",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `audience_scope`: `end_customer`",
            "- `audience_scope`: `business_buyer`",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          `${validContent()}\n- \`research_version\`: \`1\``,
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `research_version`: `1`",
            "- `research_version`: `1`\n- research_version: 1",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `research_version`: `1`",
            "- `research_version`: `1`\n- research_version = 1",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "# Pesquisa bruta - Corretor Imóveis",
            "# Pesquisa bruta - Corretor Imóveis\n- `research_version`: `1`",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(`${validContent()}\n- research_version: 1`),
        "METADATA_INVALID",
      );
    },
  },
  {
    name: "rejects content empty after identification",
    run: async () => {
      assertFailure(
        await loadWithContent(
          [
            "# Pesquisa bruta - Corretor Imóveis",
            "",
            "## 1. Identificação e uso",
            "",
            "- `taxon_slug`: `corretor-imoveis`",
            "- `audience_scope`: `end_customer`",
            "- `research_version`: `1`",
          ].join("\n"),
        ),
        "CONTENT_EMPTY",
      );
    },
  },
  {
    name: "rejects an inactive taxon without returning partial content",
    run: async () => {
      assertFailure(
        await loadEndCustomerResearchCandidate({
          ...VALID_INPUT,
          taxon: { ...VALID_INPUT.taxon, isActive: false },
        }),
        "TAXON_INACTIVE",
      );
    },
  },
];

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

async function run(): Promise<void> {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

function validContent(): string {
  return [
    "# Pesquisa bruta - Corretor Imóveis",
    "",
    "## 1. Identificação e uso",
    "",
    "- `taxon_name`: Corretor Imóveis",
    "- `taxon_slug`: `corretor-imoveis`",
    "- `audience_scope`: `end_customer`",
    "- `research_version`: `1`",
    "",
    "## 2. Conteúdo",
    "",
    "Conteúdo integral preservado.",
  ].join("\n");
}

async function loadWithContent(
  content: string,
): Promise<LoadEndCustomerResearchCandidateResult> {
  return loadWithReader(async () => content);
}

async function loadWithReader(
  reader: () => Promise<string>,
): Promise<LoadEndCustomerResearchCandidateResult> {
  return loadEndCustomerResearchCandidateForValidation(VALID_INPUT, {
    readResearchFile: reader,
  });
}

function assertSuccess(
  result: LoadEndCustomerResearchCandidateResult,
) {
  if (!result.ok) assert.fail(`Expected success, received ${result.error.code}`);
  assert.equal(result.ok, true);
  return result.value;
}

function assertFailure(
  result: LoadEndCustomerResearchCandidateResult,
  code: EndCustomerResearchErrorCode,
): void {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected failure");
  assert.equal(result.error.code, code);
  assert.equal("value" in result, false);
}
