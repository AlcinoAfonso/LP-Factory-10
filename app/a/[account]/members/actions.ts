"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  inviteAccountMember,
  mutateAccountMember,
  resendAccountMemberInvite,
  type AccountMemberError,
} from "@/lib/access/account-members";
import { isAccountMembersEnabled } from "@/lib/access/account-members/config";
import { isManageableMemberRole } from "@/lib/access/account-members/policy";
import { requireAccountMembersManager } from "@/lib/access/guards";

export async function inviteMemberAction(formData: FormData) {
  const account = readAccount(formData);
  const context = await requireManager(account);
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!isManageableMemberRole(role)) redirectToMembers(account, { error: "invalid_role" });

  const result = await inviteAccountMember(context, { email, role });
  if (!result.ok) redirectToMembers(account, { error: result.error });

  revalidatePath(`/a/${account}/members`);
  redirectToMembers(account, {
    notice: result.value.delivery === "email" ? "invite_sent" : "invite_in_app",
  });
}

export async function resendMemberInviteAction(formData: FormData) {
  const account = readAccount(formData);
  const context = await requireManager(account);
  const memberId = String(formData.get("member_id") ?? "");
  const result = await resendAccountMemberInvite(context, { memberId });
  if (!result.ok) redirectToMembers(account, { error: result.error });

  revalidatePath(`/a/${account}/members`);
  redirectToMembers(account, { notice: "invite_resent" });
}

export async function changeMemberRoleAction(formData: FormData) {
  const account = readAccount(formData);
  const context = await requireManager(account);
  const memberId = String(formData.get("member_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!isManageableMemberRole(role)) redirectToMembers(account, { error: "invalid_role" });

  const result = await mutateAccountMember(context, {
    memberId,
    operation: { type: "change_role", role },
  });
  if (!result.ok) redirectToMembers(account, { error: result.error });

  revalidatePath(`/a/${account}/members`);
  redirectToMembers(account, { notice: "role_changed" });
}

export async function deactivateMemberAction(formData: FormData) {
  const account = readAccount(formData);
  const context = await requireManager(account);
  const memberId = String(formData.get("member_id") ?? "");
  const result = await mutateAccountMember(context, {
    memberId,
    operation: { type: "deactivate" },
  });
  if (!result.ok) redirectToMembers(account, { error: result.error });

  revalidatePath(`/a/${account}/members`);
  redirectToMembers(account, { notice: "member_deactivated" });
}

export async function revokeMemberInviteAction(formData: FormData) {
  const account = readAccount(formData);
  const context = await requireManager(account);
  const memberId = String(formData.get("member_id") ?? "");
  const result = await mutateAccountMember(context, {
    memberId,
    operation: { type: "revoke" },
  });
  if (!result.ok) redirectToMembers(account, { error: result.error });

  revalidatePath(`/a/${account}/members`);
  redirectToMembers(account, { notice: "invite_revoked" });
}

async function requireManager(account: string) {
  if (!isAccountMembersEnabled()) redirect(`/a/${account}`);
  const guarded = await requireAccountMembersManager(account);
  if (!guarded.allowed) {
    redirect(guarded.reason === "unauthenticated" ? "/auth/login" : `/a/${account}`);
  }
  return guarded.context;
}

function readAccount(formData: FormData): string {
  const account = String(formData.get("account") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(account) || account === "home") redirect("/a/home");
  return account;
}

function redirectToMembers(
  account: string,
  outcome: Readonly<{ notice?: string; error?: AccountMemberError }>,
): never {
  const query = new URLSearchParams();
  if (outcome.notice) query.set("notice", outcome.notice);
  if (outcome.error) query.set("error", outcome.error);
  redirect(`/a/${account}/members?${query.toString()}`);
}
