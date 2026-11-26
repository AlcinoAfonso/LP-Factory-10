import assert from "node:assert/strict";
import { before, test } from "node:test";
import nodeModule from "node:module";
import type { NicheContext } from "./runtime";
import { NICHE_AGENT_INSTRUCTIONS, NICHE_AGENT_PROMPT_VERSION } from "./prompt";
import {
  CONTACT_RECEIPT, displayedOffer, nicheHistory, nicheSummaryContext, pendingSetupWhatsApp, presentOffer, publicResearchTopic, type DialogueText,
} from "./dialogue";
import { validateNicheConversationActions, validateNicheInterlocutorIdentity, validatePendingConfirmedName } from "../niche-resolution/niche-conversation-validation-cases";

let prepareNicheTurn: typeof import("./runtime").prepareNicheTurn;
let contactTurn: typeof import("./runtime").contactTurn;
let readNicheResearch: typeof import("./runtime").readNicheResearch;
before(async () => {
  const loader = nodeModule as unknown as { _load: (request: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(request, parent, isMain) {
    return request === "server-only" ? {} : original.call(this, request, parent, isMain);
  };
  try {
    ({ prepareNicheTurn, contactTurn, readNicheResearch } = await import("./runtime"));
  } finally {
    loader._load = original;
  }
});

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
  const planned = turn(opening, { reply: "Vamos conferir.", offer: proposal, preferredName: null });
  assert.deepEqual(planned.offer, proposal);
  assert.equal(planned.synthesis.accept, null);
  assert.equal(planned.summary, null);
  assert.equal(planned.preferredName, null);
  const sameName = turn({ ...opening, message: "Pode me chamar de Ana Paula; meu nome profissional também é Ana Paula." },
    { reply: "Obrigado, Ana Paula.", offer: { ...proposal, publicName: "Ana Paula" }, preferredName: "Ana Paula" });
  assert.equal(sameName.preferredName, "Ana Paula");
  assert.equal(sameName.offer?.publicName, "Ana Paula");
  assert.match(planned.reply, /Nome público: Clínica Odonto Mais\nNicho proposto: Odontologia restauradora e estética para adultos\n\nEssa síntese está correta\?$/u);
  const fromBase = turn(context, { offer: proposal, preferredName: "Ana" });
  assert.equal(fromBase.preferredName, null);
  assert.doesNotMatch(fromBase.reply, /Nome público/u);
});

test("nicho mercadológico curto preserva síntese, confirmação e público na Base", () => {
  assert.equal(NICHE_AGENT_PROMPT_VERSION, "d15e_niche_agent_v13");
  assert.match(NICHE_AGENT_INSTRUCTIONS, /denominação comercial curta e reconhecida no mercado/u);
  assert.match(NICHE_AGENT_INSTRUCTIONS, /público-alvo da Base de Comunicação/u);
  assert.match(NICHE_AGENT_INSTRUCTIONS, /não pesquise casos evidentes/u);
  assert.doesNotMatch(NICHE_AGENT_INSTRUCTIONS, /nicho específico \(atividade principal e público\)/u);
  const business = { summary: "A empresa tem cinco lojas que vendem hambúrgueres, com tíquete de R$ 35.",
    niche: "Hamburgueria", publicName: "Deliciou Hamburgueria" };
  const proposed = turn({ ...opening, message: business.summary }, { reply: "Vamos conferir.", offer: business });
  assert.deepEqual(proposed.offer, business);
  assert.match(proposed.reply, /Nicho proposto: Hamburgueria/u);
  assert.equal(proposed.summary, null, "a proposta não grava sem aceite");
  const reference = proposed.synthesis.offer;
  assert.ok(reference);
  const displayed = displayedOffer({ ...reference, messageId: assistantId },
    [{ id: assistantId, role: "assistant", content: proposed.reply }],
    { niche: business.niche, publicName: business.publicName });
  assert.ok(displayed);
  const accepted = turn({ ...opening, message: "Correto.", displayed },
    { reply: "Perfeito.", accept: displayed.id });
  assert.equal(accepted.synthesis.accept, displayed.id);
  assert.match(accepted.summary ?? "", /cinco lojas/u);
  assert.match(accepted.summary ?? "", /Nome público: Deliciou Hamburgueria/u);
});

