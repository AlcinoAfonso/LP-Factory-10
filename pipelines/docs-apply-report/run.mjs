import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const reportPath = process.argv[2];

if (!reportPath) {
  console.error("Missing argument: report_path");
  process.exit(1);
}

if (!existsSync(reportPath)) {
  console.error(`Report not found: ${reportPath}`);
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enginePath = path.join(__dirname, "apply-doc-report.mjs");

const res = spawnSync(process.execPath, [enginePath, reportPath], {
  stdio: "inherit",
});

process.exit(res.status ?? 1);
