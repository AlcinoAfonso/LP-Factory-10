import assert from "node:assert/strict";
import { test } from "node:test";
import { contactTurn, fixedNicheTurn, prepareNicheTurn, publicResearchTopic, readNicheResearch, type NicheContext } from "./index";
import {
  CONTACT_RECEIPT, displayedOffer, nicheHistory, nicheSummaryContext, presentOffer, type DialogueText,
} from "./dialogue";
import { validateNicheConversationActions, validatePendingConfirmedName } from "../niche-resolution/niche-conversation-validation-cases";

const proposal = {
  summary: "A clínica atende adultos com clareamento e implantes, inclusive em horários estendidos.",
  niche: "Odontologia restauradora e estética para adultos",
  publicName: "Clínica Odonto Mais",
};
const context: NicheContext = {
  message: "Faço implantes e clareamento para adultos. Atendemos em horários estendidos.",
  history: [], summary: null, businessContext: null, officialNiche: null, displayed: null,
};
const opening: NicheContext = {
  ...context, pendingSetup: { preferredName: null, publicName: null, publicNameRequired: true },
};
const assistantId = "10000000-0000-4000-8000-000000000001";

function output(raw: unknown) {
  return { status: "completed", output: [{ type: "message", role: "assistant",
    content: [{ type: "output_text", text: JSON.stringify(raw) }] }] };
}

function turn(input: NicheContext, raw: unknown, summary: string | null = null) {
  const result = prepareNicheTurn(input, summary).parseResponse(output(raw));
  assert.ok(result.ok);
  return result.value;
}

function shown() {
  const present = presentOffer(proposal);
  assert.ok(present);
  const assistant: DialogueText = { id: assistantId, role: "assistant", content: present.reply };
  const ref = { ...present.range, messageId: assistant.id };
  const anchor = displayedOffer(ref, [assistant], proposal);
  assert.ok(anchor);
  return { present, assistant, ref, anchor };
}

test("nome profissional, síntese e nicho aparecem juntos, sem efeito até o aceite", () => {
  const planned = turn(opening, { reply: "Vamos conferir.", offer: proposal, preferredName: "Clínica Odonto Mais" });
  assert.deepEqual(planned.offer, proposal);
  assert.equal(planned.synthesis.accept, null);
  assert.equal(planned.summary, null);
  assert.equal(planned.preferredName, null);
  assert.match(planned.reply, /Nome público: Clínica Odonto Mais\nNicho proposto: Odontologia restauradora e estética para adultos\n\nEssa síntese está correta\?$/u);
  const fromBase = turn(context, { offer: proposal, preferredName: "Ana" });
  assert.equal(fromBase.preferredName, null);
  assert.doesNotMatch(fromBase.reply, /Nome público/u);
});

test("WhatsApp é independente, invisível no input e sem efeito sobre o alvo de aceite", () => {
  const { assistant, ref, anchor } = shown();
  const withContact = { ...opening, message: "Nome público: Clínica Odonto Mais\nWhatsApp para contato: (21) 99999-9876",
    history: [assistant, { role: "user" as const, id: "contact", content: "WhatsApp para contato: (21) 99999-5555" }] };
  const request = prepareNicheTurn(withContact, null).request.input;
  assert.match(String(request), /Clínica Odonto Mais/);
  assert.doesNotMatch(String(request), /99999|9876|5555/);
  assert.equal(contactTurn.summary, null);
  assert.equal(contactTurn.synthesis.clear, false);
  assert.deepEqual(displayedOffer(ref, [assistant, { role: "assistant", id: "ack", content: CONTACT_RECEIPT }], proposal), anchor);
  assert.equal(turn({ ...withContact, message: "Sim.\nWhatsApp para contato: (21) 99999-9876", displayed: anchor },
    { reply: "Entendido." }).synthesis.accept, anchor.id);
});

