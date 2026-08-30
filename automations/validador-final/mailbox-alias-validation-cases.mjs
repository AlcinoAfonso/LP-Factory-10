import assert from "node:assert/strict";
import { buildMailboxAlias, normalizeMailboxBaseEmail } from "./mailbox-alias.mjs";

assert.equal(normalizeMailboxBaseEmail("  Mailbox.QA@gmail.com "), "mailbox.qa@gmail.com");
assert.equal(
  buildMailboxAlias("mailbox.qa@gmail.com", "convite103"),
  "mailbox.qa+convite103@gmail.com",
);

assert.throws(
  () => normalizeMailboxBaseEmail("mailbox.qa+anterior@gmail.com"),
  /caixa base, sem \+tag/,
);
assert.throws(() => normalizeMailboxBaseEmail("mailbox.qa@outlook.com"), /caixa base @gmail\.com/);
assert.throws(
  () => buildMailboxAlias("mailbox.qa@gmail.com", "convite 103"),
  /apenas letras, numeros/,
);

console.log("mailbox alias validation cases: passed");
