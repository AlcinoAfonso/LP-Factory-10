import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareNicheTurn, type NicheTurn, type NicheTurnContext } from "./index";
import { NICHE_AGENT_INSTRUCTIONS, NICHE_AGENT_PROMPT_VERSION } from "./prompt";

type ModelTurn = Omit<NicheTurn, "confirmation">;
const proposed = "Catering vegano para eventos corporativos";
const proposal = { id: "proposal-42", description: proposed, expectedOfficialRevision: "text:3" };
const officialNiche = { description: "Alimentação vegana para eventos", revision: "text:3" };
const context: NicheTurnContext = {
  message: { text: "Faço catering vegano para eventos de empresas, inclusive congressos.", replyToProposalId: null },
  history: [],
  summary: null,
  businessContext: null,
  officialNiche: null,
  activeProposal: null,
};
const clarification: ModelTurn = {
  reply: "O que você oferece e para quem?",
  proposal: null,
  reaction: "continue",
  memory: [],
};
const proposalAnswer: ModelTurn = {
  ...clarification,
  reply: `Minha proposta é “${proposed}”. Ela descreve seu negócio?`,
  proposal: proposed,
  memory: [{ kind: "declaration", text: "Oferece catering vegano para eventos de empresas.", replaces: null, sourceId: null }],
};
const acceptance: ModelTurn = { ...clarification, reply: "Entendi, você confirmou essa descrição.", reaction: "accept" };
const pendingContext = {
  nameProposal: "Cozinha do Vale", acceptedName: null, preferredName: null,
  preferredNameDeclined: false, whatsappKnown: false, operationalProposal: null, operationalAccepted: false,
};
const pendingOutcome = {
  publicName: { proposal: null, reaction: "continue" },
  operational: { proposal: null, reaction: "continue" },
  preferredName: { value: null, declined: false },
  whatsapp: { reference: null, declined: false },
};

function prepared(input: NicheTurnContext) {
  const result = prepareNicheTurn(input);
  assert.ok(result.ok);
  return result.value;
}

function message(content: unknown) {
  return { status: "completed", output: [{ type: "message", role: "assistant", content }] };
}

function response(output: unknown) {
  return message([{ type: "output_text", text: JSON.stringify(output) }]);
}

function run(input: NicheTurnContext, output: unknown) {
  return prepared(input).parseResponse(response(output));
}

function success(input: NicheTurnContext, output: ModelTurn) {
  const result = run(input, output);
  assert.ok(result.ok);
  return result.value;
}

test("Pending Setup preserva contato antecipado por referência e nunca envia os dígitos à IA", () => {
  const content = "Sou Ana e meu WhatsApp é (21) 99999-1111. Faço catering vegano.";
  const input = { ...context, message: { text: content, replyToProposalId: null },
    history: [{ role: "user" as const, text: "O WhatsApp antigo começa com 3344-0000." }], pendingSetup: pendingContext };
  const preparedTurn = prepared(input);
  assert.equal(preparedTurn.contractVersion, 2);
  assert.match(String(preparedTurn.request.input), /contato_1/);
  assert.doesNotMatch(String(preparedTurn.request.input), /99999|1111|3344|0000/);
  const output = { ...proposalAnswer, pendingSetup: {
    ...pendingOutcome, preferredName: { value: "Ana", declined: false }, whatsapp: { reference: "contato_1", declined: false },
  } };
  const result = run(input, output);
  assert.ok(result.ok);
  assert.equal(result.value.pendingSetup?.preferredName.value, "Ana");
  assert.equal(result.value.pendingSetup?.whatsapp.value, "(21) 99999-1111");
  assert.equal(run(context, output).ok, false);
  assert.equal(run(input, { ...output, pendingSetup: { ...output.pendingSetup,
    whatsapp: { reference: "contato_2", declined: false } } }).ok, false);
});

