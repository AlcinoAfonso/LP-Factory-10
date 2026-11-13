"use server";

import { revalidatePath } from "next/cache";
import { readAccountOfficialNiche, confirmAccountNicheDialogue } from "../../../lib/onboarding/niche-resolution/adapters/accountOfficialNicheAdapter";
import { officialNichePromptContext, type OfficialAccountNiche } from "../../../lib/onboarding/niche-resolution/official-niche-policy";
import { z } from "zod";
import { claimAccountNicheTurn, commitAccountNicheTurn, releaseAccountNicheTurn } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheDialogueAdapter";
import { attendanceSummary, projectAttendanceSummary, projectAttendanceText, type AttendanceContext } from "../../../lib/onboarding/pending-setup/attendance-core";
import { requestAttendance } from "../../../lib/onboarding/pending-setup/attendance-provider";
import { readBusinessContextForNiche } from "../../../lib/communication-base/adapters/communicationBaseAdapter";
import { getAccessContext } from "@/lib/access/getAccessContext";
import type { MemberInfo } from "@/lib/access/adapters/accountAdapter";
import { readAccountNicheProductGuard } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import {
  confirmAiOptionForAccount,
  confirmAiSuggestedTaxonForAccount,
  dismissAiNicheResolutionForAccount,
  rewriteAiNicheResolutionForAccount,
} from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";

export type NicheResolutionActionState = {
  ok: boolean;
  formError?: string;
};

const GENERIC_ERROR = "Não foi possível registrar sua resposta agora. Tente novamente.";

export type AccountNicheEditorState =
  | { ok: true; taxon: OfficialAccountNiche | null; hasProducts: boolean; canEdit: boolean }
  | { ok: false; message: string };

async function readNicheForEditor(input: { accountId: string }) {
  const read = await readAccountOfficialNiche(input.accountId);
  return read.ok ? { ok: true as const, taxon: read.niche } : { ok: false as const };
}

async function nicheEditorContext(account: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(account) || account === "home") return null;
  const ctx = await getAccessContext({ params: { account }, throwOnReadError: true });
  const member = ctx?.member as MemberInfo | null | undefined;
  return ctx && !ctx.blocked && ctx.account?.status === "active" && member?.status === "active" && member.userId
    ? { ...ctx, member } : null;
}

export async function loadAccountNicheEditorAction(account: string): Promise<AccountNicheEditorState> {
  try {
    const ctx = await nicheEditorContext(account);
    if (!ctx?.account) return { ok: false, message: "A definição de nicho não está disponível para este acesso." };
    const [taxonomy, hasProducts] = await Promise.all([
      readNicheForEditor({ accountId: ctx.account.id }), readAccountNicheProductGuard(ctx.account.id),
    ]);
    if (!taxonomy.ok || hasProducts === null) return { ok: false, message: "Não foi possível consultar o nicho agora. Tente novamente." };
    return { ok: true, taxon: taxonomy.taxon, hasProducts, canEdit: ["owner", "admin", "editor"].includes(ctx.member!.role) };
  } catch { return { ok: false, message: GENERIC_ERROR }; }
}

const nicheTurnInput = z.object({
  account: z.string(), dialogueId: z.uuid(), requestId: z.uuid(), expectedVersion: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  expectedRevision: z.string().max(160).nullable(), content: z.string().trim().min(1).max(4000).nullable(),
}).strict();