test("nome do interlocutor da conta ativa orienta o diálogo e permanece fora da pesquisa", () => {
  assert.equal(NICHE_AGENT_PROMPT_VERSION, "d15e_niche_agent_v14");
  assert.match(NICHE_AGENT_INSTRUCTIONS, /Se interlocutorName estiver informado/u);
  const named = { ...context, interlocutorName: "Armando" };
  const input = JSON.parse(String(prepareNicheTurn(named, null).request.input));
  assert.equal(input.interlocutorName, "Armando");
  assert.equal(publicResearchTopic("serviços para Armando", named), null, "nome pessoal não é tópico público");
  assert.equal(publicResearchTopic("mercado de hamburguerias", named), "mercado de hamburguerias");
  assert.equal(JSON.parse(String(prepareNicheTurn(context, null).request.input)).interlocutorName, undefined);
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
    { reply: "Entendido.", accept: anchor.id }).synthesis.accept, anchor.id);
});

test("WhatsApp só é exibido após confirmação; mantém correção de contato legado na conversa", () => {
  const { assistant } = shown();
  const collection: DialogueText = { id: "question", role: "assistant", content: "Quem são seus clientes?" };
  const history = [collection, assistant];
  assert.equal(pendingSetupWhatsApp([]), undefined);
  assert.equal(pendingSetupWhatsApp(history), undefined, "a primeira síntese não solicita contato");
  assert.equal(pendingSetupWhatsApp([...history, { role: "user", id: "next", content: "Sim." }]), undefined);
  const contact: DialogueText = { role: "user", id: "contact", content: "WhatsApp para contato: (21) 99999-9876" };
  const receipt: DialogueText = { ...assistant, id: "receipt", content: CONTACT_RECEIPT };
  assert.equal(pendingSetupWhatsApp([...history, contact, receipt]), "correction");
  assert.equal(pendingSetupWhatsApp([contact, receipt, ...history]), "correction");

  const freeReply = turn(opening, { reply: "Já entendi a atividade.\n\nEssa síntese está correta?" });
  assert.equal(freeReply.reply, "Já entendi a atividade.");
  assert.equal(freeReply.synthesis.offer, null);
  assert.equal(pendingSetupWhatsApp([{ ...collection, content: freeReply.reply }, ...history]), undefined);
});

test("sim confirma apenas a proposta ancorada ao texto exibido", () => {
  const { ref, assistant, anchor } = shown();
  assert.equal(displayedOffer({ ...ref, length: ref.length - 1 }, [assistant], proposal), null);
  assert.equal(displayedOffer(ref, [assistant], { ...proposal, niche: "Diferente" }), null);
  assert.deepEqual(displayedOffer(ref, [assistant, { role: "assistant", id: "other", content: "Tem outra dúvida?" }], proposal), anchor);
  assert.equal(turn({ ...opening, message: "Sim." }, { reply: "Qual ponto você quer confirmar?", accept: "Sim." }).synthesis.accept, null);
  assert.equal(turn({ ...opening, message: "Sim.", displayed: anchor }, { reply: "Entendi." }).synthesis.accept, null);
  const accepted = turn({ ...opening, message: "Sim.", displayed: anchor }, { reply: "Entendi.", accept: anchor.id });
  assert.equal(accepted.synthesis.accept, anchor.id);
  assert.equal(accepted.synthesis.nicheReaction, "accept");
  assert.match(accepted.summary ?? "", /horários estendidos/u);
});