test("Pending Setup distingue o aceite do nome e do nicho de recusas opcionais", () => {
  const input = { ...context, officialNiche, activeProposal: proposal,
    message: { text: "Cozinha do Vale e essa descrição estão certos. Prefiro não dar meus contatos.", replyToProposalId: proposal.id },
    pendingSetup: pendingContext };
  const output = { ...acceptance, pendingSetup: { ...pendingOutcome,
    publicName: { proposal: null, reaction: "accept" }, whatsapp: { reference: null, declined: true } } };
  const result = run(input, output);
  assert.ok(result.ok);
  assert.equal(result.value.confirmation?.description, proposed);
  assert.equal(result.value.pendingSetup?.publicName.reaction, "accept");
  assert.equal(result.value.pendingSetup?.whatsapp.declined, true);
  assert.equal(run({ ...input, pendingSetup: { ...pendingContext, nameProposal: null } }, output).ok, false);
});

test("informa de uma vez atividade, oferta e público e aceita proposta textual sem catálogo", () => {
  const { request, promptVersion, contractVersion } = prepared(context);
  const input = JSON.parse(String(request.input));
  assert.equal(input.message, context.message?.text);
  assert.equal(input.activeProposal, null);
  assert.equal("catalog" in input, false);
  assert.equal(request.instructions, NICHE_AGENT_INSTRUCTIONS);
  assert.equal(promptVersion, NICHE_AGENT_PROMPT_VERSION);
  assert.equal(contractVersion, 1);
  const format = request.text as { format: { schema: { required: string[] } } };
  assert.deepEqual(format.format.schema.required, ["reply", "proposal", "reaction", "memory"]);
  assert.equal(request.store, false);
  assert.equal(request.background, false);
  assert.equal("tools" in request, false);
  const output = success(context, proposalAnswer);
  assert.equal(output.proposal, proposed);
  assert.ok(output.reply.includes(proposed));
  assert.equal(output.confirmation, null);
  assert.equal(output.memory[0].kind, "declaration");
});

test("dúvida material permite pergunta focal, sem proposta ou efeito", () => {
  const input = { ...context, message: { text: "Trabalho com tecnologia.", replyToProposalId: null } };
  const output = success(input, { ...clarification, reply: "Você oferece suporte, consultoria ou desenvolve algum produto?" });
  assert.equal(output.proposal, null);
  assert.equal(output.confirmation, null);
  assert.deepEqual(output.memory, []);
});

test("aceites semânticos em formulações naturais recuperam a proposta e a revisão observadas", () => {
  const history = [{ role: "assistant" as const, text: proposalAnswer.reply }];
  for (const text of [
    "Era exatamente assim que eu queria descrever o que fazemos.",
    "Fico com essa descrição para representar nosso trabalho.",
    "Desse jeito, quem lê entende direitinho o serviço que a gente oferece. Vamos com essa.",
  ]) {
    const input = { ...context, history, officialNiche, activeProposal: proposal, message: { text, replyToProposalId: proposal.id } };
    const data = JSON.parse(String(prepared(input).request.input));
    assert.equal(data.message, text);
    assert.deepEqual(data.activeProposal, { description: proposed, linkedToMessage: true });
    assert.deepEqual(success(input, acceptance).confirmation, {
      proposalId: proposal.id, description: proposed, expectedOfficialRevision: "text:3",
    });
    assert.equal(run(input, { ...acceptance, proposal: proposed }).ok, false);
  }
});

test("aceite pode carregar novidade de memória sem substituir a proposta vinculada", () => {
  const input = {
    ...context, officialNiche, activeProposal: proposal,
    message: { text: "Sim, esse é o nosso nicho. Também atendemos empresas de pequeno porte.", replyToProposalId: proposal.id },
  };
  const memory: ModelTurn["memory"] = [
    { kind: "declaration", text: "Também atende empresas de pequeno porte.", replaces: null, sourceId: null },
  ];
  const output = { ...acceptance, memory };
  const confirmation = {
    proposalId: proposal.id, description: proposed, expectedOfficialRevision: proposal.expectedOfficialRevision,
  };
  assert.deepEqual(success(input, output), { ...output, confirmation });
  assert.deepEqual(success(input, { ...output, memory: [memory[0], memory[0]] }), {
    ...acceptance, confirmation,
  });
});

