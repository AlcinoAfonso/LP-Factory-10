import type { CommunicationBaseResult } from "./contracts";

export type CommunicationBaseAccess = Readonly<{
  accountId: string;
  accountSubdomain: string;
  role: "owner" | "admin" | "editor" | "viewer";
  canEdit: boolean;
}>;

type AccessSnapshot = Readonly<{
  blocked?: boolean;
  account?: Readonly<{ id: string; status?: string | null }> | null;
  member?: Readonly<{ role?: string | null; status?: string | null }> | null;
}> | null;

type EntitlementSnapshot =
  | Readonly<{ ok: true; signal: Readonly<{ isCommerciallyEligible: boolean }> }>
  | Readonly<{ ok: false }>;

export type CommunicationBaseAccessDependencies = Readonly<{
  enabled: boolean;
  loadAccess: (accountSubdomain: string) => Promise<AccessSnapshot>;
  readEntitlement: (accountId: string) => Promise<EntitlementSnapshot>;
}>;

export async function resolveCommunicationBaseAccess(
  rawAccountSubdomain: string,
  requireEdit: boolean,
  dependencies: CommunicationBaseAccessDependencies,
): Promise<CommunicationBaseResult<CommunicationBaseAccess>> {
  if (!dependencies.enabled) return { ok: false, error: "unavailable" };
  const accountSubdomain = rawAccountSubdomain.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(accountSubdomain) || accountSubdomain === "home") {
    return { ok: false, error: "forbidden" };
  }

  try {
    const access = await dependencies.loadAccess(accountSubdomain);
    if (!access || access.blocked || !access.account?.id ||
        access.account.status !== "active" || access.member?.status !== "active") {
      return { ok: false, error: "forbidden" };
    }
    const role = access.member.role;
    if (role !== "owner" && role !== "admin" && role !== "editor" && role !== "viewer") {
      return { ok: false, error: "forbidden" };
    }
    const canEdit = role !== "viewer";
    if (requireEdit && !canEdit) return { ok: false, error: "forbidden" };

    const entitlement = await dependencies.readEntitlement(access.account.id);
    if (!entitlement.ok) return { ok: false, error: "read_failed" };
    if (!entitlement.signal.isCommerciallyEligible) return { ok: false, error: "forbidden" };

    return { ok: true, value: {
      accountId: access.account.id,
      accountSubdomain,
      role,
      canEdit,
    } };
  } catch {
    return { ok: false, error: "read_failed" };
  }
}