test("aceites naturais completos avançam, ressalvas, dúvidas e aceites parciais conservam a fala segura", () => {
  const { anchor } = shown();
  for (const message of ["Pode registrar a síntese como está.", "Confirmo a síntese e o nicho.", "Está tudo correto!"]) {
    assert.equal(turn({ ...opening, message, displayed: anchor }, { reply: "Recebi sua resposta.", accept: anchor.id }).synthesis.accept, anchor.id);
  }
  for (const message of ["Sim, mas atendemos crianças também.", "Está correto?", "Confirmo o nome.",
    "Confirmo o nicho.", "Eu não confirmo a síntese.", "Não, eu confirmo a síntese.", "Ela confirmou.", "Certo sobre o nome, mas nada além disso."]) {
    const result = turn({ ...opening, message, displayed: anchor }, { reply: "Vamos esclarecer o público.", accept: null });
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
    { reply: "Vamos ajustar.", offer: corrected, corrections, accept: null }, memory);
  assert.equal(plan.summary, null);
  assert.equal(plan.synthesis.accept, null);
  const display = displayedOffer({ ...plan.synthesis.offer!, messageId: assistantId },
    [{ role: "assistant", id: assistantId, content: plan.reply }], corrected);
  const accepted = turn({ ...opening, message: "Sim.", displayed: display }, { reply: "Recebi sua confirmação.", accept: display!.id, corrections }, memory);
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

test("negações e fatos empresariais continuam sob interpretação do agente, sem efeitos falsos", () => {
  const negative = "Não salvei nenhuma informação; preciso da sua confirmação.";
  const reply = turn(context, { reply: negative, accept: null });
  assert.equal(reply.reply, negative);
  assert.equal(reply.synthesis.accept, null);
  assert.equal(reply.summary, null);

  const fact = "A empresa está registrada como prestadora de serviços e atende condomínios.";
  const offered = turn(opening, { reply: "Vamos conferir.", offer: { ...proposal, summary: fact } });
  assert.equal(offered.offer?.summary, fact);
  assert.match(offered.reply, /A empresa está registrada como prestadora de serviços/u);
  assert.ok(offered.synthesis.offer);
  assert.equal(offered.summary, null);
  assert.equal(turn(context, { reply: "O nicho não foi salvo." }).reply, "O nicho não foi salvo.");
});

test("metadados inválidos não derrubam a resposta nem são promovidos a efeitos", () => {
  const safe = "Você atende também adolescentes?";
  const result = turn(opening, { reply: safe, offer: { ...proposal, niche: 19 }, preferredName: {},
    corrections: "inválido", searchTopic: [] });
  assert.equal(result.reply, safe);
  assert.equal(result.offer, null);
  assert.equal(result.summary, null);
  assert.equal(result.synthesis.accept, null);
  const explanation = "O nicho ainda não está confirmado; preciso que você aprove a síntese.";
  assert.equal(turn(context, { reply: explanation }).reply, explanation);
  const unsupported = turn(context, { reply: "Ainda precisamos confirmar.", accept: "forjado" });
  assert.equal(unsupported.synthesis.accept, null);
  assert.equal(unsupported.summary, null);
  for (const field of ["summary", "niche", "publicName"]) {
    const invalid = turn(opening, { reply: safe, offer: { ...proposal, [field]: "" } });
    assert.equal(invalid.offer, null, field);
    assert.equal(invalid.reply, safe, field);
  }
  const anchor = shown().anchor;
  assert.equal(turn({ ...opening, message: "Sim.", displayed: anchor },
    { reply: "Entendi.", offer: { niche: 19 }, accept: anchor.id }).synthesis.accept, null);
  const prior = JSON.stringify({ contextualUnderstanding: "A".repeat(5650) });
  assert.ok(prior.length < 5700);
  const tooLarge = turn({ ...opening, displayed: anchor, message: "Sim" },
    { reply: "Recebi sua confirmação.", accept: anchor.id }, prior);
  assert.equal(tooLarge.synthesis.accept, null);
  assert.equal(tooLarge.synthesis.clear, false);
  assert.equal(tooLarge.summary, null);
  assert.match(tooLarge.reply, /não foi possível concluir a confirmação/iu);
  assert.doesNotMatch(tooLarge.reply, /recebi sua confirmação/iu);
});

test("uma correção negativa remove o fato superado mesmo quando cita a oferta antiga", () => {
  const previous = "Fazemos tratamento de canal.";
  const replacement = "Não fazemos mais tratamento de canal.";
  const displayed = { ...proposal, id: assistantId, summary: replacement + "\nAtendemos adultos." };
  const prior = JSON.stringify({ confirmedUnderstanding: previous + "\nAtendemos adultos." });
  const accepted = turn({ ...opening, message: "Sim.", displayed }, { reply: "Entendi.", accept: displayed.id, corrections: [
    { previous: "tratamento de canal", replacement },
  ] }, prior);
  const saved = JSON.parse(accepted.summary ?? "{}").confirmedUnderstanding;
  assert.doesNotMatch(saved, /Fazemos tratamento de canal/u);
  assert.match(saved, /Não fazemos mais tratamento de canal/u);
  assert.match(saved, /Atendemos adultos/u);
});

test("nome pessoal é opcional e entendimento suficiente pode seguir com nicho em aberto", () => {
  const fromHistory = turn({ ...opening, message: "Vendo geleias.", history: [
    { id: "first", role: "user", content: "Pode me chamar de Ana." },
  ] }, { reply: "Entendi o que você vende.", preferredName: "Ana" });
  assert.equal(fromHistory.preferredName, "Ana");
  const offer = { ...proposal, niche: null };
  const observed = turn({ ...opening, message: "Prefiro não informar meu nome." }, { offer, preferredName: false });
  assert.equal(observed.preferredName, false);
  assert.equal(observed.offer?.niche, null);
  assert.ok(observed.synthesis.offer);
  const displayed = displayedOffer({ ...observed.synthesis.offer!, messageId: assistantId },
    [{ role: "assistant", id: assistantId, content: observed.reply }], offer);
  assert.ok(displayed);
  const confirmed = turn({ ...opening, message: "Sim", displayed }, { reply: "Entendi.", accept: displayed!.id });
  assert.equal(confirmed.synthesis.accept, assistantId);
  assert.equal(confirmed.synthesis.nicheReaction, "clear");
  assert.ok(confirmed.summary);
});

test("D14D com produto só apresenta e confirma a descrição legada", () => {
  const fixedNiche = "Manutenção de jardins";
  const allowed = { summary: "A descrição vigente é Manutenção de jardins.", niche: fixedNiche, publicName: null };
  const first = turn({ ...context, message: "Quero conferir o nicho atual.", fixedNiche },
    { reply: "Vamos conferir.", offer: allowed });
  assert.equal(first.offer?.niche, fixedNiche);
  assert.equal(first.synthesis.accept, null);
  const displayed = displayedOffer({ ...first.synthesis.offer!, messageId: assistantId },
    [{ id: assistantId, role: "assistant", content: first.reply }], { niche: fixedNiche, publicName: null });
  assert.ok(displayed);
  for (const message of ["Mude para construção.", "Eu não confirmo o nicho.", "Pode confirmar, mas quero outra descrição."]) {
    const result = turn({ ...context, message, fixedNiche, displayed },
      { reply: "A descrição existente não pode ser modificada.", accept: null });
    assert.equal(result.synthesis.accept, null, message);
    assert.equal(result.summary, null);
  }
  const attemptedChange = turn({ ...context, message: "Quero mudar o nicho", fixedNiche },
    { reply: "Só é possível confirmar a descrição vigente.", offer: { ...allowed, niche: "Construção civil" } });
  assert.equal(attemptedChange.offer, null);
  const accepted = turn({ ...context, message: "Pode confirmar.", fixedNiche, displayed },
    { reply: "Recebi sua confirmação.", accept: displayed.id });
  assert.equal(accepted.synthesis.accept, assistantId);
  assert.equal(accepted.summary, null);
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
  const pending = { ...opening, message: "Minha empresa se chama odonto mais e atende adultos.",
    businessContext: "Nome anteriormente informado: Odonto Mais" };
  const base = { ...context, businessContext: JSON.stringify({ business_name: "Odonto Mais" }) };
  for (const journey of [pending, base]) {
    const topic = "Diferença entre prótese e implante dentário";
    assert.equal(publicResearchTopic(topic, journey), topic);
    assert.equal(publicResearchTopic("Odonto Mais implantes", journey), null);
    assert.equal(publicResearchTopic("Implantes em Rua Almeida", journey, ["Rua Almeida"]), null);
    for (const publicTopic of ["serviços de suporte técnico para WhatsApp", "manutenção de telefone celular",
      "pavimentação de ruas", "planejamento de avenidas", "proteção de CPF para consumidores"]) {
      assert.equal(publicResearchTopic(publicTopic, journey), publicTopic);
    }
    const anchor = shown().anchor;
    assert.equal(turn({ ...journey, message: "Sim.", displayed: anchor },
      { reply: "Recebi sua confirmação.", accept: anchor.id, searchTopic: topic }).searchTopic, null);
    assert.equal(turn({ ...journey, message: "Pode pesquisar a diferença entre prótese e implante?", displayed: shown().anchor },
      { reply: "A diferença pode ajudar a escolher a descrição.", searchTopic: topic, privateNames: [] }).searchTopic, topic);
  }
  const firstName = { ...opening, message: "Minha empresa se chama odonto mais e atende adultos.",
    businessContext: null };
  const unsafe = turn(firstName, { reply: "Vou pesquisar dados públicos.", searchTopic: "Odonto Mais implantes",
    privateNames: ["Odonto Mais"] });
  assert.equal(unsafe.searchTopic, null, "nome empresarial identificado no turno não pode ir à Web");
  assert.equal(unsafe.reply, "Vou pesquisar dados públicos.");
  assert.equal(turn(firstName, { reply: "Vou pesquisar dados públicos.", searchTopic: "Odonto Mais implantes" }).searchTopic,
    null, "metadado de privacidade ausente não autoriza pesquisa");
  assert.equal(turn(firstName, { reply: "Vou pesquisar dados públicos.", searchTopic: "Odonto Mais implantes",
    privateNames: ["X".repeat(121)] }).searchTopic, null, "metadado inválido bloqueia pesquisa");
  const generic = "diferenças entre próteses e implantes dentários";
  assert.equal(turn(firstName, { reply: "Vou pesquisar dados públicos.", searchTopic: generic,
    privateNames: ["Odonto Mais"] }).searchTopic, generic);
  const privateAddress = { ...opening, message: "Meu consultório fica na Rua das Flores." };
  const addressBlocked = turn(privateAddress, { reply: "Posso explicar o assunto.", searchTopic: "serviços na Rua das Flores",
    privateNames: ["Rua das Flores"] });
  assert.equal(addressBlocked.searchTopic, null, "endereço particular do turno não pode ir à Web");
  assert.equal(addressBlocked.reply, "Posso explicar o assunto.");
  const privateTopic = "serviços em Rua dos Alfeneiros";
  assert.equal(turn({ ...opening, message: "Moro na R. dos Alfeneiros." }, {
    reply: "Posso explicar o assunto.", searchTopic: privateTopic, privateNames: ["Rua dos Alfeneiros"],
  }).searchTopic, null, "o agente identifica o dado privado na própria mensagem");
  const knownAddress = { ...opening, businessContext: JSON.stringify({ address: "Rua São Bento" }) };
  assert.equal(publicResearchTopic("serviços na Rua São Bento", knownAddress), null);
  assert.equal(publicResearchTopic("serviços na Rua São Francisco", knownAddress),
    "serviços na Rua São Francisco", "comparação técnica não deduz outro logradouro pelo prefixo");
  assert.equal(turn(privateAddress, { reply: "Posso explicar o assunto.",
    searchTopic: "planejamento de ruas", privateNames: ["Rua das Flores"] }).searchTopic,
    "planejamento de ruas", "tema público não é endereço particular");
  assert.equal(publicResearchTopic("serviços na Rua das Flores",
    { ...opening, businessContext: JSON.stringify({ address: "Rua das Flores" }) }), null);
  assert.equal(publicResearchTopic("serviços na Rua das Flores", privateAddress, ["Rua das Flores"]), null);
  assert.equal(publicResearchTopic("serviços na Rua das Flores 123", privateAddress), null,
    "consulta com número não passa pelo formato técnico");
  const newPersonal = turn({ ...opening, message: "Me chamo Maria Silva." },
    { reply: "Entendi, Maria.", preferredName: "Maria Silva",
      searchTopic: "Maria Silva produtos", privateNames: [] });
  assert.equal(newPersonal.preferredName, "Maria Silva");
  assert.equal(newPersonal.searchTopic, null, "nome pessoal identificado no turno protege a pesquisa");
  for (const [message, topic] of [
    ["trabalho na construção civil", "tendências da construção civil"],
    ["minha empresa é de arquitetura", "projetos de arquitetura sustentáveis"],
    ["Você pode explicar Marketing Digital?", "Marketing Digital para pequenos negócios"],
  ]) {
    assert.equal(publicResearchTopic(topic, { ...opening, message }), topic, message);
  }
  assert.equal(publicResearchTopic("Odonto Mais implantes", {
    ...opening, pendingSetup: { ...opening.pendingSetup!, publicName: "Odonto Mais" },
  }), null);
  assert.equal(publicResearchTopic("Maria Silva produtos", {
    ...opening, pendingSetup: { ...opening.pendingSetup!, preferredName: "Maria Silva" },
  }), null);
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
  const explanation = { ...search, output: [search.output[0], {
    type: "message", role: "assistant", content: [{ type: "output_text", text: "O nicho não foi salvo." }],
  }] };
  assert.match(readNicheResearch(explanation, 1) ?? "", /O nicho não foi salvo\./u);
  const privateOnly = { ...search, output: [{ ...search.output[0],
    action: { type: "search", sources: [{ url: "http://localhost/private" }] } }, search.output[1]] };
  assert.equal(readNicheResearch(privateOnly, 1), null);
});

test("falha, recusa e ausência de resposta útil não produzem efeito", () => {
  const { parseResponse } = prepareNicheTurn(context, null);
  assert.equal(parseResponse(output({ offer: { niche: {} } })).ok, false);
  assert.equal(parseResponse({ ...output({ reply: "Parcial" }), status: "incomplete" }).ok, false);
  assert.equal(parseResponse({ status: "completed", output: [{ type: "message", role: "assistant", content: [{ type: "refusal" }] }] }).ok, false);
});

test("identidade da pessoa é isolada por conta e usuário e respeita recusa", validateNicheInterlocutorIdentity);
test("ações preservam a autorização D14D e a retomada após falha", validateNicheConversationActions);
test("Pending Setup preserva nome público aceito ao confirmar o nicho e avançar", validatePendingConfirmedName);