test("aceite antigo, sem vínculo, de outra proposta ou com revisão divergente é recusado pelo código", () => {
  const input: NicheTurnContext = { ...context, officialNiche, activeProposal: proposal,
    history: [{ role: "user", text: "É exatamente o que fazemos." }],
    summary: "O interlocutor aceitou uma proposta anterior." };
  const invalidTurns = [
    { ...input, message: null },
    { ...input, message: { text: "Fico com essa descrição.", replyToProposalId: null } },
    { ...input, message: { text: "Fico com essa descrição.", replyToProposalId: "previous-proposal" } },
    { ...input, activeProposal: { ...proposal, id: "new-proposal" }, message: {
      text: "Fico com essa descrição.", replyToProposalId: proposal.id,
    } },
    { ...input, message: { text: "Fico com essa descrição.", replyToProposalId: proposal.id },
      officialNiche: { ...officialNiche, revision: "text:4" } },
  ];
  for (const turn of invalidTurns) {
    assert.notEqual(JSON.parse(String(prepared(turn).request.input)).activeProposal?.linkedToMessage, true);
    assert.equal(run(turn, acceptance).ok, false);
    assert.equal(success(turn, clarification).confirmation, null);
  }
});

test("dúvida ou relato de terceiros em mensagem vinculada permite esclarecer sem confirmar", () => {
  for (const [text, reply] of [
    ["Acho que sim, mas ainda estou em dúvida sobre a parte dos eventos.", "Qual parte sobre os eventos você ajustaria?"],
    ["Minha sócia disse que a descrição está certa. Eu ainda estou avaliando.", "Tudo bem. Qual ponto você quer avaliar melhor?"],
  ]) {
    const input = { ...context, officialNiche, activeProposal: proposal, message: { text, replyToProposalId: proposal.id } };
    assert.equal(JSON.parse(String(prepared(input).request.input)).activeProposal.linkedToMessage, true);
    assert.deepEqual(success(input, { ...clarification, reply }), { ...clarification, reply, confirmation: null });
  }
});

test("correção registra apenas o trecho superado e preserva contexto válido", () => {
  const summary = "Atua no varejo. Entrega na região metropolitana. Oferece catering vegano.";
  const input = { ...context, summary, officialNiche, activeProposal: proposal, message: {
    text: "Corrigindo: não atuo mais no varejo. Atendo empresas na mesma região.", replyToProposalId: proposal.id,
  } };
  const change: ModelTurn["memory"][number] = {
    kind: "declaration", text: "Atende empresas, sem atuação no varejo.", replaces: "Atua no varejo.", sourceId: null,
  };
  const corrected: ModelTurn = { ...proposalAnswer, reaction: "correct", memory: [change] };
  const output = success(input, corrected);
  assert.deepEqual(output.memory, [change]);
  assert.equal(output.confirmation, null);
  assert.equal(input.summary, summary);
  assert.equal(summary.replace(change.replaces!, change.text),
    "Atende empresas, sem atuação no varejo. Entrega na região metropolitana. Oferece catering vegano.");
  const unsafeBatches: ModelTurn["memory"][] = [
    [{ ...change, replaces: "inventado" }],
    [{ ...change, kind: "hypothesis" }],
    [{ ...change, text: "Oferece catering vegano." }],
    [change, { ...change, text: "Atende apenas empresas.", replaces: "no varejo." }],
  ];
  for (const memory of unsafeBatches) {
    assert.deepEqual(success(input, { ...corrected, memory }), {
      ...corrected, memory: [], confirmation: null,
    });
  }
});

