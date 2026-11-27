import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { canInstallGeneralSuggestion, createStageTwoGenerationGate, isCurrentGenerationNiche } from "../generation-guard";
import { observePilotTransport, pilotClientFailureKind, pilotTraceId } from "./pilot-trace";

const traceId = "12345678-1234-4abc-8abc-123456789abc";
assert.equal(pilotTraceId(traceId), traceId);
for (const invalid of ["", "../secret", "12345678-1234-4abc-8abc-123456789abc?payload", null, 7]) {
  assert.equal(pilotTraceId(invalid), null, "untrusted client trace IDs never reach structured logs");
}
assert.equal(pilotClientFailureKind(new Error("Connection closed.")), "connection_closed");
assert.equal(pilotClientFailureKind(new TypeError("Failed to fetch")), "network");
assert.equal(pilotClientFailureKind(new SyntaxError("Unexpected end of JSON input")), "decode");
assert.equal(pilotClientFailureKind(new DOMException("Aborted", "AbortError")), "aborted");
assert.equal(pilotClientFailureKind(new Error("Sensitive business data: should never be logged")), "unexpected");

test("trace observer preserves original result/error and never retries even if logging fails", async () => {
  let calls = 0;
  assert.deepEqual(await observePilotTransport(async () => {
    calls++;
    return { valid: true };
  }, () => { throw new Error("logging unavailable"); }), { valid: true });
  const failure = new Error("Connection closed.");
  await assert.rejects(observePilotTransport(async () => {
    calls++;
    throw failure;
  }, () => { throw new Error("logging unavailable"); }), error => error === failure);
  assert.equal(calls, 2, "one invocation per attempted action even when logging fails");
});

test("local HTTP fixture distinguishes a truncated fourth reply from a fifth send failure", async () => {
  type Mode = "complete" | "truncated_fourth" | "fifth_send_failed" | "unauthorized" | "stale";
  const keys = ["about", "audience", "market_insights", "value_proposition", "benefits", "differentiators", "faq"];
  let mode: Mode = "complete";
  let serverArrivals = 0;
  const server = createServer((_, response) => {
    serverArrivals++;
    response.setHeader("Content-Type", "application/json");
    if (mode === "unauthorized") {
      response.end(JSON.stringify({ ok: false }));
    } else if (mode === "truncated_fourth" && serverArrivals === 4) {
      response.end('{"ok":true,"key":"value_proposition"');
    } else {
      response.end(JSON.stringify({ ok: true, key: keys[serverArrivals - 1] }));
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}/pilot`;
    for (const scenario of ["complete", "truncated_fourth", "fifth_send_failed", "unauthorized", "stale"] as const) {
      mode = scenario;
      serverArrivals = 0;
      let attempts = 0, accepted = 0, saved = 0, refreshed = 0;
      const events: string[] = [];
      const gate = createStageTwoGenerationGate();
      assert.equal(gate.tryStart(), true);
      assert.equal(gate.tryStart(), false, "double click does not start another generation");
      try {
        for (const [index, key] of keys.entries()) {
          const result = await observePilotTransport(async () => {
            attempts++;
            if (scenario === "fifth_send_failed" && index === 4) throw new TypeError("Failed to fetch");
            const response = await fetch(url, { method: "POST" });
            return response.json() as Promise<{ ok: boolean; key?: string }>;
          }, (phase, failure) => events.push(`${index + 1}:${phase}${failure ? ":" + failure : ""}`));
          if (!result.ok || result.key !== key) break;
          accepted++;
          // Simulates the existing version guard, not a retry or a new save mechanism.
          if (scenario === "stale" && index === 3 &&
              !canInstallGeneralSuggestion(1, 2, 0, 0)) break;
        }
        if (accepted === keys.length) {
          saved++;
          refreshed++;
        }
      } catch { /* Only the probe fixture swallows the synthetic transport error. */ }
      finally {
        gate.finish();
        assert.equal(gate.tryStart(), true, "generation gate is released on both success and error");
      }
      const expectations = {
        complete: [7, 7, 7, 1],
        truncated_fourth: [4, 4, 3, 0],
        fifth_send_failed: [5, 4, 4, 0],
        unauthorized: [1, 1, 0, 0],
        stale: [4, 4, 4, 0],
      } as const;
      const [expectedAttempts, expectedArrivals, expectedAccepted, expectedSaves] = expectations[scenario];
      assert.deepEqual([attempts, serverArrivals, accepted, saved],
        [expectedAttempts, expectedArrivals, expectedAccepted, expectedSaves], scenario);
      assert.equal(refreshed, expectedSaves, "one refresh only after seven successful replies");
      assert.ok(events.includes("1:dispatch"));
      if (scenario === "truncated_fourth") {
        assert.ok(events.includes("4:rejected:decode"), "fourth response was received but not decoded");
        assert.equal(events.some(event => event.startsWith("5:")), false, "no fifth request occurred");
      }
      if (scenario === "fifth_send_failed") {
        assert.ok(events.includes("4:resolved"));
        assert.ok(events.includes("5:rejected:network"), "fifth request failed before server arrival");
      }
    }
    assert.equal(isCurrentGenerationNiche({ taxonId: null, revision: "1" },
      { taxonId: null, revision: "2", confirmed: true }), false, "changed niche invalidates generation");
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
