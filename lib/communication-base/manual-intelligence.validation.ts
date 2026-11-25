import assert from "node:assert/strict";
import { communicationSections } from "./registry";
import { editorDraftValue, parseEditorDraft } from "./manual-editor-value";
import { parseReviewedSectionValue, parseSectionValue, parseStoredSections, projectCommunicationBase, withGeneratedIntelligence, withSection } from "./policy";
import { sectionEditState } from "../../app/a/[account]/base-comunicacao/_components/section-edit-state";
import type { CommunicationSection } from "./contracts";

const targets = communicationSections.filter(section => section.stage === 2);
const legacyValue = (format: string) => format === "items" ? ["Linha 1\nLinha 2 | literal", "Outro item\n\nParágrafo"]
  : format === "faq" ? [{ question: "Pergunta | literal?\nComplemento", answer: "Resposta\n\nCom parágrafos" }, { question: "Outra?", answer: "Sim." }]
  : "Conteúdo existente\n\nCom parágrafos";
const stored = Object.fromEntries(targets.map(section => [section.key, {
  format: section.format, value: legacyValue(section.format), origin: "agent_generated" as const,
}]));
const frozen = JSON.stringify(stored);
const row = { account_id: "qa-local", version: 2, sections_json: stored, created_at: "2026-11-25", updated_at: "2026-11-25" };
assert.ok(projectCommunicationBase(row));

for (const definition of targets) {
  const current: CommunicationSection = stored[definition.key];
  const draft = editorDraftValue(current.value, definition.format, true, true);
  assert.deepEqual(sectionEditState(definition, current, draft, true), { valid: true, dirty: false });
  assert.ok(draft.includes("\n\n"), definition.key + " preserves paragraphs");
  if (definition.format !== "text") assert.ok(draft.includes("| literal"), "literal pipes are preserved");
  assert.equal(JSON.stringify(stored), frozen, "opening legacy content never rewrites persisted data");

  const free = "Título livre\n\n" + Array.from({ length: 30 }, (_, i) => "Linha " + i + " | sem delimitador obrigatório").join("\n");
  const parsed = parseReviewedSectionValue(definition, parseEditorDraft(definition.format, free, true, true));
  assert.equal(parsed, free);
  assert.deepEqual(sectionEditState(definition, current, free, true), { valid: true, dirty: true });
  const next = withSection(stored, definition.key, free, "user_reviewed");
  assert.ok(next);
  const reopened = projectCommunicationBase({ ...row, sections_json: next, version: 3 });
  assert.ok(reopened);
  assert.equal(editorDraftValue(reopened.sections[definition.key]!.value, definition.format, true, true), free);
  assert.equal(reopened.sections[definition.key]!.format, definition.format, "catalog/AI format is retained");
  for (const other of targets.filter(target => target.key !== definition.key)) assert.deepEqual(next[other.key], stored[other.key]);
  assert.deepEqual(sectionEditState(definition, reopened.sections[definition.key], free, true), { valid: true, dirty: false });
  assert.equal(parseReviewedSectionValue(definition, "x".repeat(30_000)), "x".repeat(30_000));
  assert.equal(parseReviewedSectionValue(definition, "x".repeat(30_001)), null);
  assert.equal(parseReviewedSectionValue(definition, { text: "not a supported value" }), null);
  assert.equal(parseReviewedSectionValue(definition, ""), "", "explicit clearing remains available");

  if (definition.format !== "text") {
    assert.equal(parseSectionValue(definition, free), null, "generated response parser remains strict");
    assert.equal(withSection(stored, definition.key, free, "agent_generated"), null);
    assert.equal(parseStoredSections({ ...stored, [definition.key]: { ...current, value: free } }), null,
      "free text exception is restricted to user-reviewed data");
    assert.equal(withGeneratedIntelligence(stored, targets.map(target => ({ key: target.key,
      value: target.key === definition.key ? free : legacyValue(target.format) })), communicationSections), null);
  }
}

const items = targets.find(section => section.format === "items")!;
const fullLegacy: CommunicationSection = { format: "items", origin: "user_reviewed", value: Array.from({ length: 20 }, () => "i".repeat(1500)) };
const display = editorDraftValue(fullLegacy.value, "items", true, true);
assert.equal(display.length, 30_038, "display separators do not truncate legacy data at the ceiling");
assert.deepEqual(sectionEditState(items, fullLegacy, display, true), { valid: true, dirty: false });
assert.equal(sectionEditState(items, fullLegacy, display + "changed", true).valid, false);
const businessName = communicationSections.find(section => section.key === "business_name")!;
assert.equal(parseReviewedSectionValue(businessName, "b".repeat(4001)), null, "other category limits remain unchanged");
assert.equal(parseReviewedSectionValue({ ...items, stage: 1 }, "free"), null, "no stage-one list relaxation");
assert.deepEqual(parseEditorDraft("items", "[\"old\"]", true), ["old"], "old structured transport remains supported");
console.log("Manual Category 3: seven free editors, legacy preservation, scoped save/reopen, limits and strict AI output passed.");
