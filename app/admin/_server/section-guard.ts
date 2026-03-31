import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/access/guards";

export async function requireAdminSectionAccess() {
  const { allowed, redirect: redirectTo } = await requirePlatformAdmin();

  if (!allowed) {
    redirect(redirectTo ?? "/auth/confirm/info");
  }
}
