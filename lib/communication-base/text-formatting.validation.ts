import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";
import { sectionEditState } from "../../app/a/[account]/base-comunicacao/_components/section-edit-state";
import { selectStageTwoInput, stageTwoPrompt } from "./ai-core";
import { buildAgentBasePilotPrompt, selectAgentBasePilotInput } from "./agent-base/pilot";
import { projectCommunicationBase, withGeneratedIntelligence, withSection } from "./policy";
import { communicationSections, getCommunicationSection } from "./registry";
import {
  communicationTextDocument, communicationTextForReading, parseCommunicationTextFormatting, plainTextDocument,
  serializeCommunicationText, supportsCommunicationTextFormatting,
} from "./text-formatting";
import { communicationTextLinks, isHttpAddress } from "./text-links";
import { stageTwoInputStateKey } from "./ui-state-keys";

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
const structuredText = `Atendimento\n3. Informações\n   • ${address}\n4. Prazo até 24 h\nSujeito à disponibilidade.\nObservações\n       & <literal>`;
assert.equal(text, `Atendimento\nInformações\n${address}\nPrazo até 24 h\nSujeito à disponibilidade.\nObservações\n & <literal>`);
assert.ok(draft.formatting);
assert.equal(communicationTextForReading(text, draft.formatting, 30_000), structuredText);
assert.deepEqual(parseCommunicationTextFormatting(text, draft.formatting), draft.formatting);
assert.equal(serializeCommunicationText(communicationTextDocument(text, draft.formatting)).text.trim(), text);
assert.ok(!JSON.stringify(draft.formatting).includes(address));
assert.ok(!JSON.stringify(draft.formatting).includes("Atendimento"));
assert.equal(parseCommunicationTextFormatting("Outro texto", draft.formatting), null);
assert.equal(parseCommunicationTextFormatting(text, { version: 1, blocks: [{ kind: "title", spans: [[0, 3], [2, 5]] }] }), null);
assert.deepEqual(serializeCommunicationText(plainTextDocument("**Literal**\n\nTítulo?\n• Texto")), { text: "**Literal**\n\nTítulo?\n• Texto" });

assert.deepEqual(communicationTextLinks(`(${address}), http://exemplo.com/pasta. email@exemplo.com ftp://exemplo.com`)
  .map(link => link.value), [address, "http://exemplo.com/pasta"]);
assert.deepEqual(communicationTextLinks("Visite [http://[2001:db8::1]:8080/x?teste=1], ok.").map(link => link.value),
  ["http://[2001:db8::1]:8080/x?teste=1"]);
assert.equal(communicationTextLinks("https://example.com/a!")[0]?.value, "https://example.com/a!");
assert.equal(communicationTextLinks("Veja (https://example.com/a!)")[0]?.value, "https://example.com/a!");
assert.equal(communicationTextLinks("Visite 'https://example.com/politica'.")[0]?.value, "https://example.com/politica");
assert.equal(communicationTextLinks("Visite ‘https://example.com/d'água!’.")[0]?.value, "https://example.com/d'água!");
assert.equal(communicationTextLinks("https://example.com/d'água")[0]?.value, "https://example.com/d'água");
assert.equal(communicationTextLinks("Veja ('https://example.com/politica').")[0]?.value, "https://example.com/politica");
assert.equal(communicationTextLinks("Veja [‘https://example.com/politica’].")[0]?.value, "https://example.com/politica");
assert.equal(communicationTextLinks("'https://example.com/politica': veja os detalhes.")[0]?.value, "https://example.com/politica");
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
const target = { kind: "section", key: "about" } as const;
const niche = { confirmed: true, taxonId: null, name: "Atendimento", revision: "1" } as const;
assert.equal(JSON.parse(stageTwoPrompt(base, target, false, niche)!.input).confirmed_business_data.offers, structuredText);
assert.equal(JSON.parse(buildAgentBasePilotPrompt({ base, definitions: communicationSections, niche, key: "about", previous: [] })!.input)
  .confirmed_business_data.offers.value, structuredText);
assert.equal(withSection({}, "business_name", draft.text, "user_confirmed", communicationSections, undefined, draft.formatting), null);
assert.equal(withSection({}, "faq", draft.text, "agent_generated", communicationSections, undefined, draft.formatting), null);
assert.ok(withSection({}, "faq", draft.text, "user_reviewed", communicationSections, undefined, draft.formatting));

const unformatted = withSection(saved, "offers", text, "user_confirmed", communicationSections, undefined, null);
assert.ok(unformatted);
const withoutLayout = projectCommunicationBase({ ...row, sections_json: unformatted });
assert.ok(withoutLayout);
assert.equal(withoutLayout.sections.offers?.formatting, undefined);
assert.notEqual(stageTwoInputStateKey(base), stageTwoInputStateKey(withoutLayout), "a change in data sent to AI invalidates suggestions");
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
for (const start of [-1, 0, 1_000_000]) {
  const ordered = serializeCommunicationText({ type: "doc", content: [
    { type: "orderedList", attrs: { start }, content: [item(paragraph("Um item"))] },
  ] });
  assert.equal(ordered.text, "Um item");
  assert.deepEqual(parseCommunicationTextFormatting(ordered.text, ordered.formatting), ordered.formatting);
  assert.equal(communicationTextForReading(ordered.text, ordered.formatting, 30_000), `${start}. Um item`);
}
for (const length of [10_000, 30_000]) {
  const full = serializeCommunicationText({ type: "doc", content: [
    { type: "bulletList", content: [item(paragraph("é".repeat(length)))] },
  ] });
  const stored = withSection({}, "offers", full.text, "user_confirmed", communicationSections, undefined, full.formatting);
  assert.ok(stored);
  const reopened = projectCommunicationBase({ ...row, sections_json: stored });
  assert.ok(reopened?.sections.offers?.formatting);
  assert.equal(reopened.sections.offers.value, "é".repeat(length));
  if (length === 10_000) {
    assert.equal(selectStageTwoInput(reopened, target)?.confirmed.offers, full.text);
    assert.equal(selectAgentBasePilotInput(reopened, communicationSections)?.confirmed.offers?.value, full.text);
    assert.equal(JSON.parse(stageTwoPrompt(reopened, target, false, niche)!.input).confirmed_business_data.offers, full.text);
  }
}

const manuallyFormatted = withSection({}, "about", draft.text, "user_reviewed", communicationSections, undefined, draft.formatting);
assert.ok(manuallyFormatted);
const reviewedBase = projectCommunicationBase({ ...row, sections_json: { ...saved, ...manuallyFormatted } });
assert.ok(reviewedBase);
assert.equal(JSON.parse(stageTwoPrompt(reviewedBase, target, false, niche)!.input).existing_stage_two_draft.about, structuredText);
const replaced = withGeneratedIntelligence(manuallyFormatted, communicationSections.filter(section => section.stage === 2)
  .map(section => ({ key: section.key, value: section.format === "text" ? "Entrega" : section.format === "items" ? ["Item"] :
    [{ question: "Como?", answer: "Assim." }] })), communicationSections);
assert.equal(projectCommunicationBase({ ...row, sections_json: replaced })?.sections.about?.formatting, undefined);
