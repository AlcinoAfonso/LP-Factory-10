import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  mediumStandardRealEstateBrokerTaxon,
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  resolveLandingPageInputCatalog,
  type ResolvedLandingPageInputField,
} from "../conversion-content/landing-page/input-catalog";
import type {
  AccountLandingPageOnboardingFieldState,
  AccountLandingPageOnboardingStoredValues,
} from "./contracts";
import {
  getAccountLandingPageOnboardingConfigurationFromClient,
  saveAccountLandingPageOnboardingConfigurationFromClient,
} from "./adapters/onboardingConfigurationAdapterCore";
import {
  isAccountLandingPageOnboardingActorAuthorized,
  isUnavailableOnboardingConfigurationError,
  resolveAccountLandingPageOnboardingConfiguration,
  stripAuthoritativeOnboardingValues,
} from "./onboardingConfiguration";

const taxonChain = {
  segment: realEstateSegmentTaxon,
  niche: realEstateBrokerNicheTaxon,
  ultraNiche: mediumStandardRealEstateBrokerTaxon,
};

const catalog = resolveLandingPageInputCatalog({
  version: 2,
  plan: "starter",
  taxonChain,
});
assert.equal(catalog.ok, true);
const resolvedCatalog = catalog.value;

const segmentCatalog = resolveLandingPageInputCatalog({
  version: 2,
  plan: "starter",
  taxonChain: { segment: realEstateSegmentTaxon },
});
assert.equal(segmentCatalog.ok, true);

const allValidValues = validValuesFor(resolvedCatalog.fields);
const segmentValidValues = validValuesFor(segmentCatalog.value.fields);

function validValuesFor(fields: readonly ResolvedLandingPageInputField[]) {
  return Object.fromEntries(
    fields
    .filter((field) => field.fieldKey !== "brand_logo_asset")
    .map((field) => [
      field.fieldKey,
      { scope: field.valueScope, value: validValue(field) },
    ]),
  ) as AccountLandingPageOnboardingStoredValues;
}

const cases: ReadonlyArray<
  Readonly<{ name: string; run: () => void | Promise<void> }>