export async function converseAccountNicheAction(raw: z.input<typeof nicheTurnInput>) {
  const parsed = nicheTurnInput.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Não foi possível enviar a mensagem. Use até 4.000 caracteres." };
  const input = parsed.data;
  let fence: { accountId: string; userId: string; dialogueId: string; expectedVersion: number; turnToken: string } | null = null;
  try {
    const ctx = await nicheEditorContext(input.account);
    if (!ctx?.account || !["owner","admin","editor"].includes(ctx.member.role)) throw new Error("not_authorized");
    const [current, products, savedContext] = await Promise.all([
      readNicheForEditor({ accountId: ctx.account.id }), readAccountNicheProductGuard(ctx.account.id),
      readBusinessContextForNiche({ accountId: ctx.account.id, actorUserId: ctx.member.userId }),
    ]);
    if (!current.ok || products === null || !savedContext.ok) throw new Error("context_unavailable");
    if ((current.taxon?.revision ?? null) !== input.expectedRevision)
      return { ok: false as const, message: "O nicho mudou. Reabra a conversa para conferir o vínculo atual." };
    if (current.taxon && products && input.content !== null)
      return { ok: false as const, message: "A redefinição não está disponível porque esta conta já possui produto desenvolvido." };
    const identity = { accountId: ctx.account.id, userId: ctx.member.userId, dialogueId: input.dialogueId };
    const turnToken = crypto.randomUUID();
    const claimed = await claimAccountNicheTurn({ ...identity, ...input, turnToken });
    if (!claimed.ok) throw new Error("turn_not_claimed");
    const reserved = claimed.value;
    if (reserved.replay && reserved.state.reply) return { ok: true as const, version: reserved.version,
      reply: reserved.state.reply, proposal: reserved.state.proposal ? { taxonId: null, name: reserved.state.proposal } : null };
    fence = { ...identity, expectedVersion: reserved.version, turnToken };
    if (!reserved.summaryUpdatedAt || !reserved.recent) throw new Error("reserved_context_invalid");
    if (reserved.summary && !projectAttendanceSummary(reserved.summary)) throw new Error("summary_invalid");
    const businessData = Object.fromEntries(Object.entries(savedContext.value).map(([key,value]) => [key,projectAttendanceText(value)]));
    const context: AttendanceContext = { purpose: "account_niche", preferredName: null,
      officialNiche: officialNichePromptContext(current.taxon), summary: projectAttendanceSummary(reserved.summary),
      currentPrimaryTaxonId: current.taxon?.taxonId ?? null, publicName: businessData.business_name ?? null,
      businessData, catalog: [], displayedUnderstanding: projectAttendanceText(reserved.state.understanding ?? ""),
      recent: reserved.recent.map(entry => ({ ...entry, content: projectAttendanceText(entry.content) })),
    };
    const result = current.taxon && products ? { ok: true as const, output: null } : await requestAttendance({ accountId: ctx.account.id, context });
    if (!result.ok) throw new Error("provider_unavailable");
    const output = result.output;
    const reply = output?.reply ?? "Confirme o nicho atual: " + current.taxon!.name + ".";
    const proposal = output ? (output.action === "existing" ? output.nicheDescription : null) : current.taxon!.name;
    const summary = output && (output.businessUnderstanding || output.suggestions.length)
      ? attendanceSummary(output,current.taxon?.confirmed ? current.taxon.name : null,null,reserved.summary)
      : null;
    const written = await commitAccountNicheTurn({ ...fence, reply, proposal,
      understanding: output?.businessUnderstanding ?? "", summary, observedSummary: reserved.summary ?? null,
      observedSummaryUpdatedAt: reserved.summaryUpdatedAt });
    if (!written.ok) throw new Error("turn_not_committed");
    return { ok: true as const, version: written.version, reply,
      proposal: proposal ? { taxonId: null, name: proposal } : null };
  } catch {
    const released = fence ? await releaseAccountNicheTurn(fence).catch(() => false) : null;
    console.warn("account_niche_turn_failed", { outcome: "not_committed", submitted: Boolean(fence && input.content), release: released });
    return { ok: false as const, ...(fence ? { version: fence.expectedVersion } : {}),
      message: fence && input.content ? "Sua mensagem foi registrada no histórico. Não foi possível concluir a resposta; tente novamente."
        : "Não foi possível conversar agora. O texto continua disponível para tentar novamente." };
  }
}

const nicheSaveInput = z.object({ account: z.string(), dialogueId: z.uuid(),
  expectedVersion: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), confirmed: z.literal(true) }).strict();
