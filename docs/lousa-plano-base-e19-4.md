10/08/2026 — Rascunho vivo — E19.4 — Geração e materialização da landing page em `draft`

## 1. Estado do debate

### 1.1. Estado

- Status: rascunho vivo; ainda não consolidado como plano-base v1.
- Recorte: `E19.4 — Geração e materialização da landing page em draft`.
- Plano conceitual: `docs/lp-planejamento.md`.
- Predecessor material: E19.3 concluída e integrada à `main`; sua API pública v1 é a entrada canônica para este debate.
- O roadmap define a E19.4 como o recorte sucessor responsável por geração por IA, validação pós-IA, materialização e visualização mínimas necessárias à primeira LP real em `draft`.
- Gates A e B fechados conceitualmente no nível da futura v1; Gates C, D e E permanecem abertos.
- Este rascunho registra somente decisões aceitas e questões ainda abertas; hipóteses discutidas não se tornam decisões fixas sem aprovação humana explícita.

### 1.2. Objetivo já confirmado

- Consumir a saída real e validada da E19.3 para gerar conteúdo estruturado candidato da primeira LP real.
- Validar deterministicamente a resposta antes de qualquer materialização, limitado ao que os contratos permitem comprovar objetivamente.
- Materializar a LP no `draft` já existente, preservando snapshot suficiente das fontes e decisões efetivamente usadas.
- Tornar a primeira LP real avaliável por visualização mínima, sem antecipar publicação, tracking, analytics ou editor visual.
- Usar o mesmo fluxo oficial para conta piloto e clientes; não criar LP teste, geração administrativa paralela ou autorização especial por conta.

### 1.3. Fontes obrigatórias do debate

- `README.md`.
- `docs/lp-planejamento.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/prompt-estrategista.md`.
- `docs/gestor-automations.md`.
- `docs/automations.md`.
- `docs/lousa-plano-base-e19-3.md`.
- Contrato público vigente de `lib/lp-builder/`, especialmente `generationContextContracts.ts` e a API E19.3 integrada à `main`.
- Contratos vigentes de E18.4 e E18.5 para semantic roles, fields, cardinalidades, policies, bindings e referências técnicas.
- Repositório `AlcinoAfonso/LP-Factory-10`.

## 2. Base confirmada para o contrato da E19.4

### 2.1. Entrada canônica

- A E19.4 não recompõe E10.8, E18.4, E18.5, E20.2 ou E20.3.
- A entrada funcional deve partir do sucesso completo da E19.3: Parte A determinística + Parte B de matéria-prima autorizada.
- Parte A já contém identidade da LP, plano, taxon, proveniência do perfil, versões, root, seleção estrutural e módulos efetivos.
- Parte B já contém pesquisa autorizada, fatos autorizados, suporte de capabilities, `generationGuidance` quando presente e contexto por módulo.
- Falha da E19.3 não autoriza iniciar a operação geracional nem materialização parcial.

### 2.2. Independência da LP após materialização

- As fontes canônicas governam a geração e futuras edições assistidas pela LP Factory.
- Depois de materializada, a LP possui estado próprio.
- Edição manual futura pode divergir das recomendações de geração sem alterar fontes canônicas ou outras LPs.
- Versões futuras das fontes canônicas não passam a reger silenciosamente a LP já materializada; adoção exige ação explícita.
- Somente restrições classificadas pelo contrato responsável como permanentes continuam obrigatórias após a materialização.

### 2.3. Limites já confirmados

- Não reabrir E18.4, E18.5, E20.2, E20.3 ou E19.2 sem bloqueio real demonstrado pela primeira geração.
- Não criar fluxo especial para a conta piloto.
- Não antecipar publicação pública, domínio customizado, tracking, analytics/dashboard, CRM, A/B test ou Google Ads.
- Não antecipar editor visual completo, regeneração ampla, edição assistida por IA, agente, memória, job, fila ou automação recorrente.
- Não criar abstração geral de geração multicanal; o consumidor atual é `landing_page`.
- Não criar camada de auditoria semântica, segunda IA revisora ou provenance cognitiva declarada pela própria IA apenas para aparentar garantia factual.

### 2.4. Automação aprovada para a futura v1

