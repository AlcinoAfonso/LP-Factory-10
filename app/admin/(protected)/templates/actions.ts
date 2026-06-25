"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  readPublishContext,
  validatePublicationResult,
} from "@/lib/admin/adapters/adminCommercialActivationTemplatesAdapter";
import { createClient } from "@/lib/supabase/server";
import { generateCommercialActivationDraftForTaxon } from "@/conversion-content/commercial-activation/draft-generation";

export type GenerateCommercialActivationDraftActionState = {
  error: string | null;
  artifactId?: string;
  artifactVersion?: number;
  requestId?: string;
};

export async function generateCommercialActivationDraftAction(input: {
  taxonSlug: string;
}): Promise<GenerateCommercialActivationDraftActionState> {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    return { error: "Acesso administrativo nao autorizado." };
  }

  const taxonSlug = input.taxonSlug.trim();
  if (!isSafeSlug(taxonSlug)) {
    return { error: "invalid_taxon_slug" };
  }

  const result = await generateCommercialActivationDraftForTaxon({
    taxonSlug,
  });

  if (!result.ok) {
    return {
      error: result.reason,
      requestId: result.requestId,
    };
  }

  return {
    error: null,
    artifactId: result.artifactId,
    artifactVersion: result.artifactVersion,
    requestId: result.requestId,
  };
}

export async function generateOrRegenerateCommercialActivationDraftAction(
  formData: FormData,
) {
  const taxonSlug = String(formData.get("taxonSlug") ?? "").trim();
  const result = await generateCommercialActivationDraftAction({ taxonSlug });
  const taxonQuery = encodeURIComponent(taxonSlug);

  revalidatePath("/admin/templates");

  if (result.error) {
    redirect(
      `/admin/templates?taxon=${taxonQuery}&event=generation_failed&reason=${encodeURIComponent(
        result.error,
      )}&requestId=${encodeURIComponent(result.requestId ?? "")}`,
    );
  }

  redirect(
    `/admin/templates?taxon=${taxonQuery}&event=draft_generated&artifactId=${encodeURIComponent(
      result.artifactId ?? "",
    )}&artifactVersion=${encodeURIComponent(String(result.artifactVersion ?? ""))}`,
  );
}

export async function publishCommercialActivationDraftAction(formData: FormData) {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    redirect("/admin/templates?event=publish_failed&reason=unauthorized");
  }

  const artifactId = String(formData.get("artifactId") ?? "").trim();
  if (!isUuid(artifactId)) {
    redirect("/admin/templates?event=publish_failed&reason=invalid_artifact");
  }

  const context = await readPublishContext(artifactId);
  if (!context.ok) {
    redirect(
      `/admin/templates?event=publish_failed&reason=${encodeURIComponent(
        context.reason,
      )}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_content_artifact_draft", {
    p_artifact_id: artifactId,
  });

  if (error) {
    console.error("publishCommercialActivationDraftAction failed", {
      code: error.code,
      message: error.message,
    });
    redirect("/admin/templates?event=publish_failed&reason=rpc_failed");
  }

  const validation = await validatePublicationResult({
    targetArtifactId: artifactId,
    previousPublishedId: context.previousPublishedId,
  });

  revalidatePath("/admin/templates");

  if (!validation.ok) {
    redirect(
      `/admin/templates?event=publish_failed&reason=${encodeURIComponent(
        validation.reason,
      )}`,
    );
  }

  redirect(
    `/admin/templates?event=published&artifactId=${encodeURIComponent(
      artifactId,
    )}&publishedCount=${validation.publishedCount}&previousArchived=${String(
      validation.previousArchived,
    )}`,
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isSafeSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
