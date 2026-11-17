import { createHash } from "node:crypto";

import type { CommunicationBase, CommunicationSection } from "./contracts";
import { confirmedCommunicationMaterials, confirmedStageOneData } from "./ai-core";

export function stageOneStateKey(base: CommunicationBase): string {
  return fingerprint([base.accountId, confirmedStageOneData(base, { kind: "general" })]);
}

export function stageTwoInputStateKey(base: CommunicationBase): string {
  return fingerprint([base.accountId, confirmedStageOneData(base, { kind: "general" }), confirmedCommunicationMaterials(base)]);
}

export function sectionStateKey(section: CommunicationSection | undefined): string {
  return fingerprint(section ? [section.format, section.origin, section.value, ...(section.facts ? [section.facts] : [])] : null);
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
