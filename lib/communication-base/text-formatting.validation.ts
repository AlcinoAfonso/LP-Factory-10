import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";
import { sectionEditState } from "../../app/a/[account]/base-comunicacao/_components/section-edit-state";
import { selectStageTwoInput } from "./ai-core";
import { selectAgentBasePilotInput } from "./agent-base/pilot";
import { projectCommunicationBase, withGeneratedIntelligence, withSection } from "./policy";
import { communicationSections, getCommunicationSection } from "./registry";
import {
  communicationTextDocument, parseCommunicationTextFormatting, plainTextDocument,
  serializeCommunicationText, supportsCommunicationTextFormatting,
} from "./text-formatting";
import { communicationTextLinks, isHttpAddress } from "./text-links";

const address = "https://exemplo.com/sa%C3%BAde?q=a%26b&tema=1#dúvidas";
const paragraph = (text: string): JSONContent => ({ type: "paragraph", content: [{ type: "text", text }] });
const item = (...content: JSONContent[]): JSONContent => ({ type: "listItem", content });
const rich: JSONContent = { type: "doc", content: [
  paragraph(" "),
  { type: "heading", attrs: { level: 2, indent: 1 }, content: [{ type: "text", text: "Atendimento" }] },
  { type: "orderedList", attrs: { start: 3 }, content: [
    item(paragraph("Informações"), { type: "bulletList", content: [item(paragraph(address))] }),
    item({ type: "paragraph", content: [
      { type: "text", text: "Prazo ", marks: [{ type: "italic" }] },
      { type: "text", text: "até 24 h", marks: [{ type: "bold" }, { type: "italic" }] },
      { type: "hardBreak" },
      { type: "text", text: "Sujeito à disponibilidade." },
    ] }),
  ] },
  { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Observações" }] },
  { type: "paragraph", attrs: { indent: 2 }, content: [{ type: "text", text: " & <literal>  " }] },
] };
const draft = serializeCommunicationText(rich);
const text = draft.text.trim();
assert.equal(text, `Atendimento\n3. Informações\n   • ${address}\n4. Prazo até 24 h\nSujeito à disponibilidade.\nObservações\n       & <literal>`);
assert.ok(draft.formatting);
assert.deepEqual(parseCommunicationTextFormatting(text, draft.formatting), draft.formatting);
assert.equal(serializeCommunicationText(communicationTextDocument(text, draft.formatting)).text.trim(), text);
assert.ok(!JSON.stringify(draft.formatting).includes(address));
assert.ok(!JSON.stringify(draft.formatting).includes("Atendimento"));
assert.equal(parseCommunicationTextFormatting("Outro texto", draft.formatting), null);
assert.equal(parseCommunicationTextFormatting(text, { version: 1, blocks: [{ kind: "title", spans: [[0, 3], [2, 5]] }] }), null);
assert.deepEqual(serializeCommunicationText(plainTextDocument("**Literal**\n\nTítulo?\n• Texto")), { text: "**Literal**\n\nTítulo?\n• Texto" });

assert.deepEqual(communicationTextLinks(`(${address}), http://exemplo.com/pasta. email@exemplo.com ftp://exemplo.com`)
  .map(link => link.value), [address, "http://exemplo.com/pasta"]);
assert.equal(isHttpAddress("javascript:alert(1)"), false);
assert.equal(isHttpAddress("https://"), false);

const targets = communicationSections.filter(supportsCommunicationTextFormatting);
assert.equal(targets.length, 13);
assert.ok(!supportsCommunicationTextFormatting(getCommunicationSection("business_name")!));
assert.ok(!supportsCommunicationTextFormatting({ key: "outra-secao", stage: 2, format: "text", label: "", group: "" }));

const row = { account_id: "qa", version: 1, created_at: "", updated_at: "" };
const saved = withSection({}, "offers", draft.text, "user_confirmed", communicationSections, undefined, draft.formatting);
assert.ok(saved);
const base = projectCommunicationBase({ ...row, sections_json: saved });
assert.ok(base);
assert.equal(base.sections.offers?.value, text);
assert.deepEqual(base.sections.offers?.formatting, draft.formatting);
assert.equal(selectStageTwoInput(base, { kind: "section", key: "about" })?.confirmed.offers, text);
assert.deepEqual(selectAgentBasePilotInput(base, communicationSections)?.confirmed.offers,
  { label: "Ofertas", value: text, facts: [], origin: "user_confirmed" });
assert.equal(withSection({}, "business_name", draft.text, "user_confirmed", communicationSections, undefined, draft.formatting), null);
assert.equal(withSection({}, "faq", draft.text, "agent_generated", communicationSections, undefined, draft.formatting), null);
assert.ok(withSection({}, "faq", draft.text, "user_reviewed", communicationSections, undefined, draft.formatting));

const unformatted = withSection(saved, "offers", text, "user_confirmed", communicationSections, undefined, null);
assert.ok(unformatted);
assert.equal(projectCommunicationBase({ ...row, sections_json: unformatted })?.sections.offers?.formatting, undefined);
assert.equal(projectCommunicationBase({ ...row, sections_json: { ...saved, offers: {
  format: "text", origin: "user_confirmed", value: text, formatting: { version: 2 },
} } })?.sections.offers?.value, text, "unrecognized formatting keeps the stored text readable");

const section = getCommunicationSection("offers")!;
assert.deepEqual(sectionEditState(section, base.sections.offers, text, false, undefined, draft.formatting),
  { valid: true, dirty: false });
assert.deepEqual(sectionEditState(section, base.sections.offers, text, false, undefined, null),
  { valid: true, dirty: true });

const atLimit = serializeCommunicationText({ type: "doc", content: [
  { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "á".repeat(30_000), marks: [{ type: "bold" }] }] },
] });
assert.equal(atLimit.text.length, 30_000);
assert.ok(withSection({}, "offers", atLimit.text, "user_confirmed", communicationSections, undefined, atLimit.formatting));
assert.equal(withSection({}, "offers", atLimit.text + "x", "user_confirmed", communicationSections, undefined, atLimit.formatting), null);

const manuallyFormatted = withSection({}, "about", draft.text, "user_reviewed", communicationSections, undefined, draft.formatting);
assert.ok(manuallyFormatted);
const replaced = withGeneratedIntelligence(manuallyFormatted, communicationSections.filter(section => section.stage === 2)
  .map(section => ({ key: section.key, value: section.format === "text" ? "Entrega" : section.format === "items" ? ["Item"] :
    [{ question: "Como?", answer: "Assim." }] })), communicationSections);
assert.equal(projectCommunicationBase({ ...row, sections_json: replaced })?.sections.about?.formatting, undefined);
