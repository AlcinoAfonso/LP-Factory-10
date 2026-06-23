import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE,
  COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY,
  type CommercialActivationBundleResult,
  type CommercialActivationContentTaxon,
  type CommercialActivationHierarchicalResolutionResult,
} from "../contracts";
import {
  mapContentComposition,
  mapPublishedContentArtifact,
} from "../validation";
import { resolveCommercialActivationHierarchicalBundle } from "../commercial-activation/hierarchical-resolve";
import { resolveCommercialActivationRenderModel } from "../commercial-activation/resolve";

const TEMPLATE_COLUMNS =
  "id,template_key,name,slug,template_family,template_scope,status,version,is_active,payload_json";

export async function getCommercialActivationBundle(input: {
  taxonId: string;
}): Promise<CommercialActivationBundleResult> {
  const taxonId = input.taxonId.trim();
  if (!taxonId) return { status: "composition_not_found" };

  const supabase = createServiceClient();

  try {
    const { data: templateLinkRow, error: templateLinkError } = await supabase
      .from("content_template_taxons")
      .select(
        `id,template_id,taxon_id,is_primary,priority,created_at,template:content_templates!content_template_taxons_template_id_fkey!inner(${TEMPLATE_COLUMNS})`,
      )
      .eq("taxon_id", taxonId)
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

    if (templateLinkError) throw templateLinkError;
    if (!templateLinkRow) return { status: "composition_not_found" };

    const templateLinkData = templateLinkRow as Record<string, unknown>;
    const templateId = templateLinkData.template_id;
    if (typeof templateId !== "string" || !templateId) {
      return { status: "composition_not_found" };
    }

    const { data: compositionRow, error: compositionError } = await supabase
      .from("content_template_compositions")
      .select("id,template_id,taxon_id,version,status")
      .eq("template_id", templateId)
      .eq("taxon_id", taxonId)
      .eq("status", "active")
      .maybeSingle();

    if (compositionError) throw compositionError;
    if (!compositionRow) return { status: "composition_not_found" };

    const compositionData = compositionRow as Record<string, unknown>;
    const { data: itemRows, error: itemsError } = await supabase
      .from("content_template_composition_items")
      .select(
        `id,composition_id,module_template_id,variant_key,sort_order,is_required,config_json,module:content_templates!content_template_composition_items_module_template_id_fkey!inner(${TEMPLATE_COLUMNS})`,
      )
      .eq("composition_id", compositionData.id as string)
      .eq("module.template_family", COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY)
      .eq("module.template_scope", "section")
      .eq("module.status", "active")
      .eq("module.is_active", true)
      .order("sort_order", { ascending: true });

    if (itemsError) throw itemsError;

    const composition = mapContentComposition({
      composition: compositionData,
      template: templateLinkData.template,
      items: (itemRows ?? []) as unknown[],
    });
    if (!composition) return { status: "composition_invalid" };

    const { data: artifactRow, error: artifactError } = await supabase
      .from("content_artifacts")
      .select(
        "id,template_id,composition_id,taxon_id,audience_scope,template_version,composition_version,research_version,artifact_version,status,content_json,provenance_json,published_at",
      )
      .eq("template_id", composition.template.id)
      .eq("composition_id", composition.id)
      .eq("taxon_id", taxonId)
      .eq("audience_scope", COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE)
      .eq("status", "published")
      .limit(1)
      .maybeSingle();

    if (artifactError) throw artifactError;
    if (!artifactRow) return { status: "artifact_not_found" };

    const artifactData = artifactRow as Record<string, unknown>;
    const { data: sourceRows, error: sourceError } = await supabase
      .from("content_artifact_research_sources")
      .select(
        "research_id,research:taxon_market_research!content_artifact_research_sources_research_id_fkey(research_block,version)",
      )
      .eq("artifact_id", artifactData.id as string);

    if (sourceError) throw sourceError;

    const artifact = mapPublishedContentArtifact({
      artifact: artifactData,
      researchSources: (sourceRows ?? []) as unknown[],
    });

    if (
      !artifact ||
      artifact.templateVersion !== composition.template.version ||
      artifact.compositionVersion !== composition.version
    ) {
      return { status: "artifact_invalid" };
    }

    const renderModel = resolveCommercialActivationRenderModel({
      composition,
      contentJson: artifact.content,
      logSafeWarning: (_message, details) => {
        console.warn("commercial activation optional section omitted", details);
      },
    });

    if (renderModel.status !== "ready") {
      console.warn("commercial activation published artifact invalid", {
        reason: renderModel.reason,
        artifactId: artifact.id,
        taxonId,
      });

      return { status: "artifact_invalid" };
    }

    return {
      status: "ready",
      bundle: { composition, artifact },
    };
  } catch (error) {
    console.error("getCommercialActivationBundle failed:", {
      code: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
    return { status: "read_failed" };
  }
}

export async function getCommercialActivationHierarchicalBundle(input: {
  taxonId: string;
}): Promise<CommercialActivationHierarchicalResolutionResult> {
  return resolveCommercialActivationHierarchicalBundle({
    taxonId: input.taxonId,
    readTaxon: getCommercialActivationTaxon,
    readBundle: getCommercialActivationBundle,
  });
}

async function getCommercialActivationTaxon(
  taxonId: string,
): Promise<CommercialActivationContentTaxon | null> {
  const normalizedTaxonId = taxonId.trim();
  if (!normalizedTaxonId) return null;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,parent_id,is_active")
    .eq("id", normalizedTaxonId)
    .maybeSingle();

  if (error) throw error;

  const row = data as Record<string, unknown> | null;
  if (!row || typeof row.id !== "string") return null;

  return {
    id: row.id,
    parentId: typeof row.parent_id === "string" ? row.parent_id : null,
    isActive: row.is_active === true,
  };
}
