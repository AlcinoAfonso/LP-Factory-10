import assert from "node:assert/strict";
import { getCommunicationSection } from "../../../../../lib/communication-base/registry";
import { sectionEditState, hasSectionContent } from "./section-edit-state";

const text = getCommunicationSection("business_context")!;
const items = getCommunicationSection("offers")!;
const faq = getCommunicationSection("faq")!;
assert.deepEqual(sectionEditState(text, undefined, "   "), { valid: true, dirty: false });
assert.deepEqual(sectionEditState(text, { format: "text", value: "Atuação real", origin: "user_confirmed" }, "  Atuação real  "),
  { valid: true, dirty: false }, "normalization must not enable an unchanged save");
assert.deepEqual(sectionEditState(text, undefined, "Novo texto"), { valid: true, dirty: true });
assert.deepEqual(sectionEditState(text, undefined, "x".repeat(4001)), { valid: false, dirty: true },
  "invalid changes must still receive exit protection");
assert.deepEqual(sectionEditState(items, { format: "items", value: ["Oferta A", "Oferta B"], origin: "user_confirmed" }, "Oferta A\nOferta B\n"),
  { valid: true, dirty: false });
assert.deepEqual(sectionEditState(items, undefined, "x".repeat(401)), { valid: false, dirty: true });
assert.deepEqual(sectionEditState(faq, undefined, "Pergunta sem resposta | "), { valid: false, dirty: true });
assert.deepEqual(sectionEditState(faq, { format: "faq", value: [{ question: "Quem?", answer: "Equipe" }], origin: "user_reviewed" }, " Quem? | Equipe "),
  { valid: true, dirty: false });
assert.deepEqual(sectionEditState(text, { format: "text", value: "Anterior", origin: "user_confirmed" }, ""), { valid: true, dirty: true },
  "explicit clearing remains an existing capability");
assert.equal(hasSectionContent(" "), false);
assert.equal(hasSectionContent([]), false);
assert.equal(hasSectionContent(["Oferta"]), true);
console.log("E25.2 section edit state validation passed");