test("retomada envia histórico, Summary, nicho oficial e fatos empresariais separados", () => {
  const input: NicheTurnContext = {
    ...context, message: null, officialNiche, activeProposal: proposal,
    history: [{ role: "user", text: "Enviei pelo e-mail ana@example.com." }],
    summary: "Declaração anterior sobre atuação em festas.",
    businessContext: "Ofertas confirmadas pela empresa: catering corporativo.",
  };
  const request = prepared(input).request;
  const data = JSON.parse(String(request.input));
  assert.equal(data.summary, input.summary);
  assert.equal(data.businessContext, input.businessContext);
  assert.equal(data.officialNiche, officialNiche.description);
  assert.equal(data.history[0].text, "Enviei pelo e-mail [email removido].");
  assert.equal(request.instructions, NICHE_AGENT_INSTRUCTIONS);
  assert.equal(String(request.input).includes("text:3"), false);
  assert.equal(success(input, { ...clarification, reply: "Podemos retomar a conversa sobre os eventos empresariais." }).confirmation, null);
  assert.equal(run(input, proposalAnswer).ok, false, "abrir conversa não cria novidade de memória");
});

test("rejeição ou recusa não inventa aceite nem reapresenta a mesma proposta", () => {
  const input = { ...context, officialNiche, activeProposal: proposal, message: {
    text: "Não quero detalhar o perfil do cliente. Essa proposta não descreve o negócio.", replyToProposalId: proposal.id,
  } };
  const rejected: ModelTurn = { ...clarification, reaction: "reject", reply: "Entendi. Podemos deixar a definição em aberto." };
  const output = success(input, rejected);
  assert.equal(output.confirmation, null);
  assert.equal(output.proposal, null);
  assert.deepEqual(output.memory, []);
  assert.equal(run(input, { ...proposalAnswer, reaction: "reject" }).ok, false);
});

test("preserva a resposta ao descartar memória com fonte externa sem comprovação", () => {
  const input = { ...context, externalSources: [{ id: "public-reference", excerpt: "Catering descreve serviço de alimentação para eventos.", checkedOn: "2026-11-18" }] };
  const change = { kind: "external", text: "Catering é serviço de alimentação para eventos.", replaces: null, sourceId: "public-reference" } as const;
  const output = success(input, { ...clarification, memory: [change] });
  assert.deepEqual(output.memory, [change]);
  assert.equal(output.confirmation, null);
  assert.deepEqual(success(context, { ...clarification, memory: [change] }), { ...clarification, confirmation: null });
  assert.deepEqual(success(input, { ...clarification, memory: [{ ...change, sourceId: "inventada" }] }), {
    ...clarification, confirmation: null,
  });
});

test("resposta inválida, falha e recusa do provider não devolvem efeitos nem alteram contexto", () => {
  const input = { ...context, summary: "Atende empresas." };
  const snapshot = structuredClone(input);
  const parse = prepared(input).parseResponse;
  const cases = [
    [null, "invalid_response"],
    [{ status: "failed", error: { code: "server_error" } }, "provider_error"],
    [{ ...response(proposalAnswer), status: "incomplete" }, "provider_error"],
    [message([{ type: "refusal", refusal: "Refusal" }]), "refusal"],
    [message([{ type: "output_text", text: "invalid JSON" }]), "invalid_response"],
    [response({ ...proposalAnswer, reply: "Sua proposta está pronta." }), "invalid_response"],
    [response({ ...proposalAnswer, reply: "<nicho>", proposal: "<nicho>" }), "invalid_response"],
    [response({ ...proposalAnswer, confirmation: { proposalId: proposal.id } }), "invalid_response"],
  ] as const;
  for (const [payload, kind] of cases) {
    const result = parse(payload);
    assert.ok(!result.ok);
    assert.equal(result.kind, kind);
    assert.equal("value" in result, false);
  }
  assert.deepEqual(input, snapshot);
  assert.deepEqual(prepareNicheTurn({ ...input, summary: "x".repeat(6001) }), { ok: false, kind: "invalid_context" });
});
