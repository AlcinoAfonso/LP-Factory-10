import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY,
  type ContentComposition,
} from "../contracts";
import { mapContentComposition, isRecord } from "../validation";

const TEMPLATE_COLUMNS =
  "id,template_key,name,slug,template_family,template_scope,status,version,is_active,payload_json";

export type CommercialActivationCompositionResolution =
  | { status: "ready"; composition: ContentComposition }
  | { status: "composition_not_found" | "composition_invalid" };

export type CommercialActivationCompositionEnsureResult =
  | { status: "ready"; composition: ContentComposition; createdOrExisting: true }
  | {
      status:
        | "composition_not_found"
        | "composition_invalid"
        | "taxon_not_eligible"
        | "materialization_failed";
    };

export async function resolveCommercialActivationCompositionForTaxon(input: {
  taxonId: string;
}): Promise<CommercialActivationCompositionResolution> {
  const supabase = createServiceClient();

  const { data: templateLinkRow, error: templateLinkError } = await supabase
    .from("content_template_taxons")
    .select(
      `id,template_id,taxon_id,is_primary,priority,created_at,template:content_templates!content_template_taxons_template_id_fkey!inner(${TEMPLATE_COLUMNS})`,
    )
    .eq("taxon_id", input.taxonId)
    .eq("is_active", true)
    .eq("template.template_family", COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY)
    .eq("template.template_scope", "page")
    .eq("template.status", "active")
    .eq("template.is_active", true)
    .order("is_primary", { ascending: false })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (templateLinkError) throw new Error("template_link_read_failed");
  if (!isRecord(templateLinkRow) || !isString(templateLinkRow.template_id)) {
    return { status: "composition_not_found" };
  }

  const { data: compositionRow, error: compositionError } = await supabase
    .from("content_template_compositions")
    .select("id,template_id,taxon_id,version,status")
    .eq("template_id", templateLinkRow.template_id)
    .eq("taxon_id", input.taxonId)
    .eq("status", "active")
    .maybeSingle();

  if (compositionError) throw new Error("composition_read_failed");
  if (!compositionRow) return { status: "composition_not_found" };

  const compositionData = compositionRow as Record<string, unknown>;
  const compositionId = compositionData.id;
  if (!isString(compositionId)) return { status: "composition_invalid" };

  const { data: itemRows, error: itemsError } = await supabase
    .from("content_template_composition_items")
    .select(
      `id,composition_id,module_template_id,variant_key,sort_order,is_required,config_json,module:content_templates!content_template_composition_items_module_template_id_fkey!inner(${TEMPLATE_COLUMNS})`,
    )
    .eq("composition_id", compositionId)
    .eq("module.template_family", COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY)
    .eq("module.template_scope", "section")
    .eq("module.status", "active")
    .eq("module.is_active", true)
    .order("sort_order", { ascending: true });

  if (itemsError) throw new Error("composition_items_read_failed");

  const composition = mapContentComposition({
    composition: compositionRow,
    template: templateLinkRow.template,
    items: (itemRows ?? []) as unknown[],
  });

  return composition
    ? { status: "ready", composition }
    : { status: "composition_invalid" };
}

export async function ensureCommercialActivationCompositionForTaxon(input: {
  taxonId: string;
}): Promise<CommercialActivationCompositionEnsureResult> {
  const taxonId = input.taxonId.trim();
  if (!taxonId) return { status: "composition_not_found" };

  const existing = await resolveCommercialActivationCompositionForTaxon({
    taxonId,
  });
  if (existing.status === "ready") {
    return {
      status: "ready",
      composition: existing.composition,
      createdOrExisting: true,
    };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc(
    "ensure_commercial_activation_composition",
    {
      p_taxon_id: taxonId,
    },
  );

  if (error) {
    console.error("ensureCommercialActivationCompositionForTaxon failed", {
      code: error.code ?? "rpc_failed",
      message: error.message,
      taxonId,
    });

    if (
      error.message.includes("commercial_activation_taxon_not_active") ||
      error.message.includes("commercial_activation_research_incomplete")
    ) {
      return { status: "taxon_not_eligible" };
    }

    return { status: "materialization_failed" };
  }

  const ensured = await resolveCommercialActivationCompositionForTaxon({
    taxonId,
  });

  if (ensured.status !== "ready") {
    return { status: ensured.status };
  }

  return {
    status: "ready",
    composition: ensured.composition,
    createdOrExisting: true,
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