- Automação: sim.
- Categoria: Automação com IA em fluxo controlado.
- Participação humana: uma ação humana explícita inicia cada operação geracional da LP completa.
- Função da IA: produzir conteúdo somente para os fields já autorizados pelo pacote da E19.3.
- Função determinística: estrutura, módulos, variantes, ordem, autorização de fontes/fatos, validação pós-IA objetivamente comprovável, decisão de materialização e persistência permanecem sob contratos do LP Factory.
- Não adotar comportamento agentic, decisão estrutural pela IA, geração funcional por módulo, conversa persistente ou materialização parcial nesta primeira versão.
- O mecanismo técnico concreto de OpenAI e seus parâmetros ficam para a v2 e para a avaliação formal do Gestor de Automação, sem reabrir a categoria aprovada salvo necessidade comprovada.

## 3. Fluxo lógico em construção

### 3.1. Gatilho

- Decisão fixa: uma ação humana explícita inicia uma operação geracional para a LP completa.
- Questão aberta: definir a superfície mínima dessa ação no espaço operacional da LP `draft`, sem inventar rota ou UI antes do Gate D.

### 3.2. Entrada

- LP `draft` legítima e vinculada à configuração concluída.
- Resultado de sucesso da API pública E19.3 para essa LP.
- Configuração OpenAI server-side vigente e autorizada pelo projeto no momento da implementação.

### 3.3. Processamento

- A unidade funcional de geração é a LP completa.
- A IA produz conteúdo somente para os fields autorizados dos módulos já selecionados pela E19.3.
- A IA não escolhe novos módulos, variantes, ordem, capabilities, fontes ou fatos fora do pacote autorizado.
- Não existe geração funcional independente por módulo nesta primeira versão.
- Uma operação geracional da LP completa não obriga, na v1, uma topologia técnica específica de chamadas ao provider.
- Responses API, Structured Outputs, schema exato, modelo, `reasoning.effort`, retry e tratamento específico de estados do provider permanecem detalhamento da v2.
- Guardrails semânticos de treatments, fidelidade factual e uso das fontes autorizadas orientam a geração; não se tornam automaticamente validadores determinísticos de texto livre.

### 3.4. Validação

- A candidata integral deve ser validada server-side antes de qualquer materialização.
- A validação bloqueante cobre somente o que os contratos permitem comprovar objetivamente: identidade e ordem dos módulos, variante e fields admitidos, tipos, cardinalidades, obrigatoriedade, `absoluteMax`, bindings, referências técnicas e existência/autorização de fontes e evidências estruturadas exigidas pelo contrato.
- Faixas recomendadas de texto orientam a geração; somente o limite absoluto contratado é bloqueante nesta primeira versão.
- Destinos operacionais, assets, URLs e referências técnicas sob autoridade determinística não podem ser inventados pela IA; quando necessários, são resolvidos ou confirmados server-side pelos bindings e evidências autorizadas.
- Para `action`, a IA pode produzir somente conteúdo textual admitido, como label; o binding operacional permanece server-side.
- A proveniência confiável da geração é o conjunto de fontes e evidências que o sistema autorizou e expôs ao field, somado à proveniência já preservada pela E19.3; a primeira versão não exige que a IA declare quais fontes afirma ter usado cognitivamente.
- `operational_evidence` e referências técnicas permanecem exceção estrutural: quando o contrato exigir referência concreta, ela deve existir e ser resolvida/validada pelo servidor.
- Para `required_when_claimed` e suporte factual, o servidor valida disponibilidade e autorização do suporte quando isso é objetivamente exigível pelo contrato; não afirma provar semanticamente, pelo texto livre, se uma frase fez um claim factual que deveria ter usado determinado suporte.
- Treatments permitidos, restritos ou proibidos funcionam como guardrails semânticos de geração e revisão humana; sua presença ou ausência em texto livre não é apresentada como garantia determinística sem mecanismo específico aprovado.
- Qualquer violação objetivamente verificável invalida a candidata integral.
- Field opcional pode estar ausente; se estiver presente e estruturalmente inválido, não é removido silenciosamente.
- Não há reparo semântico automático, descarte silencioso de field ou módulo, nem materialização parcial.
- A fidelidade editorial, factual e semântica da primeira LP é validada humanamente na visualização antes de qualquer futura publicação.

### 3.5. Persistência

- O estado atual de `account_landing_pages` guarda apenas identidade mínima e status `draft`; não existe hoje conteúdo materializado da LP nesse contrato.
- A E19.4 precisa preservar conteúdo estruturado e snapshot suficiente, mas o formato físico e a residência ainda são questões abertas deste debate.
- Nenhuma tabela, coluna ou nova entidade está autorizada antes do fechamento do Gate C.

### 3.6. Consumo

- A primeira LP materializada precisa ser visualmente avaliável no fluxo oficial da conta.
- Questão aberta: definir a menor visualização capaz de validar a LP real sem antecipar publicação ou editor visual.

