import assert from "node:assert/strict";
import { assertMutationTarget, normalizeAccountSubdomain, parseAuthorizedAppOrigin } from "./policy.mjs";

assert.equal(parseAuthorizedAppOrigin("https://lp-factory-10.vercel.app/auth/login"), "https://lp-factory-10.vercel.app");
assert.equal(
  parseAuthorizedAppOrigin("https://lp-factory-10-pr-860-alcino-afonsos-projects.vercel.app/a/home"),
  "https://lp-factory-10-pr-860-alcino-afonsos-projects.vercel.app",
);
for (const invalid of [
  "http://lp-factory-10.vercel.app",
  "https://attacker.example.com",
  "https://lp-factory-10-attacker.vercel.app",
  "https://user:password@lp-factory-10.vercel.app",
]) {
  assert.throws(() => parseAuthorizedAppOrigin(invalid));
}

assert.equal(normalizeAccountSubdomain(" QA-Institucional "), "qa-institucional");
for (const invalid of ["", "qa_institucional", "-qa", "qa-"]) {
  assert.throws(() => normalizeAccountSubdomain(invalid));
}

assert.doesNotThrow(() => assertMutationTarget("https://lp-factory-10-pr-860-alcino-afonsos-projects.vercel.app"));
assert.throws(() => assertMutationTarget("https://lp-factory-10.vercel.app"));

console.log("authenticated QA policy validation cases: passed");
