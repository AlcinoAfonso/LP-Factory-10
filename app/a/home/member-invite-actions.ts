"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getAccountMemberInviteDestination,
  respondToAccountMemberInvite,
  validatePendingAccountMemberInvite,
  type AccountMemberError,
} from "@/lib/access/account-members";
import { isAccountMembersEnabled } from "@/lib/access/account-members/config";
import { requireAuthenticatedAccountMemberUser } from "@/lib/access/guards";

export async function acceptPendingMemberInviteAction(formData: FormData) {
  const input = readInviteInput(formData);
  const context = await requireInviteActor();
  const validated = await validatePendingAccountMemberInvite(context, input);
  if (!validated.ok) redirectWithError(validated.error);

  const accepted = await respondToAccountMemberInvite(context, {
    ...input,
    operation: "accept",
  });
  if (!accepted.ok) redirectWithError(accepted.error);

  revalidatePath("/a/home");
  const destination = await getAccountMemberInviteDestination(context, input.accountId);
  redirect(destination.ok ? `/a/${destination.value}` : "/a/home?invite_notice=accepted");
}

export async function declinePendingMemberInviteAction(formData: FormData) {
  const input = readInviteInput(formData);
  const context = await requireInviteActor();
  const validated = await validatePendingAccountMemberInvite(context, input);
  if (!validated.ok) redirectWithError(validated.error);

  const declined = await respondToAccountMemberInvite(context, {
    ...input,
    operation: "decline",
  });
  if (!declined.ok) redirectWithError(declined.error);

  revalidatePath("/a/home");
  redirect("/a/home?invite_notice=declined");
}

async function requireInviteActor() {
  if (!isAccountMembersEnabled()) redirect("/a/home");
  const authenticated = await requireAuthenticatedAccountMemberUser();
  if (!authenticated.allowed) redirect("/auth/login");
  return authenticated.context;
}

function readInviteInput(formData: FormData): Readonly<{ accountId: string; memberId: string }> {
  const accountId = String(formData.get("account_id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  if (!isUuid(accountId) || !isUuid(memberId)) redirectWithError("member_not_found");
  return { accountId, memberId };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function redirectWithError(error: AccountMemberError): never {
  redirect(`/a/home?invite_error=${encodeURIComponent(error)}`);
}
