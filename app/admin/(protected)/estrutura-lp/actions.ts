"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  initializeAdminInputCatalogDraft,
  prepareAdminInputCatalogPublication,
  reconcileAdminInputCatalogPublishedDraft,
  saveAdminInputCatalogDraft,
  validateAdminInputCatalogDraft,
} from "@/lib/admin/adapters/adminInputCatalogLifecycleAdapter";

export type InputCatalogLifecycleActionState = Readonly<{
  error: string | null;
  message: string | null;
  handoff: string | null;
  revision: number;
}>;

export const initialInputCatalogLifecycleActionState: InputCatalogLifecycleActionState = {
  error: null,
  message: null,
  handoff: null,
  revision: 0,
};

export async function initializeInputCatalogDraftAction(
  previous: InputCatalogLifecycleActionState,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const result = await initializeAdminInputCatalogDraft({
    actorUserId: actor.actorUserId,
  });
  return complete(previous, result, "Draft sequencial criado sem efeito operacional.");
}

export async function saveInputCatalogDraftAction(
  previous: InputCatalogLifecycleActionState,
  formData: FormData,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const result = await saveAdminInputCatalogDraft({
    actorUserId: actor.actorUserId,
    expectedRevision: Number(formData.get("expectedRevision")),
    catalogJson: String(formData.get("catalogJson") ?? ""),
  });
  return complete(previous, result, "Draft salvo; evidências anteriores foram invalidadas.");
}

export async function validateInputCatalogDraftAction(
  previous: InputCatalogLifecycleActionState,
  formData: FormData,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const result = await validateAdminInputCatalogDraft({
    actorUserId: actor.actorUserId,
    expectedRevision: Number(formData.get("expectedRevision")),
  });
  return complete(previous, result, "Draft e impacto foram revalidados sobre o conteúdo atual.");
}

export async function prepareInputCatalogPublicationAction(
  previous: InputCatalogLifecycleActionState,
  formData: FormData,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const result = await prepareAdminInputCatalogPublication({
    actorUserId: actor.actorUserId,
    expectedRevision: Number(formData.get("expectedRevision")),
  });
  return complete(
    previous,
    result,
    "Handoff congelado. A versão atual não mudou e depende de materialização, revisão, merge e deploy.",
  );
}

export async function reconcileInputCatalogPublishedDraftAction(
  previous: InputCatalogLifecycleActionState,
  formData: FormData,
): Promise<InputCatalogLifecycleActionState> {
  const actor = await requirePlatformAdmin();
  if (!actor.allowed) return denied(previous);
  const result = await reconcileAdminInputCatalogPublishedDraft({
    expectedRevision: Number(formData.get("expectedRevision")),
    runtimeEnvironment: process.env.VERCEL_ENV,
  });
  return complete(
    previous,
    result,
    "O draft temporário foi reconciliado com o registry já implantado.",
  );
}

function complete(
  previous: InputCatalogLifecycleActionState,
  result: Awaited<ReturnType<typeof initializeAdminInputCatalogDraft>>,
  message: string,
): InputCatalogLifecycleActionState {
  const revision = nextRevision(previous.revision);
  if (!result.ok) {
    return { error: result.message, message: null, handoff: null, revision };
  }
  revalidatePath("/admin/estrutura-lp");
  return {
    error: null,
    message,
    handoff: result.handoff ?? null,
    revision,
  };
}

function denied(
  previous: InputCatalogLifecycleActionState,
): InputCatalogLifecycleActionState {
  return {
    error: "Acesso administrativo não autorizado.",
    message: null,
    handoff: null,
    revision: nextRevision(previous.revision),
  };
}

function nextRevision(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value + 1 : 1;
}