test("sim confirma apenas a proposta ancorada ao texto exibido", () => {
  const { ref, assistant, anchor } = shown();
  assert.equal(displayedOffer({ ...ref, length: ref.length - 1 }, [assistant], proposal), null);
  assert.equal(displayedOffer(ref, [assistant], { ...proposal, niche: "Diferente" }), null);
  assert.equal(displayedOffer(ref, [assistant, { role: "assistant", id: "other", content: "Tem outra dúvida?" }], proposal), null);
  assert.equal(turn({ ...opening, message: "Sim." }, { reply: "Qual ponto você quer confirmar?", accept: "Sim." }).synthesis.accept, null);
  const accepted = turn({ ...opening, message: "Sim.", displayed: anchor }, { reply: "Entendi." });
  assert.equal(accepted.synthesis.accept, anchor.id);
  assert.equal(accepted.synthesis.nicheReaction, "accept");
  assert.match(accepted.summary ?? "", /horários estendidos/u);
});

test("aceites naturais completos avançam, ressalvas, dúvidas e aceites parciais conservam a fala segura", () => {
  const { anchor } = shown();
  for (const message of ["Pode registrar a síntese como está.", "Confirmo a síntese e o nicho.", "Está tudo correto!"]) {
    assert.equal(turn({ ...opening, message, displayed: anchor }, { accept: message }).synthesis.accept, anchor.id);
  }
  for (const message of ["Sim, mas atendemos crianças também.", "Está correto?", "Confirmo o nome.",
    "Confirmo o nicho.", "Eu não confirmo a síntese.", "Não, eu confirmo a síntese.", "Ela confirmou.", "Certo sobre o nome, mas nada além disso."]) {
    const result = turn({ ...opening, message, displayed: anchor }, { reply: "Vamos esclarecer o público.", accept: message });
    assert.equal(result.synthesis.accept, null, message);
    assert.equal(result.summary, null);
    assert.equal(result.reply, "Vamos esclarecer o público.");
  }
});

test("correção é apresentada antes de remover o trecho superado e retém fatos válidos", () => {
  const memory = JSON.stringify({ confirmedUnderstanding: "Fazemos tratamento de canal.\nAtendemos adultos.",
    contextualUnderstanding: "Agenda estendida aos sábados.", c: "Odontologia",
    whatsapp: "(21) 99999-0000", suggestions: ["Horários estendidos são um diferencial a verificar."] });
  const corrections = [
    { previous: "Fazemos tratamento de canal.", replacement: "Fazemos implantes." },
    { previous: "Agenda estendida aos sábados.", replacement: "Trecho inventado" },
    { previous: 17, replacement: "Metadados ruidosos" },
  ];
  const corrected = { ...proposal, summary: "Fazemos implantes.\nAtendemos adultos." };
  const plan = turn({ ...opening, message: "Sim, mas não fazemos mais canal, fazemos implantes.", displayed: shown().anchor },
    { reply: "Vamos ajustar.", offer: corrected, corrections, accept: "Sim" }, memory);
  assert.equal(plan.summary, null);
  assert.equal(plan.synthesis.accept, null);
  const display = displayedOffer({ ...plan.synthesis.offer!, messageId: assistantId },
    [{ role: "assistant", id: assistantId, content: plan.reply }], corrected);
  const accepted = turn({ ...opening, message: "Sim.", displayed: display }, { corrections }, memory);
  const saved = JSON.parse(accepted.summary ?? "{}");
  assert.doesNotMatch(saved.confirmedUnderstanding, /canal/);
  assert.match(saved.confirmedUnderstanding, /adultos/);
  assert.match(saved.confirmedUnderstanding, /implantes/);
  assert.equal(saved.contextualUnderstanding, "Agenda estendida aos sábados.");
  assert.equal(saved.whatsapp, "(21) 99999-0000");
  assert.equal(saved.c, undefined);
  assert.equal(saved.classification, "Odontologia");
  assert.deepEqual(saved.suggestions, JSON.parse(memory).suggestions);
});