### 3.7. Fallback

- Falha da compilação E19.3 bloqueia a operação geracional.
- Candidata que viole qualquer regra objetivamente bloqueante do Gate B é rejeitada integralmente e não altera o conteúdo materializado da LP.
- Não há reparo semântico, omissão silenciosa ou materialização parcial como fallback.
- A regra anterior é funcional e não presume atomicidade física de banco ou uma única chamada ao provider.
- Questão aberta do Gate C: definir a garantia física de preservação do estado anterior e o snapshot mínimo da materialização válida.

## 4. Gates do debate

### 4.1. Gate A — unidade de geração e contrato da IA

- Status: conceitualmente fechado no nível da futura v1.
- Categoria aprovada: Automação com IA em fluxo controlado.
- Unidade funcional: LP completa.
- Gatilho: uma ação humana explícita inicia uma única operação geracional.
- A IA produz somente conteúdo para os fields já autorizados pela E19.3.
- Sem geração funcional por módulo, comportamento agentic, decisão estrutural pela IA ou materialização parcial.
- Recursos avançados como PTC, multi-agent, persisted reasoning, Agents SDK e prompt caching não são requisitos deste recorte e só podem ser reavaliados diante de necessidade material demonstrada.
- Fica para a v2: mecanismo OpenAI concreto, quantidade/topologia de chamadas, Structured Outputs e schema exato, modelo e effort, retry, tratamento de refusal/incomplete/error, validação técnica do provider, observabilidade e custo específicos.

### 4.2. Gate B — validação pós-IA

- Status: conceitualmente fechado no nível da futura v1.
- A candidata integral é validada server-side em tudo que os contratos permitem comprovar objetivamente: identidade e ordem dos módulos, fields admitidos, tipos, cardinalidades, obrigatoriedade, limites absolutos, bindings, referências técnicas e existência/autorização das fontes e evidências estruturadas.
- Destinos operacionais e referências técnicas permanecem sob autoridade determinística e não são inventados pela IA.
- Guardrails de natureza semântica — incluindo fidelidade factual do texto e treatments permitidos, restritos ou proibidos — orientam a geração, mas não são apresentados como garantias determinísticas quando o código não puder prová-los.
- A proveniência confiável registra o conjunto de fontes autorizadas e expostas à geração e as referências estruturais exigidas pelo contrato; não exige declaração cognitiva da IA sobre fontes supostamente usadas.
- Ausência de suporte estrutural ou referência concreta objetivamente exigida bloqueia; interpretação semântica de claims em texto livre não é fingida como regra determinística.
- Qualquer violação objetivamente verificável invalida a candidata integral; não há reparo semântico, omissão silenciosa ou materialização parcial.
- A fidelidade editorial e semântica da primeira LP é validada humanamente.

### 4.3. Gate C — materialização e snapshot

- Status: aberto.
- Definir o estado materializado mínimo da LP.
- Separar conteúdo atual da LP do snapshot das fontes/contratos usados na geração.
- Definir proveniência e versionamento suficientes para futuras edição, regeneração e adoção explícita de novas fontes, sem antecipar esses fluxos.
- Decidir a residência física somente depois de confirmar o contrato lógico necessário.
- Garantir fisicamente que uma geração inválida ou falha não substitua nem deixe estado parcial como se fosse materialização válida.

### 4.4. Gate D — visualização mínima da primeira LP

- Status: aberto.
- Definir o menor renderer/preview necessário para avaliação humana da LP materializada.
- Preservar responsividade, acessibilidade e guardrails visuais vigentes sem transformar a E19.4 em editor visual ou publicação pública.
- Definir evidências esperadas para desktop, mobile e teclado quando houver frontend.

### 4.5. Gate E — fronteira da primeira entrega

- Status: aberto.
- Confirmar se a E19.4 termina em `gerar → validar → materializar → visualizar` ou se algum passo adicional é indispensável para considerar a primeira LP real avaliável.
- Revisão editorial, correção manual, regeneração, edição assistida e publicação permanecem fora até demonstração de necessidade indispensável neste debate.

## 5. Próxima decisão do debate

- Seguir para o Gate C — materialização e snapshot.
- O Gate C deve fechar o estado lógico materializado e o snapshot mínimo antes de escolher sua residência física e antes de definir o renderer do Gate D.
- Não consolidar plano-base v1 enquanto permanecer questão indispensável aberta para executar a E19.4 com segurança e sem inventar contrato.
