"use server";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { generateCommercialActivationDraftForTaxon } from "@/conversion-content/commercial-activation/draft-generation";

export type GenerateCommercialActivationDraftActionState = {
  error: string | null;
  artifactId?: string;
  artifactVersion?: number;
  requestId?: string;
};

export async function generatePilotCommercialActivationDraftAction(): Promise<GenerateCommercialActivationDraftActionState> {
  const gate = await requirePlatformAdmin();

  if (!gate.allowed) {
    return { error: "Acesso administrativo nao autorizado." };
  }

  const result = await generateCommercialActivationDraftForTaxon();

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
