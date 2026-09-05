import assert from "node:assert/strict";
import { buildQaPassword } from "./qa-password.mjs";

const first = buildQaPassword();
const second = buildQaPassword();

assert.match(first, /^Aa1![A-Za-z0-9_-]{32}$/);
assert.match(second, /^Aa1![A-Za-z0-9_-]{32}$/);
assert.notEqual(first, second);
assert.equal(first.includes("convite"), false);

console.log("qa-password-validation-cases: ok");
