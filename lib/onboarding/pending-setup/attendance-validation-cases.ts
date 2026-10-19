import assert from "node:assert/strict";
import nodeModule from "node:module";
import { attendanceContactProjection, attendanceProjection, attendancePrompt, attendanceProposal, attendanceSummary, validateAttendanceOutput,
  validateStoredAttendanceProposal, type AttendanceContext, type AttendanceOutput } from "./attendance-core";
import type { AttendanceDependencies } from "./attendance-coordinator";
import type { PendingSetupConversation } from "./contracts";
const accountId = "10000000-0000-4000-8000-000000000001";
const segmentId = "10000000-0000-4000-8000-000000000002";
const nicheId = "10000000-0000-4000-8000-000000000003";
const context: AttendanceContext = {
  preferredName: "Ana", summary: null,
  displayedUnderstanding: "Manutenção de jardins para condomínios.",
  recent: [{ role: "user", content: "Faço manutenção de jardins para condomínios e quero explicar meu serviço." }],
  catalog: [
    { id: segmentId, name: "Serviços", level: "segment", parentId: null, active: true, aliases: [] },
    { id: nicheId, name: "Jardinagem", level: "niche", parentId: segmentId, active: true, aliases: ["Manutenção de jardins"] },
  ],
};
const base: AttendanceOutput = {
  reply: "Jardinagem corresponde ao seu negócio?", preferredName: "Ana", preferredNameDeclined: false, requestWhatsapp: false, whatsappReference: null, whatsappDeclined: false,
  businessUnderstanding: "Manutenção de jardins para condomínios.", confirmedUnderstanding: null,
  suggestions: ["Pode ser útil explicar a frequência do serviço."], sufficientUnderstanding: true,
  readyToComplete: false, closureReason: null, action: "existing", existingTaxonId: nicheId,
};
const conversation: PendingSetupConversation = {
  id: accountId, accountId, userId: accountId, preferredName: "Ana", preferredNameDeclined: false,
  businessDisplayName: null, businessContextText: base.businessUnderstanding, stage: "business_understanding",
  confirmationKind: null, resolutionOutcome: null, openAiCallCount: 3, version: 1,
  createdAt: "2026-10-09T00:00:00Z", updatedAt: "2026-10-09T00:00:00Z", completedAt: null,
  attendanceEnabled: true, attendanceProposal: null, attendanceTurnIntent: null,
  accountContext: { summary: context.summary, updatedAt: "2026-10-09T00:00:00Z" },
  messages: [{ id: "1", ordinal: 1, role: "user", content: "Faço jardins. Contato ana@example.com.", createdAt: "2026-10-09T00:00:00Z" }],
};
function response(output: unknown, extra: unknown[] = []) {
  return { id: "resp_attendance_test", status: "completed", usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 },
    output: [...extra, { type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }] };
}
async function main() {
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) { return name === "server-only" ? {} : original.call(this, name, parent, isMain); };
  const [provider, coordinator, catalogAdapter] = await Promise.all([
    import("./attendance-provider"), import("./attendance-coordinator"), import("./adapters/pendingSetupCatalogContextAdapter"),
  ]).finally(() => { loader._load = original; });
  const { parseAttendanceResponse, requestAttendance } = provider;
  const { conductAttendanceTurn } = coordinator;
  assert.equal("$schema" in attendancePrompt(context).schema, false);
  assert.equal(validateAttendanceOutput(base, context)?.action, "existing");
  assert.equal(validateAttendanceOutput({ ...base, readyToComplete: true }, context), null); // proposal never completes.
  assert.equal(validateAttendanceOutput({ ...base, existingTaxonId: accountId }, context), null);
  assert.equal(validateAttendanceOutput(base, { ...context, currentPrimaryTaxonId: segmentId }), null);
  assert.equal(validateAttendanceOutput(base, { ...context, catalog: context.catalog.map(t => t.id === segmentId ? { ...t, active: false } : t) }), null);
  for (const action of ["research", "propose", "new"]) assert.equal(validateAttendanceOutput({ ...base, action }, context), null);
  for (const extra of [{ chain: [] }, { aliases: [] }, { grantTrial: true }]) assert.equal(validateAttendanceOutput({ ...base, ...extra }, context), null);
  const proposal = attendanceProposal(base, context.catalog);
  assert.deepEqual(proposal, { kind: "existing", taxonId: nicheId, taxonName: "Jardinagem" });
  assert.ok(validateStoredAttendanceProposal(proposal));
  assert.equal(validateStoredAttendanceProposal({ kind: "new", taxonId: null, chain: [] }), null);
  const pending = { ...base, action: "pending" as const, existingTaxonId: null };
  const fallback = attendanceProposal(pending, context.catalog);
  assert.ok(fallback);
  assert.equal(validateAttendanceOutput(pending, { ...context, currentPrimaryTaxonId: nicheId }), null);
  assert.equal(validateAttendanceOutput(pending, { ...context, confirmedOperationalUnderstanding: true }), null);
  for (const proposed of [base, pending]) {
    assert.equal(validateAttendanceOutput({ ...proposed, businessUnderstanding: "" }, context)?.businessUnderstanding, context.displayedUnderstanding);
    assert.equal(validateAttendanceOutput({ ...proposed, businessUnderstanding: "" }, { ...context, displayedUnderstanding: null }), null);
  }
  const confirm = { ...base, action: "confirm" as const, existingTaxonId: null, businessUnderstanding: "Inventado pelo modelo." };
  assert.equal(validateAttendanceOutput(confirm, context), null);
  for (const confirmedProposal of [proposal, fallback]) {
    const confirmation = { ...context, confirmedProposal };
    const accepted = validateAttendanceOutput(confirm, confirmation);
    assert.equal(accepted?.businessUnderstanding, context.displayedUnderstanding);
    assert.equal(accepted?.readyToComplete, false); // confirmation may continue useful sales.
    assert.equal(validateAttendanceOutput({ ...confirm, readyToComplete: true }, confirmation)?.readyToComplete, true);
    assert.equal(validateAttendanceOutput(base, confirmation), null);
    assert.equal(validateAttendanceOutput({ ...confirm, existingTaxonId: nicheId }, confirmation), null);
    assert.equal(validateAttendanceOutput(confirm, { ...confirmation, displayedUnderstanding: null }), null);
  }
  const finishing = { ...base, action: "ask" as const, existingTaxonId: null, readyToComplete: true };
  assert.equal(validateAttendanceOutput(finishing, context), null);
  assert.ok(validateAttendanceOutput(finishing, { ...context, currentPrimaryTaxonId: nicheId }));
  assert.ok(validateAttendanceOutput(finishing, { ...context, confirmedOperationalUnderstanding: true }));
  for (const authority of [{ currentPrimaryTaxonId: nicheId }, { confirmedOperationalUnderstanding: true }]) {
    assert.equal(validateAttendanceOutput({ ...finishing, businessUnderstanding: "" }, { ...context, ...authority })?.businessUnderstanding, context.displayedUnderstanding);
    assert.equal(validateAttendanceOutput({ ...finishing, businessUnderstanding: "" }, { ...context, ...authority, displayedUnderstanding: null }), null);
  }
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "ana@example.com" }, context), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "Bia" }, context), null);
  assert.ok(validateAttendanceOutput({ ...base, preferredName: "Bia" }, { ...context, recent: [{ role: "user", content: "Me chame de Bia." }] }));
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true }, context), null);
  assert.ok(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true }, { ...context, preferredName: null }));
  // Interpretations remain proposals until the existing explicit confirmation.
  assert.equal(validateAttendanceOutput({ ...base, declaredFacts: [] }, context), null);
  const draft = JSON.parse(attendanceSummary(base, null, null));
  assert.equal(draft.contextualUnderstanding, base.businessUnderstanding);
  assert.equal(draft.confirmedUnderstanding, null);
  assert.equal(draft.classification, "Não identificada.");
  assert.deepEqual(draft.suggestions, base.suggestions);
  const accepted = validateAttendanceOutput(confirm, { ...context, confirmedProposal: proposal })!;
  const remembered = attendanceSummary(accepted, null, proposal);
  assert.equal(JSON.parse(remembered).confirmedUnderstanding, context.displayedUnderstanding);
  assert.equal(JSON.parse(remembered).classification, "Jardinagem");
  const later = { ...base, action: "ask" as const, existingTaxonId: null, businessUnderstanding: "Também quer comunicar planos mensais." };
  const evolving = JSON.parse(attendanceSummary(later, "Jardinagem", null, remembered));
  assert.equal(evolving.contextualUnderstanding, later.businessUnderstanding);
  assert.equal(evolving.confirmedUnderstanding, null); // No automatic promotion of the new interpretation.
  assert.deepEqual(evolving.suggestions, base.suggestions);
  const socialContext: AttendanceContext = { ...context, summary: remembered, recent: [{ role: "user", content: "Eu sou flamenguista." }] };
  const noBusinessNews = validateAttendanceOutput({ ...later, businessUnderstanding: "", suggestions: [], readyToComplete: false }, socialContext)!;
  assert.equal(noBusinessNews.businessUnderstanding, "");
  const retained = attendanceSummary(noBusinessNews, "Jardinagem", null, remembered);
  assert.equal(retained, remembered); // The literal social message is never automatically imported.
  assert.equal(retained.includes("flamenguista"), false);
  const closing = { ...noBusinessNews, reply: "Sem avanço neste momento, encerro por aqui. Obrigado pela conversa.",
    closureReason: "Não houve avanço útil para esclarecer a necessidade comercial." };
  assert.ok(validateAttendanceOutput(closing, socialContext));
  for (const invalid of [{ ...closing, readyToComplete: true }, { ...base, closureReason: closing.closureReason },
    { ...confirm, closureReason: closing.closureReason }]) assert.equal(validateAttendanceOutput(invalid, socialContext), null);
  const closedSummary = attendanceSummary(closing, "Jardinagem", null, remembered);
  assert.equal(JSON.parse(closedSummary).pendingReason, closing.closureReason);
  assert.equal(JSON.parse(closedSummary).confirmedUnderstanding, context.displayedUnderstanding);
  assert.equal(closedSummary.includes("flamenguista"), false);
  assert.equal(JSON.parse(attendanceSummary(later, "Jardinagem", null, closedSummary)).pendingReason, null);
  assert.equal(JSON.parse(attendanceSummary(noBusinessNews, "Jardinagem", null, closedSummary)).pendingReason, null);
  const closedProjection = attendanceProjection({ ...conversation, accountContext: {
    summary: closedSummary, updatedAt: conversation.updatedAt,
  } }, context.catalog);
  assert.equal(JSON.parse(closedProjection.summary!).pendingReason, closing.closureReason);
  for (const malformed of ["not JSON", '{"contextualUnderstanding":"unaccepted"}']) {
    assert.equal(JSON.parse(attendanceSummary(later, null, null, malformed)).confirmedUnderstanding, null);
  }
  // Global Summary capacity changes; individual understanding and reply limits do not.
  const lengthyAccepted = { ...accepted, businessUnderstanding: "a".repeat(2500) };
  const bounded = attendanceSummary(lengthyAccepted, "Jardinagem", proposal);
  assert.ok(bounded.length > 4000 && bounded.length <= 6000);
  assert.equal(JSON.parse(bounded).confirmedUnderstanding, lengthyAccepted.businessUnderstanding);
  assert.equal(JSON.parse(attendanceProjection({ ...conversation, accountContext: {
    summary: bounded, updatedAt: conversation.updatedAt,
  } }, context.catalog).summary!).confirmedUnderstanding, lengthyAccepted.businessUnderstanding);
  const atOldLimit = JSON.stringify({ contextualUnderstanding: null, confirmedUnderstanding: "a".repeat(3865),
    classification: "Curta", suggestions: [] });
  const updated = attendanceSummary({ ...later, confirmedUnderstanding: "Conteúdo anterior semanticamente compacto.",
    businessUnderstanding: "Conteúdo anterior semanticamente compacto. Também oferece implantes." }, "Jardinagem", null, atOldLimit);
  assert.match(JSON.parse(updated).contextualUnderstanding, /implantes/);
  assert.equal(JSON.parse(updated).confirmedUnderstanding, "Conteúdo anterior semanticamente compacto.");
  for (const oversized of ["a".repeat(4000), '"'.repeat(2000)]) {
    const result = attendanceSummary({ ...accepted, businessUnderstanding: oversized }, "Jardinagem", proposal);
    assert.ok(result.length <= 6000);
    assert.equal(JSON.parse(result).confirmedUnderstanding, oversized);
    assert.equal(JSON.parse(result).contextualUnderstanding, null); // Only the identical duplicate was removed.
  }
  assert.throws(() => attendanceSummary({ ...later, businessUnderstanding: "a".repeat(4000),
    confirmedUnderstanding: "b".repeat(4000) }, "Jardinagem", null), /attendance_summary_too_long/);
  assert.throws(() => attendanceSummary({ ...accepted, businessUnderstanding: '"'.repeat(4000) }, "Jardinagem", proposal), /attendance_summary_too_long/);
  for (const field of ["reply", "businessUnderstanding", "confirmedUnderstanding"])
    assert.equal(validateAttendanceOutput({ ...base, [field]: "a".repeat(4001) }, context), null);
  assert.equal(validateAttendanceOutput({ ...base, confirmedUnderstanding: "Inventado como confirmado." }, context), null);
  const acceptedContext = { ...context, summary: remembered };
  const corrected = { ...later, businessUnderstanding: "Clínica Sorriso oferece clareamento e implantes; não oferece mais canal.",
    confirmedUnderstanding: "Clínica Sorriso oferece clareamento e implantes." };
  assert.ok(validateAttendanceOutput(corrected, acceptedContext));
  const correctedMemory = attendanceSummary(corrected, "Jardinagem", null, remembered);
  assert.equal(JSON.parse(correctedMemory).confirmedUnderstanding, corrected.confirmedUnderstanding);
  assert.equal(JSON.parse(correctedMemory).contextualUnderstanding, corrected.businessUnderstanding);
  assert.equal(JSON.parse(attendanceProjection({ ...conversation, accountContext: {
    summary: correctedMemory, updatedAt: conversation.updatedAt,
  } }, context.catalog).summary!).contextualUnderstanding, corrected.businessUnderstanding);
  const compound = "João. Tenho a Clínica Sorriso e fazemos clareamento, tratamento de canal e implantes.";
  const nameContext: AttendanceContext = { ...context, preferredName: null, recent: [
    { role: "assistant", content: "Olá! Como prefere ser chamado?" }, { role: "user", content: compound },
  ] };
  const compoundOutput = { ...base, preferredName: "João", businessUnderstanding: "Clínica Sorriso oferece clareamento, tratamento de canal e implantes." };
  assert.equal(validateAttendanceOutput(compoundOutput, nameContext)?.preferredName, "João");
  assert.equal(validateAttendanceOutput({ ...compoundOutput, preferredName: "Pedro" }, nameContext), null);
  assert.equal(validateAttendanceOutput({ ...compoundOutput, preferredName: "Jo" }, nameContext), null);
  assert.equal(validateAttendanceOutput({ ...compoundOutput, preferredName: "joao@example.com" }, nameContext), null);
  for (const identifier of ["Ana@example.com", "Ana.silva@example.com", "Ana/123", "Ana_123"]) {
    assert.equal(validateAttendanceOutput({ ...compoundOutput, preferredName: "Ana" }, { ...nameContext, recent: [
      nameContext.recent[0], { role: "user", content: identifier }] }), null);
    assert.equal(validateAttendanceOutput({ ...compoundOutput, preferredName: "Ana" }, { ...nameContext, preferredName: "João", recent: [
      { role: "user", content: "Pode me chamar de " + identifier }] }), null);
  }
  for (const separator of [". ", ", ", "; ", ": ", "! ", "? "]) {
    assert.equal(validateAttendanceOutput(compoundOutput, { ...nameContext, recent: [
      nameContext.recent[0], { role: "user", content: "João" + separator + "Tenho uma clínica." }] })?.preferredName, "João");
  }
  assert.equal(validateAttendanceOutput({ ...compoundOutput, preferredNameDeclined: true }, nameContext), null);
  const correctedNameContext = { ...nameContext, preferredName: "Ana", recent: [
    { role: "user" as const, content: "Pode me chamar de João. Na verdade, prefiro Pedro." }] };
  assert.equal(validateAttendanceOutput({ ...compoundOutput, preferredName: "Pedro" }, correctedNameContext)?.preferredName, "Pedro");
  assert.equal(validateAttendanceOutput({ ...compoundOutput, preferredName: "Paulo" }, correctedNameContext), null);
  // Which literal candidate is the current preference is proved with the real model, not a phrase parser.
  for (const question of ["Qual é o nome da sua empresa?", "Qual o nome da clínica?", "Como prefere que a empresa seja chamada?"]) {
    const businessNameContext: AttendanceContext = { ...nameContext, recent: [
      { role: "assistant", content: question }, { role: "user", content: "Clínica Sorriso. Fazemos implantes." }] };
    const businessNameOutput = { ...compoundOutput, preferredName: "Clínica Sorriso", businessUnderstanding: "Clínica Sorriso oferece implantes." };
    const safeBusiness = validateAttendanceOutput({ ...businessNameOutput, preferredName: null,
      reply: "Olá! Como prefere ser chamado?", action: "ask", existingTaxonId: null }, businessNameContext);
    assert.equal(safeBusiness?.businessUnderstanding, businessNameOutput.businessUnderstanding);
  }
  assert.equal(validateAttendanceOutput(compoundOutput, { ...nameContext, recent: [
    { role: "assistant", content: "  Como prefere ser chamado?  " }, nameContext.recent[1]] })?.preferredName, "João");
  const nameRequest = { ...base, preferredName: null, reply: "Olá! Como prefere ser chamado?", action: "ask", existingTaxonId: null };
  assert.ok(validateAttendanceOutput(nameRequest, nameContext));
  assert.equal(validateAttendanceOutput({ ...nameRequest, reply: "Como gostaria de ser chamado?" }, nameContext), null);
  assert.equal(validateAttendanceOutput({ ...nameRequest, action: "existing", existingTaxonId: base.existingTaxonId }, nameContext), null);
  assert.ok(validateAttendanceOutput({ ...nameRequest, reply: "Encerramos por aqui; podemos retomar o objetivo comercial quando desejar.",
    closureReason: "Desvio persistente sem avanço útil." }, nameContext));
  const businessOnlyAnswer = { ...nameContext, recent: [nameContext.recent[0],
    { role: "user" as const, content: "Minha empresa se chama Clínica Ana; prefiro não informar meu nome" }] };
  assert.ok(validateAttendanceOutput({ ...compoundOutput, preferredName: null, preferredNameDeclined: true }, businessOnlyAnswer));
  assert.equal(validateAttendanceOutput(compoundOutput, { ...nameContext, preferredName: "Ana", recent: [
    { role: "user", content: "Pode me chamar de João." }] })?.preferredName, "João");
  const renamed = validateAttendanceOutput(compoundOutput, { ...nameContext, preferredName: "Ana", recent: [
    { role: "user", content: "Pode me chamar de João. Também administro uma clínica." }] });
  assert.equal(renamed?.preferredName, "João");
  assert.equal(renamed?.businessUnderstanding, compoundOutput.businessUnderstanding);
  assert.equal(validateAttendanceOutput({ ...compoundOutput, preferredName: "Jo" }, { ...nameContext, preferredName: "Ana", recent: [
    { role: "user", content: "Pode me chamar de João. Também administro uma clínica." }] }), null);
  const longMessage = compound + " Temos atendimento presencial.".repeat(60) + " Atendemos adultos e queremos explicar implantes.";
  const integral = attendanceProjection({ ...conversation, preferredName: null, messages: [
    { ...conversation.messages[0], role: "assistant", content: "Olá! Como prefere ser chamado?" },
    { ...conversation.messages[0], id: "2", role: "user", content: longMessage },
  ] }, context.catalog);
  assert.equal(integral.recent.at(-1)?.content, longMessage);
  assert.equal(integral.publicName, null);
  assert.equal(attendanceProjection(conversation, context.catalog).displayedUnderstanding, conversation.businessContextText);
  assert.equal(JSON.stringify(attendanceProjection(conversation, context.catalog)).includes("ana@example.com"), false);
  const urlSummary = JSON.stringify({ ...draft, confirmedUnderstanding: "Atendo em https://example.com", suggestions: ["Conheça https://example.com"] });
  const projected = attendanceProjection({ ...conversation, accountContext: { summary: urlSummary, updatedAt: conversation.updatedAt } }, context.catalog);
  assert.equal(projected.summary?.includes("https://"), false);
  assert.equal(JSON.parse(projected.summary!).classification, draft.classification);
  assert.equal(JSON.parse(projected.summary!).suggestions.length, 1);
  assert.equal(JSON.parse(attendanceSummary(noBusinessNews, null, null, urlSummary)).confirmedUnderstanding, JSON.parse(urlSummary).confirmedUnderstanding);
  // Only literal user contacts can enter the existing Summary; raw PII stays out of provider context.
  const phone = "+55 (21) 99999-0000";
  const contactConversation = { ...conversation, messages: [
    { ...conversation.messages[0], role: "assistant" as const, content: "Exemplo de terceiro: +55 21 98888-1111" },
    { ...conversation.messages[0], id: "2", role: "user" as const, content: "Meu WhatsApp é +55 (21) 99999-0000. Faço jardins." },
  ] };
  const phoneContext = attendanceProjection(contactConversation, context.catalog);
  const numbers = attendanceContactProjection(contactConversation.messages).contacts;
  assert.deepEqual(phoneContext.contactReferences, ["phone_1_0"]);
  assert.equal(JSON.stringify(phoneContext).includes("99999"), false);
  assert.equal(JSON.stringify(phoneContext).includes("98888"), false);
  const contactOutput = { ...base, whatsappReference: "phone_1_0" };
  assert.ok(validateAttendanceOutput(contactOutput, phoneContext));
  assert.equal(validateAttendanceOutput({ ...base, whatsappReference: "invented" }, phoneContext), null);
  assert.equal(validateAttendanceOutput({ ...contactOutput, whatsappDeclined: true }, phoneContext), null);
  assert.throws(() => attendanceSummary(contactOutput, null, null), /contact_reference_invalid/);
  const contactSummary = attendanceSummary(contactOutput, null, null, null, numbers);
  assert.equal(JSON.parse(contactSummary).whatsapp, phone);
  assert.equal(JSON.parse(contactSummary).pendingReason, null);
  const missingNiche = "Nicho sem correspondência segura no catálogo.";
  assert.equal(JSON.parse(attendanceSummary({ ...noBusinessNews, preferredName: null }, null, null)).pendingReason, null);
  const unresolvedSummary = attendanceSummary(pending, null, null);
  assert.equal(JSON.parse(unresolvedSummary).pendingReason, missingNiche);
  assert.equal(JSON.parse(attendanceSummary(noBusinessNews, null, null, unresolvedSummary)).pendingReason, missingNiche);
  assert.equal(JSON.parse(attendanceSummary(base, null, null, unresolvedSummary)).pendingReason, null);
  assert.equal(JSON.parse(attendanceSummary(accepted, null, fallback)).pendingReason, missingNiche);
  assert.equal(JSON.parse(attendanceSummary(accepted, null, proposal)).pendingReason, null);
  assert.equal(JSON.parse(attendanceSummary(noBusinessNews, null, null, contactSummary)).whatsapp, phone);
  const retainedContact = attendanceProjection({ ...conversation, accountContext: {
    summary: contactSummary, updatedAt: conversation.updatedAt,
  } }, context.catalog);
  assert.equal(retainedContact.summary?.includes(phone), false);
  assert.equal(JSON.parse(retainedContact.summary!).whatsapp, undefined);
  assert.equal(retainedContact.whatsappProvided, true);
  const acceptedContactSummary = JSON.stringify({ ...JSON.parse(contactSummary), confirmedUnderstanding: context.displayedUnderstanding });
  const acceptedContactContext = attendanceProjection({ ...conversation, accountContext: {
    summary: acceptedContactSummary, updatedAt: conversation.updatedAt,
  } }, context.catalog);
  assert.ok(validateAttendanceOutput({ ...later, confirmedUnderstanding: context.displayedUnderstanding }, acceptedContactContext));
  // Projection-scoped contact tokens must never escape into public or semantic output.
  const semanticOutput = { ...base, confirmedUnderstanding: context.displayedUnderstanding };
  assert.ok(validateAttendanceOutput(semanticOutput, acceptedContactContext));
  for (const token of ["[phone_1_0]", "phone_1_0", "[phone_99_99]", "[PHONE_1_0]"]) {
    for (const field of ["reply", "preferredName", "businessUnderstanding", "confirmedUnderstanding", "closureReason"]) {
      assert.equal(validateAttendanceOutput({ ...semanticOutput, [field]: token }, acceptedContactContext), null);
    }
    assert.equal(validateAttendanceOutput({ ...semanticOutput, suggestions: ["Use " + token] }, acceptedContactContext), null);
    for (const field of ["businessUnderstanding", "confirmedUnderstanding"]) {
      assert.equal(validateAttendanceOutput({ ...confirm, [field]: token }, { ...context, confirmedProposal: proposal }), null);
    }
  }
  const requestingWhatsapp = { ...finishing, requestWhatsapp: true, readyToComplete: false };
  assert.ok(validateAttendanceOutput(requestingWhatsapp, { ...context, confirmedOperationalUnderstanding: true }));
  assert.equal(validateAttendanceOutput({ ...requestingWhatsapp, sufficientUnderstanding: false }, context), null);
  assert.equal(validateAttendanceOutput(requestingWhatsapp, context), null);
  assert.ok(validateAttendanceOutput(requestingWhatsapp, { ...context, currentPrimaryTaxonId: nicheId }));
  const contactWithoutNews = validateAttendanceOutput({ ...requestingWhatsapp, businessUnderstanding: "" },
    { ...context, currentPrimaryTaxonId: nicheId });
  assert.equal(contactWithoutNews?.businessUnderstanding, context.displayedUnderstanding);
  assert.equal(contactWithoutNews?.requestWhatsapp, true);
  assert.equal(contactWithoutNews?.readyToComplete, false);
  assert.equal(validateAttendanceOutput({ ...requestingWhatsapp, businessUnderstanding: "" },
    { ...context, currentPrimaryTaxonId: nicheId, displayedUnderstanding: null }), null);
  assert.equal(validateAttendanceOutput(requestingWhatsapp, { ...context, currentPrimaryTaxonId: nicheId,
    catalog: context.catalog.map(taxon => ({ ...taxon, active: false })) }), null);
  assert.equal(validateAttendanceOutput({ ...base, requestWhatsapp: true }, context), null);
  assert.equal(validateAttendanceOutput({ ...base, action: "pending", existingTaxonId: null, requestWhatsapp: true }, context), null);
  assert.ok(validateAttendanceOutput({ ...requestingWhatsapp, action: "confirm" }, { ...context, confirmedProposal: { kind: "operational_fallback", taxonId: null, taxonName: null } }));
  assert.equal(validateAttendanceOutput({ ...requestingWhatsapp, readyToComplete: true }, { ...context, confirmedOperationalUnderstanding: true }), null);
  assert.equal(validateAttendanceOutput(requestingWhatsapp, { ...context, whatsappProvided: true }), null);
  assert.equal(validateAttendanceOutput({ ...contactOutput, requestWhatsapp: true }, phoneContext), null);
  assert.equal(validateAttendanceOutput(requestingWhatsapp, { ...context, summary: JSON.stringify({ ...draft, whatsappDeclined: true }) }), null);
  const declined = { ...finishing, whatsappDeclined: true };
  assert.ok(validateAttendanceOutput(declined, { ...context, confirmedOperationalUnderstanding: true }));
  const declinedSummary = attendanceSummary(declined, null, null);
  assert.equal(JSON.parse(declinedSummary).whatsappDeclined, true);
  const withdrawnSummary = attendanceSummary({ ...noBusinessNews, whatsappDeclined: true }, null, null, contactSummary);
  assert.equal(JSON.parse(withdrawnSummary).whatsapp, undefined);
  assert.equal(JSON.parse(withdrawnSummary).whatsappDeclined, true);
  assert.equal(JSON.parse(withdrawnSummary).contextualUnderstanding, JSON.parse(contactSummary).contextualUnderstanding);
  const withdrawnProjection = attendanceProjection({ ...conversation, accountContext: {
    summary: withdrawnSummary, updatedAt: conversation.updatedAt,
  } }, context.catalog);
  assert.equal(withdrawnProjection.whatsappProvided, false);
  assert.equal(JSON.parse(attendanceSummary(noBusinessNews, null, null, declinedSummary)).whatsappDeclined, true);
  assert.equal(JSON.parse(attendanceProjection({ ...conversation, accountContext: {
    summary: declinedSummary, updatedAt: conversation.updatedAt,
  } }, context.catalog).summary!).whatsappDeclined, true);
  const correctedContacts = attendanceContactProjection([{ role: "user", content: "Correção: meu WhatsApp é +55 11 97777-2222." }]);
  const correctedSummary = attendanceSummary({ ...base, whatsappReference: "phone_0_0" }, null, null, contactSummary, correctedContacts.contacts);
  assert.equal(JSON.parse(correctedSummary).whatsapp, "+55 11 97777-2222");
  // Canonical writes preserve distinct commercial meanings and the physical fail-closed limit.
  const legacyFields = { contextualUnderstanding: "", confirmedUnderstanding: "", classification: "Jardinagem", suggestions: [], pendingReason: null };
  const legacyContext = "Contexto comercial atual: ".padEnd(3000, "a");
  const legacyConfirmed = "Entendimento anteriormente aceito: ".padEnd(6000 - JSON.stringify(legacyFields).length - legacyContext.length, "b");
  const legacyAtLimit = JSON.stringify({ ...legacyFields, contextualUnderstanding: legacyContext, confirmedUnderstanding: legacyConfirmed });
  assert.equal(legacyAtLimit.length, 6000);
  assert.equal(attendanceSummary(noBusinessNews, "Jardinagem", null, legacyAtLimit), legacyAtLimit);
  assert.throws(() => attendanceSummary({ ...noBusinessNews, whatsappReference: "max_phone" }, "Jardinagem", null,
    legacyAtLimit, new Map([["max_phone", "+123456789012345"]])), /attendance_summary_too_long/);
  // Read compact data from earlier Preview writes; every subsequent write uses canonical keys.
  const oldCompact = JSON.stringify({ contextualUnderstanding: base.businessUnderstanding, confirmedUnderstanding: context.displayedUnderstanding,
    c: "Jardinagem", w: phone });
  const projectSummary = (summary: string) => attendanceProjection({ ...conversation, accountContext: {
    summary, updatedAt: conversation.updatedAt,
  } }, context.catalog);
  const compactProjection = projectSummary(oldCompact);
  assert.equal(compactProjection.whatsappProvided, true);
  assert.equal(compactProjection.summary?.includes(phone), false);
  assert.equal(JSON.parse(compactProjection.summary!).confirmedUnderstanding, context.displayedUnderstanding);
  const canonical = JSON.parse(attendanceSummary(noBusinessNews, "Jardinagem", null, oldCompact));
  assert.equal(canonical.classification, "Jardinagem");
  assert.equal(canonical.whatsapp, phone);
  assert.equal(canonical.confirmedUnderstanding, context.displayedUnderstanding);
  for (const key of ["c", "s", "p", "w", "d"]) assert.equal(key in canonical, false);
  assert.equal(projectSummary(legacyAtLimit + " ").summary, null);
  assert.equal(projectSummary(JSON.stringify({ ...JSON.parse(oldCompact), unexpected: true })).summary, null);

  // Reproduced D15C regressions: email digits are never contact candidates or provider data.
  for (const email of ["joao5511999990000@gmail.com", "5511999999999@example.com", "joao.phone_1_2@empresa.com.br"]) {
    const message = "Meu e-mail é " + email;
    for (const role of ["user", "assistant"] as const) {
      const projected = attendanceContactProjection([{ role, content: message }]);
      assert.equal(projected.contacts.size, 0);
      assert.equal(projected.recent[0].content, "Meu e-mail é [email removido]");
    }
    const projected = attendanceProjection({ ...conversation, preferredName: email, businessDisplayName: email,
      businessContextText: message, accountContext: { updatedAt: conversation.updatedAt,
        summary: JSON.stringify({ ...legacyFields, contextualUnderstanding: message }) } }, context.catalog);
    for (const value of [projected.preferredName, projected.publicName, projected.displayedUnderstanding, projected.summary]) {
      assert.equal(value?.includes(email), false);
      assert.equal(value?.includes("551199999"), false);
      assert.equal(value?.includes("phone_"), false);
    }
  }
  const mixedEmail = attendanceContactProjection([{ role: "user",
    content: "E-mail 5511999999999@example.com; meu WhatsApp é +55 (21) 99999-0000." }]);
  assert.equal(mixedEmail.contacts.size, 1);
  assert.equal(mixedEmail.contacts.get("phone_0_0"), phone);
  for (const [message, literal] of [["CPF não informado, meu contato 11999990000", "11999990000"], ["WhatsApp: 11,99999,0000", "11,99999,0000"]]) {
    const projected = attendanceContactProjection([{ role: "user", content: message }]);
    assert.equal(projected.contacts.size, 1);
    assert.equal(projected.contacts.get("phone_0_0"), literal);
    assert.equal(projected.recent[0].content.includes("99999"), false);
    const assistant = attendanceContactProjection([{ role: "assistant", content: message }]);
    assert.equal(assistant.contacts.size, 0);
    assert.equal(assistant.recent[0].content.includes("99999"), false);
  }
  // Contact content is stored verbatim; digit count and formatting never determine acceptance.
  for (const literal of ["9", "21 97965", "9999-0000", "(21) 97965 84 83", "+55 (11) 99999-0000-123"]) {
    const message = "Meu WhatsApp é " + literal;
    const projected = attendanceContactProjection([{ role: "user", content: message }]);
    assert.equal(projected.contacts.get("phone_0_0"), literal);
    assert.equal(projected.recent[0].content.includes(literal), false);
    assert.match(projected.recent[0].content, /formato informado:/u);
    const saved = attendanceSummary({ ...base, whatsappReference: "phone_0_0" }, null, null, null, projected.contacts);
    assert.equal(JSON.parse(saved).whatsapp, literal);
    assert.equal(projectSummary(saved).whatsappProvided, true);
    assert.equal(JSON.parse(attendanceSummary(noBusinessNews, null, null, saved)).whatsapp, literal);
    const assistant = attendanceContactProjection([{ role: "assistant", content: message }]);
    assert.equal(assistant.contacts.size, 0);
    assert.equal(assistant.recent[0].content.includes(literal), false);
  }
  const isolated = attendanceContactProjection([
    { role: "assistant", content: "Se quiser, qual é seu WhatsApp?" }, { role: "user", content: "21 97965" },
  ]);
  assert.equal(isolated.contacts.get("phone_1_0"), "21 97965");
  assert.equal(isolated.recent[1].content.includes("97965"), false);
  const commercialNumbers = "Atendo 50 clientes, com ticket de R$ 120 e prazo de 7 dias.";
  const commercialProjection = attendanceContactProjection([{ role: "user", content: commercialNumbers }]);
  assert.equal(commercialProjection.contacts.size, 0);
  assert.equal(commercialProjection.recent[0].content, commercialNumbers);
  assert.equal(projectSummary(JSON.stringify({ ...legacyFields, contextualUnderstanding: commercialNumbers })).summary?.includes(commercialNumbers), true);
  // References survive text bounds so a later clarification can still select the original contact.
  const longContact = attendanceContactProjection([
    { role: "user", content: "Contexto comercial. ".repeat(100) + "Meu WhatsApp é " + phone },
    { role: "assistant", content: "Esse contato é seu WhatsApp?" }, { role: "user", content: "Sim." },
  ]);
  assert.equal(longContact.contacts.get("phone_0_0"), phone);
  const longContext = attendanceProjection({ ...conversation, messages: [
    { ...conversation.messages[0], content: "Contexto comercial. ".repeat(100) + "Meu WhatsApp é " + phone },
    { ...conversation.messages[0], id: "2", role: "assistant", content: "Esse contato é seu WhatsApp?" },
    { ...conversation.messages[0], id: "3", role: "user", content: "Sim." },
  ] }, context.catalog);
  assert.deepEqual(longContext.contactReferences, ["phone_0_0"]);
  assert.ok(validateAttendanceOutput({ ...base, whatsappReference: "phone_0_0" }, longContext));
  const endContact = attendanceContactProjection([{ role: "user", content: "a".repeat(3988) + " 11999990000" }]);
  assert.equal(endContact.contacts.get("phone_0_0"), "11999990000");
  // Literal tokens cannot impersonate a phone reference generated for another cited number.
  for (const literal of ["[phone_0_0]", "PHONE_0_0", "[Phone_0_0]"]) {
    const collision = attendanceContactProjection([{ role: "user",
      content: "Meu WhatsApp é " + literal + "; +55 (21) 99999-0000 é de terceiro." }]);
    assert.equal(collision.contacts.size, 1);
    assert.equal(collision.recent[0].content.match(/\bphone_\d+_\d+\b/giu)?.length, 1);
    assert.match(collision.recent[0].content, /referência de contato literal removida/u);
    assert.match(collision.recent[0].content, /\[phone_0_0\].*é de terceiro/u);
  }
  const hiddenContact = attendanceContactProjection([{ role: "user", content: "https://example.com/5521999990000" }]);
  assert.equal(hiddenContact.contacts.size, 0);
  assert.deepEqual(catalogAdapter.projectAttendanceMarketContext([], []), []);
  const market = catalogAdapter.projectAttendanceMarketContext([{ id: accountId, taxon_id: nicheId, updated_at: "2026-06-01" }],
    [{ research_id: accountId, item_key: "limitation", item_text: "Pesquisa histórica; validar aplicabilidade.", notes: "Período 2024." }]);
  assert.equal(market[0].version, 1); assert.match(market[0].items[0].notes ?? "", /2024/);
  assert.match(market[0].items[0].text, /histórica/);
  assert.equal(parseAttendanceResponse(response(base), context).ok, true);
  assert.equal(parseAttendanceResponse(response(base, [{ type: "web_search_call", status: "completed" }]), context).ok, false);
  assert.equal(parseAttendanceResponse({ ...response(base), status: "incomplete" }, context).ok, false);
  assert.equal(parseAttendanceResponse({ output: [{ type: "message", content: [{ type: "refusal" }] }] }, context).ok, false);
  const wires: Record<string, unknown>[] = [];
  const events: unknown[] = [];
  assert.equal((await requestAttendance({ accountId, context, environment: "development", apiKey: "test-key" }, {
    fetchImpl: async (_url, init) => { wires.push(JSON.parse(String(init?.body))); return new Response(JSON.stringify(response(base)), { status: 200 }); },
    emitEvent: event => events.push(event),
  })).ok, true);
  assert.equal(wires[0].model, "gpt-6-luna");
  assert.equal("tools" in wires[0], false); assert.equal("tool_choice" in wires[0], false); assert.equal(events.length, 1);
  const effects: string[] = [];
  let current = { ...conversation };
  const deps: AttendanceDependencies = {
    load: async () => current, catalog: async () => context.catalog, market: async () => [], operational: async () => null,
    primary: async () => null,
    discard: async () => { effects.push("discard"); return { ok: true, version: 3 }; },
    claim: async () => { effects.push("claim"); current = { ...current, version: 2 }; return { ok: true, version: 2 }; },
    request: async () => ({ ok: true, output: base, responseId: "fixture", latencyMs: 1 }),
    commit: async input => { effects.push("commit"); assert.equal(input.proposal?.kind, "existing"); return { ok: true, version: 3 }; },
    release: async () => { effects.push("release"); return { ok: true, version: 3 }; },
  };
  const input = { accountId, userId: accountId, conversationId: accountId, expectedVersion: 1, content: "Jardins", intent: "message" as const };
  assert.equal((await conductAttendanceTurn(input, deps)).ok, true);
  assert.deepEqual(effects, ["claim", "commit"]); // old lifetime call counter is irrelevant.
  current = { ...conversation, accountContext: { summary: closedSummary, updatedAt: conversation.updatedAt } };
  assert.equal((await conductAttendanceTurn(input, { ...deps,
    request: async ({ context: resumed }) => {
      assert.equal(JSON.parse(resumed.summary!).pendingReason, closing.closureReason);
      return { ok: true, output: base, responseId: "resumed", latencyMs: 1 };
    },
  })).ok, true); // Cordial closure creates no operational stop or reset.
  current = { ...conversation, preferredName: null, preferredNameDeclined: false };
  assert.equal((await conductAttendanceTurn(input, { ...deps,
    request: async () => ({ ok: true, output: { ...closing, preferredName: null, preferredNameDeclined: false, confirmedUnderstanding: null }, responseId: "closed", latencyMs: 1 }),
    commit: async input => {
      assert.equal(input.output.businessUnderstanding, conversation.businessContextText);
      assert.equal(input.confirm, false); assert.equal(input.proposal, null);
      assert.equal(input.output.readyToComplete, false);
      assert.equal(JSON.parse(input.summary).pendingReason, closing.closureReason);
      assert.equal(JSON.parse(input.summary).confirmedUnderstanding, null);
      return { ok: true, version: 3 };
    },
  })).ok, true);
  const exactDisplayed = "Manutenção  de jardins.\n\nReferência: https://example.com";
  for (const proposed of [base, pending, finishing]) {
    current = { ...conversation, businessContextText: exactDisplayed };
    assert.equal((await conductAttendanceTurn({ ...input, content: proposed.readyToComplete ? "Podemos seguir." : "Ana" }, {
      ...deps, primary: async () => proposed.readyToComplete ? nicheId : null,
      request: async ({ context: shown }) => ({ ok: true,
        output: validateAttendanceOutput({ ...proposed, businessUnderstanding: "" }, shown)!, responseId: "reused", latencyMs: 1 }),
      commit: async input => {
        assert.equal(input.confirm, false);
        assert.equal(input.output.businessUnderstanding, exactDisplayed);
        assert.equal(input.proposal?.kind ?? null, proposed.readyToComplete ? null : proposed.action === "existing" ? "existing" : "operational_fallback");
        assert.equal(JSON.parse(input.summary).confirmedUnderstanding, null);
        return { ok: true, version: 3 };
      },
    })).ok, true);
  }
  for (const acceptedProposal of [proposal, fallback]) {
    current = { ...conversation, businessContextText: exactDisplayed, attendanceProposal: acceptedProposal, stage: "niche_confirmation" };
    assert.equal((await conductAttendanceTurn({ ...input, intent: "confirm", content: "Sim, confirmo o entendimento exibido." }, {
      ...deps,
      request: async ({ context: shown }) => {
        assert.equal(shown.displayedUnderstanding?.includes("\n"), false);
        assert.equal(shown.displayedUnderstanding?.includes("https://"), false);
        return { ok: true, output: validateAttendanceOutput(confirm, shown)!, responseId: "accepted", latencyMs: 1 };
      },
      commit: async input => {
        assert.equal(input.confirm, true); assert.equal(input.proposal, null);
        assert.equal(input.output.businessUnderstanding, exactDisplayed);
        assert.equal(JSON.parse(input.summary).confirmedUnderstanding, exactDisplayed);
        return { ok: true, version: 3 };
      },
    })).ok, true);
  }
  for (const resume of [false, true]) {
    current = { ...conversation, businessContextText: "Serviços para condomínios.",
      attendanceTurnIntent: resume ? "message" : null,
      messages: [{ ...conversation.messages[0], content: "Agora esclareço: manutenção de jardins." }] };
    const result = await conductAttendanceTurn({ ...input, content: resume ? null : "Agora esclareço: manutenção de jardins.",
      intent: resume ? "resume" : "message" }, { ...deps, market: async query => {
        assert.match(query, /^Agora esclareço: manutenção de jardins\./);
        assert.match(query, /Serviços para condomínios\./);
        return [];
      } });
    assert.equal(result.ok, true);
  }

  // Barriers prove overlap and ordering without a timing threshold.
  current = { ...conversation }; effects.length = 0;
  const readsEntered = new Set<string>();
  let unblockReads!: () => void;
  const readBarrier = new Promise<void>(resolve => { unblockReads = resolve; });
  const read = async <T>(name: string, value: T): Promise<T> => {
    assert.equal(current.version, 2);
    readsEntered.add(name);
    await readBarrier;
    return value;
  };
  let providerBeforeReads = false;
  let marketAfterReads = false;
  const concurrentTurn = conductAttendanceTurn(input, { ...deps,
    catalog: () => read("catalog", context.catalog),
    primary: () => read("primary", null),
    operational: options => {
      assert.equal(options.throwOnReadError, true);
      return read("operational", null);
    },
    market: async (_query, observedCatalog, selectedId) => {
      assert.deepEqual([...readsEntered].sort(), ["catalog", "operational", "primary"]);
      assert.equal(observedCatalog, context.catalog);
      assert.equal(selectedId, null);
      marketAfterReads = true;
      return [];
    },
    request: async () => {
      providerBeforeReads = !marketAfterReads;
      return { ok: true, output: base, responseId: "concurrent", latencyMs: 1 };
    },
  });
  await new Promise<void>(resolve => setImmediate(resolve));
  const enteredBeforeRelease = [...readsEntered].sort();
  const effectsBeforeRelease = [...effects];
  unblockReads();
  assert.deepEqual(enteredBeforeRelease, ["catalog", "operational", "primary"]);
  assert.deepEqual(effectsBeforeRelease, ["claim"]);
  assert.equal((await concurrentTurn).ok, true);
  assert.equal(providerBeforeReads, false);
  assert.equal(marketAfterReads, true);
  assert.deepEqual(effects, ["claim", "commit"]);

  current = { ...conversation }; effects.length = 0;
  let reservedLoadCount = 0;
  let readsAfterInvalidReservation = 0;
  assert.equal((await conductAttendanceTurn(input, { ...deps,
    load: async () => ++reservedLoadCount === 1 ? current : null,
    catalog: async () => { readsAfterInvalidReservation++; return context.catalog; },
    primary: async () => { readsAfterInvalidReservation++; return null; },
    operational: async () => { readsAfterInvalidReservation++; return null; },
  })).ok, false);
  assert.equal(readsAfterInvalidReservation, 0);
  assert.deepEqual(effects, ["claim", "release"]);
  for (const overrides of [
    { request: async () => ({ ok: false as const }) },
    { commit: async () => ({ ok: false as const, reason: "write_failed" as const }) },
    { catalog: async () => null },
    { primary: async () => undefined },
    { market: async () => null },
    { request: async () => ({ ok: true as const, output: { ...base, businessUnderstanding: "a".repeat(4000),
      confirmedUnderstanding: "b".repeat(4000) }, responseId: "too-long", latencyMs: 1 }) },
  ]) {
    current = { ...conversation }; effects.length = 0;
    assert.equal((await conductAttendanceTurn(input, { ...deps, ...overrides })).ok, false);
    assert.deepEqual(effects, ["claim", "release"]);
  }
  current = { ...conversation }; effects.length = 0;
  let providerCallsAfterReadFailure = 0;
  assert.equal((await conductAttendanceTurn(input, { ...deps,
    operational: async options => {
      assert.equal(options.throwOnReadError, true);
      throw new Error("operational_resolution_read_failed");
    },
    request: async () => { providerCallsAfterReadFailure++; return { ok: true, output: base, responseId: "unexpected", latencyMs: 1 }; },
  })).ok, false);
  assert.equal(providerCallsAfterReadFailure, 0);
  assert.deepEqual(effects, ["claim", "release"]);
  current = { ...conversation, attendanceTurnIntent: "message" }; effects.length = 0;
  assert.equal((await conductAttendanceTurn(input, deps)).ok, false); assert.deepEqual(effects, []);
  assert.equal((await conductAttendanceTurn({ ...input, intent: "resume", content: null }, deps)).ok, true);
  current = { ...conversation }; effects.length = 0;
  assert.equal((await conductAttendanceTurn({ ...input, expectedVersion: 10 }, deps)).ok, false); assert.deepEqual(effects, []);
  console.log("E10.12 seller attendance: confirmation, context, no Web/catalog write, provider and fenced retry cases passed.");
}
void main();
