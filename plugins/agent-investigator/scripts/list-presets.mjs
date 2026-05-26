#!/usr/bin/env node

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const presetsDir = join(scriptDir, "..", "presets");

const presets = readdirSync(presetsDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => {
    const preset = JSON.parse(readFileSync(join(presetsDir, file), "utf8"));
    return {
      id: preset.id,
      title: preset.title,
      platforms: preset.platforms,
      requiredInputs: preset.requiredInputs,
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

console.log(JSON.stringify({ total: presets.length, presets }, null, 2));
