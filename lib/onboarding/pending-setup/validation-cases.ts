import assert from "node:assert/strict";

import { validatePreferredName } from "./contracts";

assert.deepEqual(validatePreferredName("  Alcino   Afonso  "), {
  ok: true,
  value: "Alcino Afonso",
});
assert.equal(validatePreferredName("   ").ok, false);
assert.equal(validatePreferredName("x".repeat(81)).ok, false);

console.log("ok - E10.9.3 preferred-name contract");