test("metadados inválidos não derrubam a resposta nem são promovidos a efeitos", () => {
  const safe = "Você atende também adolescentes?";
  const result = turn(opening, { reply: safe, offer: { ...proposal, niche: 19 }, preferredName: {},
    corrections: "inválido", searchTopic: [] });
  assert.equal(result.reply, safe);
  assert.equal(result.offer, null);
  assert.equal(result.summary, null);
  assert.equal(result.synthesis.accept, null);
  assert.doesNotMatch(turn(context, { reply: "Salvei seu nicho.", accept: "forjado" }).reply, /salvei/i);
  assert.doesNotMatch(turn(context, { reply: "O novo nicho já consta no cadastro.", accept: "Sim" }).reply, /já consta/iu);
  assert.doesNotMatch(turn(context, { reply: "Pode considerar o nicho oficializado.", accept: "Sim" }).reply, /oficializado/iu);
  for (const field of ["summary", "niche", "publicName"]) {
    const invalid = turn(opening, { reply: safe, offer: { ...proposal, [field]: "O nicho está confirmado." } });
    assert.equal(invalid.offer, null, field);
    assert.equal(invalid.reply, safe, field);
  }
  const anchor = shown().anchor;
  assert.equal(turn({ ...opening, message: "Sim.", displayed: anchor },
    { reply: "Entendi.", offer: { niche: 19 } }).synthesis.accept, anchor.id);
  assert.match(turn({ ...opening, displayed: shown().anchor, message: "Sim" },
    { reply: "Salvei seu nicho." }, JSON.stringify({ contextualUnderstanding: "A".repeat(5700) })).reply, /não pôde/);
});

test("uma correção negativa remove o fato superado mesmo quando cita a oferta antiga", () => {
  const previous = "Fazemos tratamento de canal.";
  const replacement = "Não fazemos mais tratamento de canal.";
  const displayed = { ...proposal, id: assistantId, summary: replacement + "\nAtendemos adultos." };
  const prior = JSON.stringify({ confirmedUnderstanding: previous + "\nAtendemos adultos." });
  const accepted = turn({ ...opening, message: "Sim.", displayed }, { corrections: [
    { previous: "tratamento de canal", replacement },
  ] }, prior);
  const saved = JSON.parse(accepted.summary ?? "{}").confirmedUnderstanding;
  assert.doesNotMatch(saved, /Fazemos tratamento de canal/u);
  assert.match(saved, /Não fazemos mais tratamento de canal/u);
  assert.match(saved, /Atendemos adultos/u);
});

test("nome pessoal é opcional e entendimento suficiente pode seguir com nicho em aberto", () => {
  const offer = { ...proposal, niche: null };
  const observed = turn({ ...opening, message: "Prefiro não informar meu nome." }, { offer, preferredName: false });
  assert.equal(observed.preferredName, false);
  assert.equal(observed.offer?.niche, null);
  assert.ok(observed.synthesis.offer);
  const displayed = displayedOffer({ ...observed.synthesis.offer!, messageId: assistantId },
    [{ role: "assistant", id: assistantId, content: observed.reply }], offer);
  assert.ok(displayed);
  const confirmed = turn({ ...opening, message: "Sim", displayed }, { reply: "Entendi." });
  assert.equal(confirmed.synthesis.accept, assistantId);
  assert.equal(confirmed.synthesis.nicheReaction, "clear");
  assert.ok(confirmed.summary);
});

test("D14D com produto apresenta apenas a descrição legada e exige um aceite posterior", () => {
  const fixedNiche = "Manutenção de jardins";
  const first = fixedNicheTurn({ ...context, message: "Sim", fixedNiche }, null);
  assert.equal(first?.offer?.niche, fixedNiche);
  assert.equal(first?.synthesis.accept, null);
  const displayed = displayedOffer({ ...first!.synthesis.offer!, messageId: assistantId },
    [{ id: assistantId, role: "assistant", content: first!.reply }], { niche: fixedNiche, publicName: null });
  for (const message of ["Mude para construção.", "Eu não confirmo o nicho.", "Seria mentira dizer que confirmo.",
    "Preciso que você confirme.", "Pode confirmar se eu quiser depois?", "Pode confirmar, mas quero outra descrição."]) {
    assert.equal(fixedNicheTurn({ ...context, message, fixedNiche, displayed }, null)?.synthesis.accept, null, message);
  }
  const accepted = fixedNicheTurn({ ...context, message: "Pode confirmar.", fixedNiche, displayed }, null);
  assert.equal(accepted?.synthesis.accept, assistantId);
  assert.equal(accepted?.summary, null);
});

