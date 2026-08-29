export const LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION = 1 as const;

export const landingPageDynamicResearchOutputSchema = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "status", "summary", "supplement"],
  properties: {
    schemaVersion: { type: "integer", const: LANDING_PAGE_DYNAMIC_RESEARCH_CONTRACT_VERSION },
    status: {
      type: "string",
      enum: ["material_delta", "no_material_delta", "insufficient_evidence"],
    },
    summary: { type: "string", minLength: 1, maxLength: 1200 },
    supplement: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["findings"],
          properties: {
            findings: {
              type: "array",
              minItems: 1,
              maxItems: 12,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["dimension", "insight", "sourceUrls"],
                properties: {
                  dimension: {
                    type: "string",
                    enum: [
                      "situations_jobs",
                      "pains_risks",
                      "objections",
                      "criteria_tradeoffs",
                      "alternatives",
                      "trust_proof",
                      "language_questions",
                      "current_volatile_context",
                    ],
                  },
                  insight: { type: "string", minLength: 1, maxLength: 1600 },
                  sourceUrls: {
                    type: "array",
                    minItems: 1,
                    maxItems: 8,
                    items: { type: "string", format: "uri", maxLength: 2048 },
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
} as const);
