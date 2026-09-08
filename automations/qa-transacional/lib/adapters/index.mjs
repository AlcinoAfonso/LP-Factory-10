import { ContractError, deepFreeze, OPERATIONS } from "../contracts.mjs";
import { assessReadiness, INITIAL_READINESS } from "../readiness.mjs";

export const ADAPTER_CONTRACTS = deepFreeze({
  signup: {
    module: "auth-public.mjs",
    mechanism: "supabase.auth.signUp",
    requiredReadiness: ["credential_resolution", "session_isolation"],
    minimumPrivilege: "public",
    idempotency: "exact institutional identity and expected auth state",
    postcondition: "compatible auth user with the expected confirmation state",
    finalState: "explicit auth lifecycle state",
    implemented: false,
  },
  create_user: {
    module: "auth-admin.mjs",
    mechanism: "supabase.auth.admin.createUser",
    requiredReadiness: ["credential_resolution", "session_isolation"],
    minimumPrivilege: "authorized auth administrator",
    idempotency: "paginated exact email lookup",
    postcondition: "compatible auth user and confirmation state",
    finalState: "explicit auth lifecycle state",
    implemented: false,
  },
  create_account: {
    module: "accounts.mjs",
    mechanism: "existing server-side account boundary",
    requiredReadiness: ["credential_resolution", "session_isolation"],
    minimumPrivilege: "authorized account administrator",
    idempotency: "exact institutional account identifier",
    postcondition: "account and operational lifecycle only",
    finalState: "explicit account lifecycle state",
    implemented: false,
  },
  verify_entitlement: {
    module: "entitlements.mjs",
    mechanism: "lib/commercial-entitlements public boundary",
    requiredReadiness: ["credential_resolution", "session_isolation"],
    minimumPrivilege: "authorized server-side reader",
    idempotency: "read-only exact account lookup",
    postcondition: "commercial condition observed independently from account lifecycle",
    finalState: "unchanged",
    implemented: false,
  },
  invite: {
    module: "auth-admin.mjs",
    mechanism: "lib/access/account-members inviteAccountMember",
    requiredReadiness: ["search", "read", "credential_resolution", "session_isolation"],
    minimumPrivilege: "authorized account member manager",
    idempotency: "public boundary invite lifecycle",
    postcondition: "pending membership and correlatable emission",
    finalState: "explicit pending membership state",
    implemented: false,
  },
  confirm: {
    module: "mailbox.mjs",
    mechanism: "authorized mailbox consumer plus /auth/confirm",
    requiredReadiness: ["search", "read", "consume", "credential_resolution", "session_isolation"],
    minimumPrivilege: "institutional mailbox consumer",
    idempotency: "correlated message and expected auth state",
    postcondition: "confirmed user state",
    finalState: "explicit confirmed state",
    implemented: false,
  },
  recover: {
    module: "mailbox.mjs",
    mechanism: "authorized mailbox consumer plus /auth/confirm",
    requiredReadiness: ["search", "read", "consume", "credential_resolution", "session_isolation"],
    minimumPrivilege: "institutional mailbox consumer",
    idempotency: "correlated message and expected recovery state",
    postcondition: "recovered session state",
    finalState: "explicit recovered state",
    implemented: false,
  },
  verify_role_state: {
    module: "access-state.mjs",
    mechanism: "existing access and entitlement read boundaries",
    requiredReadiness: ["credential_resolution", "session_isolation"],
    minimumPrivilege: "authorized server-side reader",
    idempotency: "read-only exact actor and account lookup",
    postcondition: "role, authority, commercial condition, RLS and grants observed",
    finalState: "unchanged",
    implemented: false,
  },
});

export function resolveAdapter(operation, expectedEnvironment, snapshot = INITIAL_READINESS) {
  if (!OPERATIONS.includes(operation)) {
    throw new ContractError("unsupported_operation", "operation is not registered");
  }
  const contract = ADAPTER_CONTRACTS[operation];
  const readiness = assessReadiness(contract.requiredReadiness, expectedEnvironment, snapshot);
  if (readiness.status !== "ready") {
    return deepFreeze({ status: "capability_unavailable", operation, readiness });
  }
  if (!contract.implemented) {
    return deepFreeze({
      status: "capability_unavailable",
      operation,
      readiness,
      reason: "adapter_not_materialized",
    });
  }
  return deepFreeze({ status: "ready", operation, readiness, contract });
}