test("retomada envia fatos, histórico e nicho sem contato em cada jornada", () => {
  const facts = "Atendimento de idosos.";
  const messages = Array.from({ length: 28 }, (_, index): DialogueText => ({ id: String(index), role: "user", content: "Mensagem " + index }));
  const resumed = {
    ...context, history: nicheHistory(messages, "27"), officialNiche: "Fisioterapia para adultos",
    summary: nicheSummaryContext(JSON.stringify({ confirmedUnderstanding: facts, whatsapp: "21999990000" })),
    businessContext: "Atendimento domiciliar e na clínica. Contato: qa@example.com",
  };
  for (const pendingSetup of [undefined, opening.pendingSetup]) {
    const data = JSON.parse(String(prepareNicheTurn({ ...resumed, pendingSetup }, null).request.input));
    assert.match(data.summary, /Atendimento de idosos/u);
    assert.equal(data.history[0].content, "Mensagem 0");
    assert.equal(data.history.at(-1).content, "Mensagem 26");
    assert.equal(data.officialNiche, resumed.officialNiche);
    assert.doesNotMatch(JSON.stringify(data), /21999990000|qa@example.com/u);
  }
});

test("Web Search envia assunto público e agrega somente fontes válidas em ambas as jornadas", () => {
  const pending = { ...opening, message: "Minha empresa se chama odonto mais e atende adultos." };
  const base = { ...context, businessContext: JSON.stringify({ business_name: "Odonto Mais" }) };
  for (const journey of [pending, base]) {
    const topic = "Diferença entre prótese e implante dentário";
    assert.equal(publicResearchTopic(topic, journey), topic);
    for (const privateTopic of ["Odonto Mais implantes", "Telefone da clínica", "Implantes em Rua Almeida"]) {
      assert.equal(publicResearchTopic(privateTopic, journey), null);
    }
    assert.equal(turn({ ...journey, message: "Sim.", displayed: shown().anchor },
      { searchTopic: topic }).searchTopic, null);
    assert.equal(turn({ ...journey, message: "Pode pesquisar a diferença entre prótese e implante?", displayed: shown().anchor },
      { reply: "A diferença pode ajudar a escolher a descrição.", searchTopic: topic }).searchTopic, topic);
  }
  const lowercaseName = { ...opening, displayed: { ...shown().anchor, publicName: "clínica vale" } };
  assert.equal(publicResearchTopic("clínica vale avaliações", lowercaseName), null);
  assert.equal(publicResearchTopic("clínica vale avaliações", { ...opening,
    history: [{ role: "assistant", id: assistantId, content: "Síntese\nNome público: clínica vale" }] }), null);
  const envelope = output("irrelevante");
  const search = { ...envelope, output: [{ type: "web_search_call", status: "completed", action: {
    type: "search", sources: [{ url: "https://example.org/fonte" }, { url: "http://localhost/private" }],
  } }, { type: "message", role: "assistant", content: [{ type: "output_text", text: "São procedimentos distintos." }] }] };
  assert.match(readNicheResearch(search, 1) ?? "", /São procedimentos distintos\.\n\nFontes consultadas.*\nhttps:\/\/example.org\/fonte/u);
  assert.equal(readNicheResearch(search, 0), null);
  assert.equal(readNicheResearch(envelope, 1), null);
  const falselySaved = { ...search, output: [search.output[0], { type: "message", role: "assistant",
    content: [{ type: "output_text", text: "O novo nicho já consta no cadastro." }] }] };
  assert.equal(readNicheResearch(falselySaved, 1), null);
});

test("falha, recusa e ausência de resposta útil não produzem efeito", () => {
  const { parseResponse } = prepareNicheTurn(context, null);
  assert.equal(parseResponse(output({ offer: { niche: {} } })).ok, false);
  assert.equal(parseResponse({ ...output({ reply: "Parcial" }), status: "incomplete" }).ok, false);
  assert.equal(parseResponse({ status: "completed", output: [{ type: "message", role: "assistant", content: [{ type: "refusal" }] }] }).ok, false);
});

test("ações preservam a autorização D14D e a retomada após falha", validateNicheConversationActions);
test("Pending Setup preserva nome público aceito ao confirmar o nicho e avançar", validatePendingConfirmedName);
