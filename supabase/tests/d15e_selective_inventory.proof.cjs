const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const bash = process.argv[2];
assert.ok(bash, "Pass the already installed Bash executable");
const workflow = fs.readFileSync(".github/workflows/pipeline-supabase-apply-migrations.yml", "utf8").replace(/\r\n/g, "\n");
const blocks = [...workflow.matchAll(/^        run: \|\n((?: {10}.*\n|\n)*)/gm)]
  .map(match => match[1].split("\n").map(line => line.slice(10)).join("\n"));
assert.equal(blocks.length, 1);
assert.ok(!/migration_scope|_only|SUPABASE_APPLY_MIGRATIONS_ENABLED|workflow_dispatch/.test(workflow));
assert.ok(!fs.readdirSync("supabase/migrations").some(name => name.includes("_e10_10_")));

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "d3f-apply-"));
const unix = value => value.replaceAll("\\", "/");
const write = (file, text) => fs.writeFileSync(file, text.replace(/\r\n/g, "\n"), { mode: 0o755 });
try {
  const script = path.join(dir, "apply.sh");
  write(script, blocks[0]);
  execFileSync(bash, ["-n", unix(script)], { stdio: "pipe" });
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  write(path.join(bin, "gh"), '#!/usr/bin/env bash\nset -eu\ntest "$1" = api\nif [ "${MOCK_GH_FAIL:-0}" = 1 ]; then exit 1; fi\nprintf "%s\\n" "${MOCK_PR-42}"\n');
  write(path.join(bin, "supabase"), [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    'echo "$*" >> "$MOCK_CALLS"',
    'case "$*" in',
    '  "link --project-ref dpikmjgiteuafsbaubue") exit "${MOCK_LINK_FAIL:-0}" ;;',
    '  "db push --linked --dry-run")',
    '    if [ "${MOCK_DRY_FAIL:-0}" = 1 ]; then exit 1; fi',
    '    if [ -f "$MOCK_PENDING.post-fail" ]; then exit 1; fi',
    '    if [ "${MOCK_FORMAT:-normal}" = unknown ]; then echo "unrecognized output"; exit 0; fi',
    '    if [ "${MOCK_FORMAT:-normal}" = malformed ]; then echo "Would push these migrations:"; echo " • bad.sql"; exit 0; fi',
    '    if [ ! -s "$MOCK_PENDING" ]; then echo "Remote database is up to date."; exit 0; fi',
    '    echo "Would push these migrations:"',
    '    while IFS= read -r name; do printf " • %s\\n" "$name"; done < "$MOCK_PENDING" ;;',
    '  "db push --linked --yes")',
    '    if [ "${MOCK_APPLY_FAIL:-0}" = 1 ]; then tail -n +2 "$MOCK_PENDING" > "$MOCK_PENDING.next"; mv "$MOCK_PENDING.next" "$MOCK_PENDING"; exit 1; fi',
    '    if [ "${MOCK_POST_FAIL:-0}" = 1 ]; then touch "$MOCK_PENDING.post-fail"; fi',
    '    if [ "${MOCK_KEEP_PENDING:-0}" != 1 ]; then : > "$MOCK_PENDING"; fi ;;',
    '  *) exit 99 ;;',
    "esac", ""
  ].join("\n"));

  let cases = 0;
  function fixture({ count = 1, modify = false, remove = false, duplicate = false } = {}) {
    const root = path.join(dir, String(cases++));
    fs.mkdirSync(path.join(root, "supabase", "migrations"), { recursive: true });
    const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    const historical = path.join(root, "supabase/migrations/20260101000000_history.sql");
    write(historical, "-- immutable history\n");
    write(path.join(root, "supabase/migrations/20260102000000_baseline.sql"), "-- retained history\n");
    git("init", "-q");
    git("add", ".");
    const commit = () => git("-c", "user.name=D3F Proof", "-c", "user.email=d3f-proof@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-qm", "fixture");
    commit();
    const before = git("rev-parse", "HEAD");
    const added = Array.from({ length: count }, (_, i) => "2026111500000" + i + "_delivery.sql");
    for (const name of added) write(path.join(root, "supabase/migrations", name), "-- validated delivery fixture\n");
    if (modify) write(historical, "-- changed applied migration\n");
    if (remove) fs.unlinkSync(historical);
    if (duplicate) write(path.join(root, "supabase/migrations/20261115000000_duplicate.sql"), "-- duplicate version\n");
    git("add", "-A");
    commit();
    const sha = git("rev-parse", "HEAD");
    const pending = path.join(root, "pending");
    const calls = path.join(root, "calls");
    write(pending, added.length ? added.join("\n") + "\n" : "");
    write(calls, "");
    return { root, before, sha, added, pending, calls };
  }
  function run(f, overrides = {}, success = true) {
    const summary = path.join(f.root, "summary");
    write(summary, "");
    const inheritedPath = process.env.PATH || process.env.Path;
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "path"));
    Object.assign(env, {
      PATH: unix(bin) + ":" + inheritedPath.split(path.delimiter).map(unix).join(":"),
      GITHUB_REF_NAME: "main", GITHUB_EVENT_NAME: "push", GITHUB_SHA: f.sha,
      EVENT_BEFORE_SHA: f.before, GITHUB_REPOSITORY: "proof/fixture",
      GITHUB_STEP_SUMMARY: unix(summary), SUPABASE_PROJECT_REF: "dpikmjgiteuafsbaubue",
      SUPABASE_MIGRATIONS_DIR: "supabase/migrations", GH_TOKEN: "fixture",
      SUPABASE_ACCESS_TOKEN: "fixture", SUPABASE_DB_PASSWORD: "fixture",
      MOCK_PENDING: unix(f.pending), MOCK_CALLS: unix(f.calls), ...overrides
    });
    const result = spawnSync(bash, [unix(script)], { cwd: f.root, env, encoding: "utf8" });
    assert.equal(result.status === 0, success, JSON.stringify({ status: result.status, stderr: result.stderr, stdout: result.stdout, summary: fs.readFileSync(summary, "utf8") }));
    assert.match(fs.readFileSync(summary, "utf8"), new RegExp("status final: " + (success ? "success" : "failure")));
    return fs.readFileSync(f.calls, "utf8");
  }
  const hasApply = calls => calls.includes("db push --linked --yes");
  const one = fixture();
  assert.ok(hasApply(run(one)));
  write(one.calls, "");
  assert.ok(!hasApply(run(one)));
  assert.ok(hasApply(run(fixture({ count: 2 }))));
  assert.ok(!hasApply(run(fixture({ count: 0 }))));

  const unexpected = fixture();
  write(unexpected.pending, "20260101000000_history.sql\n");
  assert.ok(!hasApply(run(unexpected, {}, false)));
  const mixed = fixture();
  write(mixed.pending, mixed.added[0] + "\n20260101000000_history.sql\n");
  assert.ok(!hasApply(run(mixed, {}, false)));
  assert.ok(!hasApply(run(fixture(), { MOCK_DRY_FAIL: "1" }, false)));
  assert.ok(!hasApply(run(fixture(), { MOCK_FORMAT: "unknown" }, false)));
  assert.ok(!hasApply(run(fixture(), { MOCK_FORMAT: "malformed" }, false)));
  assert.ok(!hasApply(run(fixture({ modify: true }), {}, false)));
  assert.ok(!hasApply(run(fixture({ duplicate: true }), {}, false)));
  assert.ok(!hasApply(run(fixture(), { MOCK_PR: "" }, false)));
  assert.ok(!hasApply(run(fixture(), { MOCK_GH_FAIL: "1" }, false)));
  assert.ok(!hasApply(run(fixture(), { GITHUB_REF_NAME: "topic" }, false)));
  assert.ok(!hasApply(run(fixture(), { GITHUB_EVENT_NAME: "workflow_dispatch" }, false)));
  assert.ok(!hasApply(run(fixture(), { SUPABASE_DB_PASSWORD: "" }, false)));
  assert.ok(!hasApply(run(fixture(), { MOCK_LINK_FAIL: "1" }, false)));
  assert.ok(!hasApply(run(fixture(), { EVENT_BEFORE_SHA: "0".repeat(40) }, false)));
  assert.ok(!hasApply(run(fixture({ remove: true, count: 0 }), { MOCK_DRY_FAIL: "1" }, false)));
  assert.ok(!hasApply(run(fixture({ remove: true, count: 0 }))));

  const partial = fixture({ count: 2 });
  assert.ok(hasApply(run(partial, { MOCK_APPLY_FAIL: "1" }, false)));
  assert.equal(fs.readFileSync(partial.pending, "utf8").trim(), partial.added[1]);
  assert.ok(hasApply(run(partial)));
  assert.equal(fs.readFileSync(partial.pending, "utf8"), "");
  run(fixture(), { MOCK_POST_FAIL: "1" }, false);
  run(fixture(), { MOCK_KEEP_PENDING: "1" }, false);
  console.log("PASS Bash syntax and offline workflow scenarios: single/multiple/no pending, unexpected/mixed pending, invalid output/history/identity/credentials, partial failure/retry and post-apply verification; no remote calls");
} finally {
  const resolved = path.resolve(dir);
  assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep + "d3f-apply-"));
  fs.rmSync(resolved, { recursive: true, force: true });
}
