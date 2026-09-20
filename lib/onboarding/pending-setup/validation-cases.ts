import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  redactPotentialContactDetails,
  resolvePreferredNameFromAuth,
  validateBusinessContext,
  validatePreferredName,
} from "./policy";

assert.equal(
  resolvePreferredNameFromAuth(
    { preferred_name: "  Ana   Maria ", full_name: "Nome ignorado" },
    "ana@example.com",
  ),
  "Ana Maria",
);
assert.equal(
  resolvePreferredNameFromAuth(
    { preferred_name: "ana", full_name: "Ana Maria", name: "Outro" },
    "ana@example.com",
  ),
  "Ana Maria",
);
assert.equal(resolvePreferredNameFromAuth({ name: "ana@example.com" }, "ana@example.com"), null);
assert.deepEqual(validatePreferredName("ana", "ana@example.com"), {
  ok: false,
  reason: "email_derived",
});
assert.deepEqual(validatePreferredName("Nome@Conta", null), {
  ok: false,
  reason: "invalid",
});
assert.deepEqual(validatePreferredName("A".repeat(81), null), {
  ok: false,
  reason: "too_long",
});
assert.deepEqual(validateBusinessContext("  Consultoria   para pequenas empresas  "), {
  ok: true,
  value: "Consultoria para pequenas empresas",
});
assert.equal(validateBusinessContext(" ").ok, false);
assert.equal(validateBusinessContext("x".repeat(4001)).ok, false);

const redacted = redactPotentialContactDetails(
  "Atendo por ana@example.com, https://example.com e +55 (21) 97965-8483.",
);
assert.doesNotMatch(redacted, /ana@example\.com|example\.com|97965/);
assert.match(redacted, /\[email removido\]|\[url removida\]|\[telefone removido\]/);

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/20260920223653_e10_9_pending_setup_conversation.sql",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../../app/a/[account]/page.tsx", import.meta.url),
  "utf8",
);
const loader = readFileSync(
  new URL("../../../app/a/[account]/account-journey-loader.ts", import.meta.url),
  "utf8",
);

for (const requiredContract of [
  "account_pending_setup_conversations",
  "account_pending_setup_messages",
  "start_account_pending_setup_v1",
  "set_account_pending_setup_preferred_name_v1",
  "append_account_pending_setup_turn_v1",
  "complete_account_pending_setup_v1",
  "enable row level security",
  "to service_role",
]) {
  assert.match(migration, new RegExp(requiredContract));
}
assert.doesNotMatch(migration, /create policy/i);
assert.match(page, /PendingSetupConversation/);
assert.doesNotMatch(page, /PendingSetupFirstSteps/);
assert.match(loader, /loadPendingSetupConversation/);

console.log("ok - E10.9 pending setup identity and persistence contracts");