export async function saveAccountNicheAction(raw: z.input<typeof nicheSaveInput>) {
  try {
    const input = nicheSaveInput.safeParse(raw);
    if (!input.success) return { ok: false as const, message: GENERIC_ERROR };
    const ctx = await nicheEditorContext(input.data.account);
    if (!ctx?.account || !["owner","admin","editor"].includes(ctx.member.role)) return { ok: false as const, message: GENERIC_ERROR };
    const saved = await confirmAccountNicheDialogue({ accountId: ctx.account.id, actorUserId: ctx.member.userId,
      dialogueId: input.data.dialogueId, expectedVersion: input.data.expectedVersion });
    if (!saved.ok) return { ok: false as const, message: saved.reason === "product_exists"
      ? "A redefinição não está disponível porque esta conta já possui produto desenvolvido."
      : saved.reason === "conflict" ? "O nicho ou a conversa mudou. Reabra e confirme novamente." : GENERIC_ERROR };
    revalidatePath("/a/" + input.data.account, "layout");
    return { ok: true as const };
  } catch { return { ok: false as const, message: GENERIC_ERROR }; }
}

async function getAllowedAccountContext(formData: FormData) {
  const accountSubdomain = String(formData.get("account_subdomain") ?? "")
    .trim()
    .toLowerCase();
  const route = accountSubdomain ? `/a/${accountSubdomain}` : "/a";

  if (!accountSubdomain) return { ok: false as const, route, accountId: null };

  const ctx = await getAccessContext({
    params: { account: accountSubdomain },
    route,
  });

  if (!ctx || ctx.blocked || ctx.account?.status !== "active") {
    return { ok: false as const, route, accountId: null };
  }

  const accountId = (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
  if (!accountId) return { ok: false as const, route, accountId: null };

  return { ok: true as const, route, accountId };
}

export async function confirmSuggestedNicheResolutionAction(
  _previousState: NicheResolutionActionState,
  formData: FormData,
): Promise<NicheResolutionActionState> {
  const ctx = await getAllowedAccountContext(formData);
  if (!ctx.ok || !ctx.accountId) return { ok: false, formError: GENERIC_ERROR };

  const result = await confirmAiSuggestedTaxonForAccount({ accountId: ctx.accountId });
  revalidatePath(ctx.route);

  if (!result.ok) return { ok: false, formError: GENERIC_ERROR };
  return { ok: true };
}

export async function confirmOptionNicheResolutionAction(
  _previousState: NicheResolutionActionState,
  formData: FormData,
): Promise<NicheResolutionActionState> {
  const ctx = await getAllowedAccountContext(formData);
  if (!ctx.ok || !ctx.accountId) return { ok: false, formError: GENERIC_ERROR };

  const taxonId = String(formData.get("taxon_id") ?? "").trim();
  const optionName = String(formData.get("option_name") ?? "").trim();
  if (!taxonId && !optionName) return { ok: false, formError: GENERIC_ERROR };

  const result = await confirmAiOptionForAccount({
    accountId: ctx.accountId,
    taxonId: taxonId || null,
    optionName: optionName || null,
  });
  revalidatePath(ctx.route);

  if (!result.ok) return { ok: false, formError: GENERIC_ERROR };
  return { ok: true };
}

export async function rewriteNicheResolutionAction(
  _previousState: NicheResolutionActionState,
  formData: FormData,
): Promise<NicheResolutionActionState> {
  const ctx = await getAllowedAccountContext(formData);
  if (!ctx.ok || !ctx.accountId) return { ok: false, formError: GENERIC_ERROR };

  const rewriteInput = String(formData.get("rewrite_input") ?? "");
  const result = await rewriteAiNicheResolutionForAccount({
    accountId: ctx.accountId,
    rewriteInput,
  });
  revalidatePath(ctx.route);

  if (!result.ok) {
    if (result.reason === "empty_rewrite") {
      return { ok: false, formError: "Informe um nicho para continuar." };
    }
    if (result.reason === "rewrite_too_long") {
      return { ok: false, formError: "Use no máximo 120 caracteres." };
    }
    return { ok: false, formError: GENERIC_ERROR };
  }

  return { ok: true };
}

export async function dismissNicheResolutionAction(
  _previousState: NicheResolutionActionState,
  formData: FormData,
): Promise<NicheResolutionActionState> {
  const ctx = await getAllowedAccountContext(formData);
  if (!ctx.ok || !ctx.accountId) return { ok: false, formError: GENERIC_ERROR };

  const result = await dismissAiNicheResolutionForAccount({ accountId: ctx.accountId });
  revalidatePath(ctx.route);

  if (!result.ok) return { ok: false, formError: GENERIC_ERROR };
  return { ok: true };
}