> = [
  {
    name: "partial valid progress is accepted while completeness stays derived",
    run: () => {
      const result = resolve({
        business_display_name: {
          scope: "business",
          value: "Conta parcial",
        },
      });
      assert.equal(result.ok, true, JSON.stringify(result));
      assert.equal(result.configuration.complete, false);
      assert.ok(result.configuration.missingRequiredFieldKeys.length > 0);
      assert.equal(result.configuration.revision, 1);
    },
  },
  {
    name: "all applicable required values complete without optional logo",
    run: () => {
      const result = resolve(allValidValues);
      assert.equal(result.ok, true);
      assert.equal(result.configuration.complete, true);
      assert.deepEqual(result.configuration.missingRequiredFieldKeys, []);
      const logo = result.configuration.fields.find(
        (field) => field.field.fieldKey === "brand_logo_asset",
      );
      assert.equal(logo?.source, "missing");
      assert.equal(logo?.required, false);
    },
  },
  {
    name: "authoritative values are reused without being copied to storage",
    run: () => {
      const input = {
        business_display_name: {
          scope: "business" as const,
          value: "Nome do agregado",
        },
        primary_service_or_offer: {
          scope: "offer" as const,
          value: "Oferta",
        },
      };
      const authoritative = { business_display_name: "Nome autoritativo" };
      const persistable = stripAuthoritativeOnboardingValues(
        input,
        authoritative,
      );
      assert.deepEqual(persistable, {
        primary_service_or_offer: { scope: "offer", value: "Oferta" },
      });
      const result = resolve(persistable, authoritative);
      assert.equal(result.ok, true);
      const field = result.configuration.fields.find(
        (candidate) => candidate.field.fieldKey === "business_display_name",
      );
      assert.equal(field?.source, "authoritative");
      assert.equal(field?.value, "Nome autoritativo");
      assert.equal(
        Object.hasOwn(
          result.configuration.storedValues,
          "business_display_name",
        ),
        false,
      );
    },
  },
  {
    name: "only active owners and admins can mutate the configuration",
    run: () => {
      assert.equal(
        isAccountLandingPageOnboardingActorAuthorized({ role: "owner", status: "active" }),
        true,
      );
      assert.equal(
        isAccountLandingPageOnboardingActorAuthorized({ role: "admin", status: "active" }),
        true,
      );
      assert.equal(
        isAccountLandingPageOnboardingActorAuthorized({ role: "editor", status: "active" }),
        false,
      );
      assert.equal(
        isAccountLandingPageOnboardingActorAuthorized({ role: "owner", status: "inactive" }),
        false,
      );
    },
  },
  {
    name: "scope drift unknown keys and invalid values fail closed",
    run: () => {
      const scopeDrift = resolve({
        business_display_name: {
          scope: "campaign",
          value: "Conta",
        },
      });
      assert.deepEqual(scopeDrift, {
        ok: false,
        error: "INVALID_CONFIGURATION",
        fieldKey: "business_display_name",
      });

      const unknown = resolve({
        invented_field: { scope: "account", value: "x" },
      });
      assert.deepEqual(unknown, {
        ok: false,
        error: "INVALID_CONFIGURATION",
        fieldKey: "invented_field",
      });

      const invalid = resolve({
        brand_color_palette: {
          scope: "business",
          value: { primary: "red" },
        },
      });
      assert.deepEqual(invalid, {
        ok: false,
        error: "INVALID_CONFIGURATION",
        fieldKey: "brand_color_palette",
      });
    },
  },
  {
    name: "tenant identity remains explicit for two independent accounts",
    run: () => {
      const first = resolve(allValidValues, {}, "10000000-0000-4000-8000-000000000001");
      const second = resolve(allValidValues, {}, "20000000-0000-4000-8000-000000000002");
      assert.equal(first.ok, true);
      assert.equal(second.ok, true);
      assert.notEqual(first.configuration.accountId, second.configuration.accountId);
      assert.deepEqual(first.configuration.storedValues, second.configuration.storedValues);
    },
  },
  {
    name: "unavailable Data API object is distinct from absence and operational failure",
    run: () => {
      assert.equal(
        isUnavailableOnboardingConfigurationError({ code: "42P01", message: "relation does not exist" }),
        true,
      );
      assert.equal(
        isUnavailableOnboardingConfigurationError({ code: "PGRST205", message: "schema cache" }),
        true,
      );
      assert.equal(
        isUnavailableOnboardingConfigurationError({ code: "42501", message: "permission denied" }),
        false,
      );
      assert.equal(isUnavailableOnboardingConfigurationError(null), false);
    },
  },
  {
    name: "adapter preserves legitimate absence as a resumable empty configuration",
    run: async () => {
      const client = runtimeClient([
        response("accounts", accountRow()),
        response("account_users", { role: "owner", status: "active" }),
        response("account_taxonomy", { taxon_id: realEstateSegmentTaxon.id }),
        response("business_taxons", taxonRow()),
        response("account_landing_page_onboarding_configurations", null),
      ]);
      const result = await getAccountLandingPageOnboardingConfigurationFromClient(
        { accountId: ACCOUNT_ID, actorUserId: ACTOR_ID },
        client,
        eligibleEntitlement,
      );
      assert.equal(result.ok, true);
      assert.equal(result.configuration.revision, 0);
      assert.equal(result.configuration.complete, false);
      assert.deepEqual(result.configuration.storedValues, {});
    },
  },
  {
    name: "E10.4 whatsapp profile does not become an authoritative landing-page value",
    run: async () => {
      const e10Profile = {
        preferred_channel: "whatsapp",
        whatsapp: "11999999999",
        site_url: null,
      };
      assert.match(e10Profile.whatsapp, /^\d{10,15}$/);

      const client = runtimeClient([
        ...runtimeGateResponses(),
        response("account_landing_page_onboarding_configurations", null),
      ]);
      const result = await getAccountLandingPageOnboardingConfigurationFromClient(
        { accountId: ACCOUNT_ID, actorUserId: ACTOR_ID },
        client,
        eligibleEntitlement,
      );

      assert.equal(result.ok, true, JSON.stringify(result));
      assert.equal(
        client.calls.some((call) => call.relation === "account_profiles"),
        false,
      );
      for (const fieldKey of [
        "primary_conversion_channel",
        "whatsapp_destination",
        "external_url_destination",
      ]) {
        const matchingField: AccountLandingPageOnboardingFieldState | undefined =
          result.configuration.fields.find(
            (candidate) => candidate.field.fieldKey === fieldKey,
          );
        assert.equal(matchingField?.source, "missing");
      }
    },
  },
  {
    name: "adapter classifies unavailable table separately from operational read failure",
    run: async () => {
      const unavailable = runtimeClient([
        ...runtimeGateResponses(),
        response("account_landing_page_onboarding_configurations", null, {
          code: "PGRST205",
          message: "Could not find the table in the schema cache",
        }),
      ]);
      assert.deepEqual(
        await getAccountLandingPageOnboardingConfigurationFromClient(
          { accountId: ACCOUNT_ID, actorUserId: ACTOR_ID },
          unavailable,
          eligibleEntitlement,
        ),
        { ok: false, error: "configuration_unavailable" },
      );

      const failed = runtimeClient([
        ...runtimeGateResponses(),
        response("account_landing_page_onboarding_configurations", null, {
          code: "42501",
          message: "permission denied",
        }),
      ]);
      assert.deepEqual(
        await getAccountLandingPageOnboardingConfigurationFromClient(
          { accountId: ACCOUNT_ID, actorUserId: ACTOR_ID },
          failed,
          eligibleEntitlement,
        ),
        { ok: false, error: "read_failed" },
      );
    },
  },
  {
    name: "adapter strips authoritative values before the first aggregate insert",
    run: async () => {
      const client = runtimeClient([
        ...runtimeGateResponses(),
        response("account_landing_page_onboarding_configurations", null),
        response("account_landing_page_onboarding_configurations", {
          account_id: ACCOUNT_ID,
          landing_page_id: null,
          catalog_version: 2,
          values: stripAuthoritativeOnboardingValues(segmentValidValues, {
            business_display_name: "Conta de teste",
          }),
          revision: 1,
        }, null, "insert"),
      ]);
      const result = await saveAccountLandingPageOnboardingConfigurationFromClient(
        {
          accountId: ACCOUNT_ID,
          actorUserId: ACTOR_ID,
          catalogVersion: 2,
          expectedRevision: 0,
          values: segmentValidValues,
        },
        client,
        eligibleEntitlement,
      );
      assert.equal(result.ok, true, JSON.stringify(result));
      const insert = client.calls.find((call) => call.operation === "insert");
      assert.ok(insert && isObject(insert.payload));
      assert.equal(
        Object.hasOwn(
          (insert.payload as { values: Record<string, unknown> }).values,
          "business_display_name",
        ),
        false,
      );
    },
  },
  {
    name: "adapter rejects a non-object values payload before any read or write",
    run: async () => {
      const client = runtimeClient([]);
      const result = await saveAccountLandingPageOnboardingConfigurationFromClient(
        {
          accountId: ACCOUNT_ID,
          actorUserId: ACTOR_ID,
          catalogVersion: 2,
          expectedRevision: 0,
          values: null as unknown as AccountLandingPageOnboardingStoredValues,
        },
        client,
        eligibleEntitlement,
      );

      assert.deepEqual(result, { ok: false, error: "invalid_values" });
      assert.deepEqual(client.calls, []);
    },
  },
  {
    name: "adapter uses maxAffected and classifies a zero-row stale update",
    run: async () => {
      const client = runtimeClient([
        ...runtimeGateResponses(),
        response("account_landing_page_onboarding_configurations", {
          account_id: ACCOUNT_ID,
          landing_page_id: null,
          catalog_version: 2,
          values: {},
          revision: 1,
        }),
        response("account_landing_page_onboarding_configurations", null, null, "update"),
        response("account_landing_page_onboarding_configurations", { revision: 2 }),
      ]);
      const result = await saveAccountLandingPageOnboardingConfigurationFromClient(
        {
          accountId: ACCOUNT_ID,
          actorUserId: ACTOR_ID,
          catalogVersion: 2,
          expectedRevision: 1,
          values: {},
        },
        client,
        eligibleEntitlement,
      );
      assert.deepEqual(result, { ok: false, error: "revision_conflict" });
      const update = client.calls.find((call) => call.operation === "update");
      assert.equal(update?.maxAffected, 1);
      assert.deepEqual(update?.filters, [
        ["account_id", ACCOUNT_ID],
        ["revision", 1],
      ]);
    },
  },
  {
    name: "migration encodes tenant FK write-once RLS grants and optimistic update guard",
    run: () => {
      const migration = readFileSync(
        new URL(
          "../../supabase/migrations/20260807162417_e19_2_3_account_landing_page_onboarding_configuration.sql",
          import.meta.url,
        ),
        "utf8",
      );
      const adapter = readFileSync(
        new URL("./adapters/onboardingConfigurationAdapterCore.ts", import.meta.url),
        "utf8",
      );
      assert.match(migration, /foreign key \(landing_page_id, account_id\)/i);
      assert.match(migration, /security invoker\s+set search_path = ''/i);
      assert.match(migration, /old\.landing_page_id is not null/i);
      assert.match(migration, /new\.landing_page_id is distinct from old\.landing_page_id/i);
      assert.match(migration, /enable row level security/i);
      assert.match(migration, /grant select, insert, update[\s\S]+to service_role/i);
      assert.doesNotMatch(migration, /grant[^;]*delete[^;]*service_role/i);
      assert.match(adapter, /\.eq\("account_id", runtime\.context\.account\.id\)/);
      assert.match(adapter, /\.eq\("revision", input\.expectedRevision\)[\s\S]+\.maxAffected\(1\)/);
      assert.match(adapter, /if \(!data\) \{[\s\S]+classifyZeroRowMutation/);
    },
  },
];

function resolve(
  storedValues: AccountLandingPageOnboardingStoredValues,
  authoritativeValues: Readonly<Record<string, unknown>> = {},
  accountId = "00000000-0000-4000-8000-000000000001",
) {
  return resolveAccountLandingPageOnboardingConfiguration({
    accountId,
    landingPageId: null,
    catalogVersion: 2,
    revision: 1,
    planKey: "starter",
    taxonChain,
    storedValues,
    authoritativeValues,
  });
}

function validValue(field: ResolvedLandingPageInputField): unknown {
  switch (field.valueType) {
    case "string":
      return `Valor para ${field.fieldKey}`;
    case "phone":
      return "+5511999999999";
    case "email":
      return "contato@example.com";
    case "url":
      return "https://example.com";
    case "enum":
      return field.validation.kind === "enum"
        ? field.validation.allowedValues[0]
        : "invalid";
    case "string_list":
      return field.validation.kind === "string_list" &&
        field.validation.allowedValues?.length
        ? [field.validation.allowedValues[0]]
        : ["Item valido"];
    case "boolean":
      return true;
    case "number_range": {
      const minimum =
        field.validation.kind === "number_range"
          ? field.validation.minimum ?? 0
          : 0;
      const maximum =
        field.validation.kind === "number_range"
          ? field.validation.maximum ?? minimum
          : minimum;
      return { minimum, maximum, currency: "BRL" };
    }
    case "keyword_map":
      return [
        {
          keyword_or_cluster: "termo principal",
          message_anchor: "mensagem factual",
        },
      ];
    case "asset_reference":
      return { asset_id: "asset-canonico" };
    case "color_palette":
      return {
        primary: "#123456",
        secondary: "#234567",
        accent: "#345678",
        background: "#ffffff",
        text: "#111111",
      };
  }
}

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000101";
const ACTOR_ID = "00000000-0000-4000-8000-000000000102";

async function eligibleEntitlement() {
  return {
    isCommerciallyEligible: true,
    effectiveStatus: "ativo",
    planKey: "starter",
  };
}

function runtimeGateResponses(): ScriptedResponse[] {
  return [
    response("accounts", accountRow()),
    response("account_users", { role: "owner", status: "active" }),
    response("account_taxonomy", { taxon_id: realEstateSegmentTaxon.id }),
    response("business_taxons", taxonRow()),
  ];
}

function accountRow() {
  return { id: ACCOUNT_ID, name: "Conta de teste", status: "active" };
}

function taxonRow() {
  return {
    id: realEstateSegmentTaxon.id,
    name: realEstateSegmentTaxon.name,
    slug: realEstateSegmentTaxon.slug,
    level: realEstateSegmentTaxon.level,
    is_active: true,
    parent_id: null,
  };
}

type ScriptedResponse = Readonly<{
  relation: string;
  operation: "select" | "insert" | "update";
  data: unknown;
  error: unknown;
}>;

type RecordedCall = {
  relation: string;
  operation: "select" | "insert" | "update";
  payload?: unknown;
  filters: Array<[string, unknown]>;
  maxAffected?: number;
};

function response(
  relation: string,
  data: unknown,
  error: unknown = null,
  operation: ScriptedResponse["operation"] = "select",
): ScriptedResponse {
  return { relation, operation, data, error };
}

function runtimeClient(responses: ScriptedResponse[]) {
  return new ScriptedClient(responses);
}

class ScriptedClient {
  readonly calls: RecordedCall[] = [];
  private readonly responses: ScriptedResponse[];

  constructor(responses: ScriptedResponse[]) {
    this.responses = [...responses];
  }

  from(relation: string) {
    return new ScriptedQuery(this, relation);
  }

  take(call: RecordedCall) {
    this.calls.push(call);
    const next = this.responses.shift();
    assert.ok(next, `unexpected query for ${call.relation}`);
    assert.equal(next.relation, call.relation);
    assert.equal(next.operation, call.operation);
    return Promise.resolve({ data: next.data, error: next.error });
  }
}

class ScriptedQuery {
  private operation: RecordedCall["operation"] = "select";
  private payload: unknown;
  private readonly filters: Array<[string, unknown]> = [];
  private maximum?: number;

  constructor(
    private readonly client: ScriptedClient,
    private readonly relation: string,
  ) {}

  select() {
    return this;
  }

  insert(payload: unknown) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  limit() {
    return this;
  }

  maxAffected(value: number) {
    this.maximum = value;
    return this;
  }

  maybeSingle() {
    return this.client.take({
      relation: this.relation,
      operation: this.operation,
      payload: this.payload,
      filters: [...this.filters],
      maxAffected: this.maximum,
    });
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function runCases() {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

void runCases().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
